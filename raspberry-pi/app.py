"""
TerraMonitor Pi controller — LOCAL ONLY (SQLite + Flask)

What it does
------------
1. Reads sensor JSON from the Arduino over USB serial (sensor_module.ino).
2. Stores readings every PUSH_INTERVAL seconds in a local SQLite database.
3. Exposes an HTTP API (Flask) that the dashboard polls directly:
     GET  /api/status                   -> health + uptime
     GET  /api/sensors                  -> latest reading + device states
     GET  /api/history?hours=24         -> raw readings for the window
     GET  /api/consumption?days=7       -> daily power (Wh) + water (L) totals
     POST /api/irrigation/<on|off>      -> toggle pump  (GPIO 18)
     POST /api/fan/<on|off>             -> toggle fan   (GPIO 23)
     POST /api/grow_light/<on|off>      -> toggle light (GPIO 24)

Power model (assumed nameplate ratings)
---------------------------------------
   pump        =  5 W
   fan         = 15 W
   grow_light  =  5 W
Wh accumulated per device = (W * seconds_on) / 3600

Water model
-----------
   pump drips at 60 mL/s while ON
   mL accumulated = 60 * seconds_on

"""

import os
import sqlite3
import threading
import time
from datetime import datetime, timezone, timedelta
from contextlib import closing
from gpiozero import AngularServo

from flask import Flask, jsonify, request
from flask_cors import CORS

# Optional hardware imports — fall back to a stub on a dev machine
try:
    import RPi.GPIO as GPIO
    HAS_GPIO = True
except Exception:
    HAS_GPIO = False
    print("[gpio] RPi.GPIO not available — running in MOCK mode")

try:
    from serial_monitor import ArduinoSensor
    HAS_SERIAL = True
except Exception as e:
    HAS_SERIAL = False
    print(f"[serial] serial_monitor unavailable ({e}) — running in MOCK mode")


# ============================================================
#  CONFIG
# ============================================================
DB_PATH = os.environ.get("TERRAMONITOR_DB", os.path.join(os.path.dirname(__file__), "terramonitor.db"))
HTTP_HOST = os.environ.get("TERRAMONITOR_HOST", "0.0.0.0")
HTTP_PORT = int(os.environ.get("TERRAMONITOR_PORT", "5000"))
PUSH_INTERVAL = 5  # seconds between sensor inserts

# Soil ADC -> percentage calibration
SOIL_DRY_ADC = 600
SOIL_WET_ADC = 280

# GPIO pin map (BCM)    
PIN_DOOR = 12
PIN_PUMP = 18
PIN_FAN = 23
PIN_GROW_LIGHT = 24
DEVICE_PINS = {"irrigation": PIN_PUMP, "fan": PIN_FAN, "grow_light": PIN_GROW_LIGHT}
RELAY_ACTIVE_LOW = False

# Power & water rates
DEVICE_POWER_W = {"irrigation": 5.0, "fan": 15.0, "grow_light": 5.0}
PUMP_FLOW_ML_PER_S = 60.0
door_servo = AngularServo(PIN_DOOR, min_angle=0, max_angle=90, min_pulse_width=0.0005, max_pulse_width=0.0025)


# ============================================================
#  DATABASE
# ============================================================
DDL = """
CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    soil_pct REAL,
    soil_label TEXT,
    lux REAL,
    ppfd REAL,
    dli REAL,
    is_day INTEGER
);
CREATE INDEX IF NOT EXISTS idx_readings_ts ON readings(ts);

CREATE TABLE IF NOT EXISTS device_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    device TEXT NOT NULL,
    state INTEGER NOT NULL,  -- 1 = on, 0 = off
    reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_device_events_ts ON device_events(device, ts);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value REAL NOT NULL
);
"""


def _ensure_reason_column():
    """Add `reason` column to device_events if upgrading from an older schema."""
    with closing(db()) as c:
        cols = [r["name"] for r in c.execute("PRAGMA table_info(device_events)").fetchall()]
        if "reason" not in cols:
            c.execute("ALTER TABLE device_events ADD COLUMN reason TEXT")
            c.commit()
            print("[db] migrated device_events: +reason")

