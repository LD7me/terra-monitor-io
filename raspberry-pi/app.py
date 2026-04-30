"""
Raspberry Pi controller — TerraMonitor

Responsibilities:
1. Read sensor JSON from Arduino over USB serial (sensor_module.ino).
2. Push readings (temp, humidity, soil, lux, ppfd, dli, is_day) to Supabase.
3. Poll Supabase for pending device_commands and drive GPIO relays:
       Pump        -> GPIO 18 (BCM)
       Fan         -> GPIO 23 (BCM)
       Grow Light  -> GPIO 24 (BCM)
4. Mark commands as 'executed' once the relay is switched.

Auto-control logic (irrigation, fan, grow light) lives in the
'check-irrigation' Supabase Edge Function, which queues commands here.
"""

import os
import time
import json
import requests
import RPi.GPIO as GPIO
from datetime import datetime, timezone

from serial_monitor import ArduinoSensor

# ============================================================
#  CONFIG — fill these in for your Pi
# ============================================================
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://skorxurbkdwfwgigegez.supabase.co")
SUPABASE_ANON_KEY = os.environ.get(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrb3J4dXJia2R3ZndnaWdlZ2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzE5ODksImV4cCI6MjA3OTE0Nzk4OX0.l6ujyIyECylWfnqTRUszQhvPchXkYYNm4zm_ir2GtdI",
)
USER_ID = os.environ.get("TERRAMONITOR_USER_ID", "d2b2193b-ecf1-4822-a071-be1e8a89a45d")

# How often (seconds) to push readings and poll commands
PUSH_INTERVAL = 5
POLL_INTERVAL = 2

# Soil ADC -> percentage calibration (from combined_sensors.ino)
#   wet (lots of water)  ~ low ADC
#   dry (no water)       ~ high ADC
SOIL_DRY_ADC = 600
SOIL_WET_ADC = 280

# ============================================================
#  GPIO PIN MAP (BCM numbering)
# ============================================================
PIN_PUMP = 18        # Irrigation pump relay
PIN_FAN = 23         # Ventilation fan relay
PIN_GROW_LIGHT = 24  # Grow light relay

DEVICE_PINS = {
    "irrigation": PIN_PUMP,
    "fan": PIN_FAN,
    "grow_light": PIN_GROW_LIGHT,
}

# Most relay modules are ACTIVE-LOW (LOW = ON). Flip if yours is active-high.
RELAY_ACTIVE_LOW = False


def relay_write(pin: int, on: bool):
    if RELAY_ACTIVE_LOW:
        GPIO.output(pin, GPIO.LOW if on else GPIO.HIGH)
    else:
        GPIO.output(pin, GPIO.HIGH if on else GPIO.LOW)


def setup_gpio():
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    for pin in DEVICE_PINS.values():
        GPIO.setup(pin, GPIO.OUT)
        relay_write(pin, False)  # default OFF
    print(f"[gpio] Initialised pins {DEVICE_PINS} (active_low={RELAY_ACTIVE_LOW})")


# ============================================================
#  Supabase REST helpers (PostgREST)
# ============================================================
def sb_headers():
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def push_reading(reading: dict):
    """Insert one row into sensor_readings."""
    soil_adc = reading.get("soil")
    soil_pct = None
    soil_label = "Unknown"
    if isinstance(soil_adc, (int, float)):
        # Map ADC to 0–100% (clamped)
        rng = SOIL_DRY_ADC - SOIL_WET_ADC
        if rng != 0:
            pct = (SOIL_DRY_ADC - soil_adc) / rng * 100.0
            soil_pct = max(0.0, min(100.0, round(pct, 1)))
        if soil_adc < 330:
            soil_label = "Wet"
        elif soil_adc > 370:
            soil_label = "Dry"
        else:
            soil_label = "Moist"

    payload = {
        "user_id": USER_ID,
        "temperature": reading.get("temp"),
        "humidity": reading.get("humidity", 0),  # DHT11 humidity if you add it; default 0
        "soil_moisture": soil_label,
        "soil_moisture_percentage": soil_pct,
        "light_intensity": reading.get("lux"),
        "lux": reading.get("lux"),
        "ppfd": reading.get("ppfd"),
        "dli": reading.get("dli"),
        "is_day": bool(reading.get("is_day")) if reading.get("is_day") is not None else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/sensor_readings",
            headers=sb_headers(),
            data=json.dumps(payload),
            timeout=10,
        )
        if r.status_code >= 300:
            print(f"[push] failed {r.status_code}: {r.text}")
        else:
            print(f"[push] OK  T={payload['temperature']} soil={soil_label} dli={payload['dli']}")
    except Exception as e:
        print(f"[push] error: {e}")


def fetch_pending_commands():
    """Pull all pending device_commands for this user."""
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/device_commands"
            f"?user_id=eq.{USER_ID}&status=eq.pending"
            f"&select=id,device,action,created_at&order=created_at.asc",
            headers=sb_headers(),
            timeout=10,
        )
        if r.status_code != 200:
            print(f"[poll] failed {r.status_code}: {r.text}")
            return []
        return r.json() or []
    except Exception as e:
        print(f"[poll] error: {e}")
        return []


def mark_executed(command_id: str):
    try:
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/device_commands?id=eq.{command_id}",
            headers=sb_headers(),
            data=json.dumps({
                "status": "executed",
                "executed_at": datetime.now(timezone.utc).isoformat(),
            }),
            timeout=10,
        )
        if r.status_code >= 300:
            print(f"[exec] mark failed {r.status_code}: {r.text}")
    except Exception as e:
        print(f"[exec] mark error: {e}")


def execute_command(cmd: dict):
    device = cmd.get("device")
    action = cmd.get("action")
    cmd_id = cmd.get("id")

    pin = DEVICE_PINS.get(device)
    if pin is None:
        print(f"[exec] unknown device '{device}', skipping")
        return

    on = (action == "on")
    relay_write(pin, on)
    print(f"[exec] {device} -> {action.upper()} (GPIO {pin})")
    mark_executed(cmd_id)


# ============================================================
#  Main loop
# ============================================================
def main():
    print("=== TerraMonitor Pi controller ===")
    setup_gpio()
    arduino = ArduinoSensor()

    last_push = 0
    last_poll = 0
    latest_reading = None

    try:
        while True:
            now = time.time()

            # Drain serial — keep newest reading
            data = arduino.read()
            if data:
                latest_reading = data

            # Push readings to cloud at PUSH_INTERVAL
            if latest_reading and now - last_push >= PUSH_INTERVAL:
                push_reading(latest_reading)
                last_push = now

            # Poll commands at POLL_INTERVAL
            if now - last_poll >= POLL_INTERVAL:
                cmds = fetch_pending_commands()
                for c in cmds:
                    execute_command(c)
                last_poll = now

            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n[main] stopping...")
    finally:
        # Safe shutdown — turn everything OFF
        for pin in DEVICE_PINS.values():
            relay_write(pin, False)
        GPIO.cleanup()
        arduino.close()
        print("[main] GPIO cleaned up, bye.")


if __name__ == "__main__":
    main()
