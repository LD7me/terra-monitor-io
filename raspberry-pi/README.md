# Raspberry Pi Controller

Local-only Flask + SQLite backend. Reads sensor data from the Arduino over
USB serial, stores every reading in `terramonitor.db`, drives the relays,
and serves the HTTP API the dashboard polls.

No cloud, no auth, no external services — everything lives on the Pi.

## Files

| File                | Purpose                                                |
| ------------------- | ------------------------------------------------------- |
| `app.py`             | Flask API + SQLite storage + GPIO control + automation |
| `serial_monitor.py`  | Reads and parses JSON sensor lines from the Arduino     |
| `requirements.txt`   | Python dependencies                                     |

## GPIO pin map (BCM numbering)

| Device      | BCM Pin | Physical Pin | Notes                              |
| ----------- | ------- | -------------- | ------------------------------------ |
| Pump        | 18      | 12             | Irrigation relay                    |
| Fan         | 23      | 16             | Ventilation relay                   |
| Grow light  | 24      | 18             | DLI-triggered relay                 |
| Door servo  | 12      | 32             | Manual open/close (AngularServo)    |

Relay VCC → 5V (physical pin 2), relay GND → GND (physical pin 6).
Relays default **active-high** (`RELAY_ACTIVE_LOW = False` in `app.py`) —
flip that constant if your relay board is active-low.

```
Arduino (sensors only)  --USB serial-->  Raspberry Pi
                                            ├── GPIO18 → Relay → Pump
                                            ├── GPIO23 → Relay → Fan
                                            ├── GPIO24 → Relay → Grow light
                                            └── GPIO12 → Servo → Door
```

## Install

```bash
cd ~/raspberry-pi
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
source venv/bin/activate
python3 app.py
```

The API listens on `0.0.0.0:5000` by default. Find the Pi's IP with
`hostname -I` and enter it in the dashboard's connection settings.

Useful environment overrides:

```bash
export TERRAMONITOR_DB="/path/to/terramonitor.db"   # default: ./terramonitor.db
export TERRAMONITOR_HOST="0.0.0.0"
export TERRAMONITOR_PORT="5000"
```

You should see logs like:

```
=== TerraMonitor Pi (LOCAL) ===
[db] ready at /home/pi/raspberry-pi/terramonitor.db
[settings] loaded {...}
[gpio] init {'irrigation': 18, 'fan': 23, 'grow_light': 24} (active_low=False)
[serial] Using port: /dev/ttyACM0 @ 115200
[push] T=24.6 H=55.0 soil=Dry dli=8.42
[exec] fan -> ON (auto:temp_high)
```

If the Arduino or GPIO isn't detected, `app.py` logs a warning and falls
back to **mock mode** (synthetic sensor readings) so the dashboard still
has something to show without hardware attached.

## Run on boot

```bash
sudo nano /etc/systemd/system/terramonitor.service
```

```ini
[Unit]
Description=TerraMonitor Pi Controller
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/raspberry-pi
ExecStart=/home/pi/raspberry-pi/venv/bin/python3 /home/pi/raspberry-pi/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now terramonitor.service
sudo systemctl status terramonitor.service
```

## Automation thresholds

Read/write live via `GET`/`POST /api/settings` (also editable from the
dashboard's **Settings** page). Defaults, defined in `app.py`:

| Setting            | Default | Meaning                                   |
| ------------------- | ------- | ------------------------------------------- |
| `TEMP_ON`           | 30 °C   | Fan turns ON above this                    |
| `TEMP_OFF`          | 25 °C   | Fan turns OFF below this                   |
| `SOIL_DRY_ADC_ON`   | 330     | Soil ADC below this → pump ON              |
| `SOIL_WET_ADC_OFF`  | 370     | Soil ADC above this → pump OFF             |
| `DLI_THRESHOLD`     | 14      | Target daily light integral (mol/m²/day)   |

See the [main README](../README.md) for the full automation logic and HTTP
API reference.

## Troubleshooting

| Problem                          | Fix                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `Permission denied: /dev/ttyACM0` | `sudo usermod -a -G dialout $USER`, then log out/in or reboot          |
| Arduino not found                 | `ls /dev/tty*` with the board plugged in vs unplugged to spot it       |
| No sensor data                    | Check the Arduino sketch is printing JSON lines at 115200 baud         |
| Relay doesn't switch               | Check `RELAY_ACTIVE_LOW` matches your relay board                     |
| Dashboard shows "Offline"          | Confirm the Pi's IP/port in the dashboard match `hostname -I` output   |