_db_lock = threading.Lock()


def db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with closing(db()) as c:
        c.executescript(DDL)
        c.commit()
    _ensure_reason_column()
    print(f"[db] ready at {DB_PATH}")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ============================================================
#  GPIO
# ============================================================
device_state = {"irrigation": False, "fan": False, "grow_light": False}


def relay_write(pin: int, on: bool):
    if not HAS_GPIO:
        return
    if RELAY_ACTIVE_LOW:
        GPIO.output(pin, GPIO.LOW if on else GPIO.HIGH)
    else:
        GPIO.output(pin, GPIO.HIGH if on else GPIO.LOW)


def setup_gpio():
    if not HAS_GPIO:
        return
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    for pin in DEVICE_PINS.values():
        GPIO.setup(pin, GPIO.OUT)
        relay_write(pin, False)
    print(f"[gpio] init {DEVICE_PINS} (active_low={RELAY_ACTIVE_LOW})")


def set_device(device: str, on: bool, reason: str = "auto"):
    pin = DEVICE_PINS.get(device)
    if pin is None:
        raise ValueError(f"unknown device {device}")
    if device_state[device] == on:
        return False  # no change, no event logged
    relay_write(pin, on)
    device_state[device] = on
    with _db_lock, closing(db()) as c:
        c.execute(
            "INSERT INTO device_events (ts, device, state, reason) VALUES (?, ?, ?, ?)",
            (now_iso(), device, 1 if on else 0, reason),
        )
        c.commit()
    print(f"[exec] {device} -> {'ON' if on else 'OFF'} ({reason})")
    return True

# ============================================================
#  AUTOMATION THRESHOLDS (user-adjustable via /api/settings)
# ============================================================
SETTINGS = {
    "TEMP_ON": 30.0,            # °C — fan turns on above this
    "TEMP_OFF": 25.0,           # °C — fan turns off below this
    "SOIL_DRY_ADC_ON": 330.0,   # ADC below this = dry, pump on
    "SOIL_WET_ADC_OFF": 370.0,  # ADC above this = wet, pump off
    "DLI_THRESHOLD": 14.0,      # target daily light integral
}

def load_settings():
    with closing(db()) as c:
        rows = c.execute("SELECT key, value FROM settings").fetchall()
        for r in rows:
            if r["key"] in SETTINGS:
                SETTINGS[r["key"]] = float(r["value"])
    print(f"[settings] loaded {SETTINGS}")

def save_settings(updates: dict):
    with _db_lock, closing(db()) as c:
        for k, v in updates.items():
            if k in SETTINGS:
                SETTINGS[k] = float(v)
                c.execute(
                    "INSERT INTO settings(key,value) VALUES(?,?) "
                    "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                    (k, float(v)),
                )
        c.commit()
    print(f"[settings] updated -> {SETTINGS}")

GROW_LIGHT_DURATION_S = 2 * 60 * 60  # 2 hours in seconds
EFFECTIVE_LED_PPFD = 150          # estimated effective PPFD
LED_DLI_PER_HOUR = (EFFECTIVE_LED_PPFD * 3600) / 1_000_000

auto_state = {
    "was_day": None,
    "grow_light_start": 0,
    "grow_light_duration": 0,
    "daytime_max_dli": 0.0,       # Captures the highest DLI before Arduino wipes it
    "overrides": {
        "irrigation": False,      # True means manually locked
        "fan": False,
        "grow_light": False
    }
}
device_state["door"] = False  # False = Closed, True = Open
auto_state["overrides"]["door"] = False

# ============================================================
#  SENSOR THREAD
# ============================================================
latest_reading = {}

def set_door(is_open):
    """Moves the servo and then cuts the signal to prevent buzzing/overheating."""
    if is_open:
        door_servo.angle = 90
    else:
        door_servo.angle = 0
        
    device_state["door"] = is_open
    
    # Pro-tip: MG996R servos buzz loudly when holding position. 
    # Waiting 1 second for it to move, then dropping the signal stops the buzzing.
    time.sleep(2.5)

def soil_to_pct_label(adc):
    if not isinstance(adc, (int, float)):
        return None, "Unknown"
    rng = SOIL_DRY_ADC - SOIL_WET_ADC
    pct = None
    if rng:
        pct = max(0.0, min(100.0, round((SOIL_DRY_ADC - adc) / rng * 100.0, 1)))
    if adc < 330:
        label = "Dry"
    elif adc > 370 and adc <800:
        label = "Wet"
    else:
        label = "waterlogged"
    return pct, label


def store_reading(r):
    pct, label = soil_to_pct_label(r.get("soil"))
    row = {
        "ts": now_iso(),
        "temperature": r.get("temp"),
        "humidity": r.get("humidity", 0),
        "soil_pct": pct,
        "soil_label": label,
        "lux": r.get("lux"),
        "ppfd": r.get("ppfd"),
        "dli": r.get("dli"),
        "is_day": 1 if r.get("is_day") else 0 if r.get("is_day") is not None else None,
    }
    with _db_lock, closing(db()) as c:
        c.execute(
            "INSERT INTO readings (ts, temperature, humidity, soil_pct, soil_label, lux, ppfd, dli, is_day)"
            " VALUES (:ts, :temperature, :humidity, :soil_pct, :soil_label, :lux, :ppfd, :dli, :is_day)",
            row,
        )
        c.commit()
    latest_reading.update(row)
    print(f"[push] T={row['temperature']} H={row['humidity']} soil={label} dli={row['dli']}")

def evaluate_auto_logic(reading):
    """Evaluates sensor thresholds with infinite manual override support."""
    temp = reading.get("temp")
    adc = reading.get("soil")
    
    # FIX: Parse Arduino integers (1/0) into strict Python booleans (True/False)
    is_day_raw = reading.get("is_day")
    is_day = None
    if is_day_raw is not None:
        is_day = True if is_day_raw in (1, True, "1") else False
        
    dli = reading.get("dli")
    now = time.time()
    overrides = auto_state["overrides"]

    # --- 0. DAY/NIGHT TRANSITIONS & DLI CACHING ---
    if is_day is not None:
        # Sunrise Edge (Only reset variables the EXACT moment day starts)
        if auto_state["was_day"] is False and is_day is True:
            auto_state["daytime_max_dli"] = 0.0
            if auto_state["grow_light_start"] == -1:
                auto_state["grow_light_start"] = 0
                
        # Live Caching: track highest DLI before Arduino wipes it at night
        if is_day is True and dli is not None:
            if dli > auto_state["daytime_max_dli"]:
                auto_state["daytime_max_dli"] = dli

    # --- 1. FAN & TEMP CONTROL ---
    if temp is not None:
        if overrides["fan"]:
            if temp > SETTINGS["TEMP_ON"] and device_state["fan"]:
                overrides["fan"] = False
            elif temp < SETTINGS["TEMP_OFF"] and not device_state["fan"]:
                overrides["fan"] = False

        if not overrides["fan"]:
            if temp > SETTINGS["TEMP_ON"] and not device_state["irrigation"]:
                set_device("fan", True, reason="auto:temp_high")
                if not overrides["irrigation"]:
                    set_device("irrigation", False, reason="auto:pump_priority")
            elif temp < SETTINGS["TEMP_OFF"] and device_state["fan"]:
                set_device("fan", False, reason="auto:temp_low")

    # --- 2. SOIL & PUMP CONTROL ---
    if adc is not None:
        if overrides["irrigation"]:
            if adc < SETTINGS["SOIL_DRY_ADC_ON"] and device_state["irrigation"]:
                overrides["irrigation"] = False
            elif adc > SETTINGS["SOIL_WET_ADC_OFF"] and not device_state["irrigation"]:
                overrides["irrigation"] = False

        if not overrides["irrigation"]:
            if adc < SETTINGS["SOIL_DRY_ADC_ON"] and not device_state["irrigation"] and not device_state["fan"]:
                set_device("irrigation", True, reason="auto:soil_dry")
            elif adc > SETTINGS["SOIL_WET_ADC_OFF"] and device_state["irrigation"]:
                set_device("irrigation", False, reason="auto:soil_wet")

    # --- 3. GROW LIGHT (Sunset Event & Tracking) ---
    if is_day is not None:
        if overrides["grow_light"] and is_day is True and not device_state["grow_light"]:
            overrides["grow_light"] = False

        if not overrides["grow_light"]:
            is_sunset = (auto_state["was_day"] is True and is_day is False)
            is_night_fallback = (is_day is False and auto_state["was_day"] is None and auto_state["grow_light_start"] == 0)

            if (is_sunset or is_night_fallback) and not device_state["grow_light"]:
                final_dli = auto_state["daytime_max_dli"] if auto_state["daytime_max_dli"] > 0 else (dli or 0)
                
                if final_dli < SETTINGS["DLI_THRESHOLD"]:
                    missing_dli = SETTINGS["DLI_THRESHOLD"] - final_dli
                    hours_needed = (missing_dli / LED_DLI_PER_HOUR) * 1.2
                    hours_needed = max(0.5, min(hours_needed, 4.0))
                    duration_s = hours_needed * 3600

                    print(f"[auto] Sunset evaluated. Peak Daytime DLI={final_dli:.2f}, Light ON for {hours_needed:.2f}h")
                    set_device("grow_light", True, reason="auto:dli_low")
                    auto_state["grow_light_start"] = now
                    auto_state["grow_light_duration"] = duration_s
                else:
                    print(f"[auto] Sunset evaluated. Peak Daytime DLI={final_dli:.2f} is sufficient.")
                    auto_state["grow_light_start"] = -1  # Dummy tracker

    # Keep track of history state frame-by-frame
    if is_day is not None:
        auto_state["was_day"] = is_day

    # --- 4. GROW LIGHT TIMER ---
    if device_state["grow_light"] and auto_state["grow_light_start"] > 0:
        if overrides["grow_light"]:
            auto_state["grow_light_start"] = 0
            auto_state["grow_light_duration"] = 0
        else:
            elapsed = now - auto_state["grow_light_start"]
            if elapsed >= auto_state["grow_light_duration"]:
                print("[auto] Dynamic grow light cycle complete. OFF.")
                set_device("grow_light", False, reason="auto:timer_done")
                auto_state["grow_light_start"] = 0
                auto_state["grow_light_duration"] = 0

    # # --- 5. REALTIME DOOR SCHEDULE (7AM Close / 7PM Open) ---
    # current_hour = datetime.now().hour
    # door_currently_open = device_state["door"]
    # overrides = auto_state["overrides"]

    # # Release manual override naturally if the time matches the current state
    # if overrides["door"]:
    #     if (current_hour >= 19 or current_hour < 7) and door_currently_open:
    #         overrides["door"] = False # Matches night open schedule
    #     elif (7 <= current_hour < 19) and not door_currently_open:
    #         overrides["door"] = False # Matches day close schedule

    # # Run schedule if no manual override is active
    # if not overrides["door"]:
    #     # Night Rule: From 7:00 PM (19) to 6:59 AM, the door should be OPEN
    #     if (current_hour >= 19 or current_hour < 7) and not door_currently_open:
    #         print("[schedule] 7:00 PM reached. Opening door.")
    #         set_door(True)
            
    #     # Day Rule: From 7:00 AM (7) to 6:59 PM (18:59), the door should be CLOSED
    #     elif (7 <= current_hour < 19) and door_currently_open:
    #         print("[schedule] 7:00 AM reached. Closing door.")
    #         set_door(False)
                
def sensor_loop():
    arduino = None
    if HAS_SERIAL:
        try:
            arduino = ArduinoSensor()
        except Exception as e:
            print(f"[serial] init failed ({e}) — MOCK mode")
            arduino = None

    last_push = 0
    cached = {}  # Start as an empty dictionary
    
    while True:
        try:
            if arduino:
                d = arduino.read()
                if d:
                    cached = d
                    print(cached)
                print(d)
            else:
                # MOCK: synthesize a reading so the dashboard has something
                cached = {"temp": 22.5, "humidity": 55, "soil": 420, "lux": 800, "ppfd": 200, "dli": 12, "is_day": True}

            now = time.time()
            
            if cached:
                # 1. Run the automatic thresholds
                evaluate_auto_logic(cached)
                
                # 2. Push to database at the requested interval
                if now - last_push >= PUSH_INTERVAL:
                    store_reading(cached)
                    last_push = now
                    
            time.sleep(0.2)
        except Exception as e:
            print(f"[sensor] error: {e}")
            time.sleep(1)


# ============================================================
#  CONSUMPTION CALCULATION
# ============================================================
def compute_consumption(days: int = 7):
    """
    Returns a list (length=days) of {date, power_wh, water_ml, by_device:{...}}
    Walks device_events and accumulates ON-duration per local day.
    Open intervals (still ON now) are closed at 'now'.
    """
    end = datetime.now(timezone.utc)
    start = (end - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    # Pre-build day buckets keyed by local date string
    buckets = {}
    for i in range(days):
        d = (start + timedelta(days=i)).date().isoformat()
        buckets[d] = {
            "date": d,
            "power_wh": 0.0,
            "water_ml": 0.0,
            "by_device": {k: {"on_seconds": 0.0, "wh": 0.0} for k in DEVICE_PINS},
        }

    with closing(db()) as c:
        # Pull all events from a bit before the window so we can detect
        # devices that were already ON at window start.
        rows = c.execute(
            "SELECT ts, device, state FROM device_events"
            " WHERE ts >= ? ORDER BY device, ts ASC",
            ((start - timedelta(days=1)).isoformat(),),
        ).fetchall()

    # Group by device
    by_dev = {k: [] for k in DEVICE_PINS}
    for r in rows:
        if r["device"] in by_dev:
            by_dev[r["device"]].append((datetime.fromisoformat(r["ts"]), r["state"]))

    for device, events in by_dev.items():
        # Walk pairs (on -> off). If an ON has no OFF, close at 'now'.
        on_at = None
        for ts, state in events:
            if state == 1 and on_at is None:
                on_at = ts
            elif state == 0 and on_at is not None:
                _accumulate(buckets, device, on_at, ts, start, end)
                on_at = None
        if on_at is not None:
            _accumulate(buckets, device, on_at, end, start, end)

    # Round for clean JSON
    out = []
    for d in sorted(buckets):
        b = buckets[d]
        b["power_wh"] = round(b["power_wh"], 2)
        b["water_ml"] = round(b["water_ml"], 1)
        for dev in b["by_device"].values():
            dev["on_seconds"] = round(dev["on_seconds"], 1)
            dev["wh"] = round(dev["wh"], 2)
        out.append(b)
    return out


def _accumulate(buckets, device, on_at, off_at, window_start, window_end):
    """Split the [on_at, off_at) interval across day buckets within the window."""
    a = max(on_at, window_start)
    b = min(off_at, window_end)
    if b <= a:
        return
    cursor = a
    while cursor < b:
        # End of this local day (UTC midnight boundary — keeps it simple)
        day_end = (cursor.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1))
        slice_end = min(day_end, b)
        secs = (slice_end - cursor).total_seconds()
        date_key = cursor.date().isoformat()
        if date_key in buckets:
            wh = DEVICE_POWER_W[device] * secs / 3600.0
            buckets[date_key]["by_device"][device]["on_seconds"] += secs
            buckets[date_key]["by_device"][device]["wh"] += wh
            buckets[date_key]["power_wh"] += wh
            if device == "irrigation":
                buckets[date_key]["water_ml"] += PUMP_FLOW_ML_PER_S * secs
        cursor = slice_end


# ============================================================
#  HTTP API
# ============================================================
app = Flask(__name__)
CORS(app)
START_TIME = time.time()


@app.route("/api/status")
def api_status():
    return jsonify({
        "status": "ok",
        "uptime_s": int(time.time() - START_TIME),
        "has_gpio": HAS_GPIO,
        "has_serial": HAS_SERIAL,
        "devices": device_state,
    })


def _last_irrigation_ts():
    with closing(db()) as c:
        row = c.execute(
            "SELECT ts FROM device_events WHERE device='irrigation' AND state=1"
            " ORDER BY ts DESC LIMIT 1"
        ).fetchone()
    return row["ts"] if row else None


@app.route("/api/sensors")
def api_sensors():
    if not latest_reading:
        return jsonify({"ready": False, "devices": device_state})
    return jsonify({
        "ready": True,
        "timestamp": latest_reading.get("ts"),
        "temperature": latest_reading.get("temperature"),
        "humidity": latest_reading.get("humidity"),
        "soil_moisture": latest_reading.get("soil_label"),
        "soil_moisture_percentage": latest_reading.get("soil_pct"),
        "light_intensity": latest_reading.get("lux"),
        "lux": latest_reading.get("lux"),
        "ppfd": latest_reading.get("ppfd"),
        "dli": latest_reading.get("dli"),
        "is_day": bool(latest_reading.get("is_day")) if latest_reading.get("is_day") is not None else None,
        "last_irrigation": _last_irrigation_ts(),
        "devices": device_state,
    })


@app.route("/api/events")
def api_events():
    limit = max(1, min(500, int(request.args.get("limit", 50))))
    with closing(db()) as c:
        rows = c.execute(
            "SELECT ts, device, state, reason FROM device_events"
            " ORDER BY ts DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/history")
def api_history():
    hours = int(request.args.get("hours", 24))
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    with closing(db()) as c:
        rows = c.execute(
            "SELECT ts, temperature, humidity, soil_pct, soil_label, lux, ppfd, dli"
            " FROM readings WHERE ts >= ? ORDER BY ts ASC",
            (since,),
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/consumption")
def api_consumption():
    days = max(1, min(30, int(request.args.get("days", 7))))
    return jsonify({
        "days": days,
        "power_w": DEVICE_POWER_W,
        "pump_flow_ml_per_s": PUMP_FLOW_ML_PER_S,
        "daily": compute_consumption(days),
    })


def _control(device, action):
    if action not in ("on", "off"):
        return jsonify({"error": "action must be on|off"}), 400
    try:
        is_on = (action == "on")
        
        if device == "door":
            set_door(is_on) 
            changed = True
        else:
            changed = set_device(device, is_on, reason="manual")

        # Engage a hard manual override lock
        auto_state["overrides"][device] = True
        print(f"[manual] {device} is now LOCKED in manual mode")

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"status": "ok", "device": device, "action": action, "changed": changed})


@app.route("/api/irrigation/<action>", methods=["POST"])
def api_irrigation(action):
    return _control("irrigation", action)


@app.route("/api/fan/<action>", methods=["POST"])
def api_fan(action):
    return _control("fan", action)


@app.route("/api/grow_light/<action>", methods=["POST"])
def api_grow_light(action):
    return _control("grow_light", action)

@app.route("/api/door/<action>", methods=["POST"])
def api_door(action):
    return _control("door", action)


@app.route("/api/settings", methods=["GET"])
def api_get_settings():
    return jsonify(SETTINGS)


@app.route("/api/settings", methods=["POST"])
def api_post_settings():
    data = request.get_json(silent=True) or {}
    updates = {}
    for k in SETTINGS.keys():
        if k in data:
            try:
                updates[k] = float(data[k])
            except (TypeError, ValueError):
                return jsonify({"error": f"{k} must be a number"}), 400
    if not updates:
        return jsonify({"error": "no valid keys provided"}), 400
    save_settings(updates)
    return jsonify(SETTINGS)


# ============================================================
#  MAIN
# ============================================================
def main():
    print("=== TerraMonitor Pi (LOCAL) ===")
    init_db()
    load_settings()
    setup_gpio()
    t = threading.Thread(target=sensor_loop, daemon=True)
    t.start()
    try:
        app.run(host=HTTP_HOST, port=HTTP_PORT, threaded=True)
    finally:
        if HAS_GPIO:
            for pin in DEVICE_PINS.values():
                relay_write(pin, False)
            GPIO.cleanup()
        print("[main] bye.")


if __name__ == "__main__":
    main()
