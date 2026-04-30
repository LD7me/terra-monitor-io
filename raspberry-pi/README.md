# Raspberry Pi Controller — Setup

This folder runs on the Raspberry Pi 3 B+. It replaces the relay logic that
used to live on the Arduino (`combined_sensors.ino`). The Arduino now only
**reads sensors** (`sensor_module.ino`) and the Pi handles **all control
decisions + relay switching**.

## GPIO pin map (BCM numbering)

| Device       | BCM Pin | Physical Pin | Notes                |
|--------------|---------|--------------|----------------------|
| Pump (relay) | **18**  | 12           | Irrigation           |
| Fan (relay)  | **23**  | 16           | Ventilation          |
| Grow light   | **24**  | 18           | DLI-triggered (≤12 mol/m²) |

All three connect to the same relay module's IN pins. Most relay boards
are **active-low** — the script handles that via `RELAY_ACTIVE_LOW = True`.
Flip it to `False` if your relay is active-high.

Common: relay module **VCC → 5V (Pi pin 2)**, **GND → GND (Pi pin 6)**.

## Wiring summary

```
Arduino (sensors only)  --USB-->  Raspberry Pi
                                     ├── GPIO18 → Relay IN1 → Pump
                                     ├── GPIO23 → Relay IN2 → Fan
                                     └── GPIO24 → Relay IN3 → Grow Light
```

## Install

```bash
sudo apt update
sudo apt install -y python3-venv python3-rpi.gpio
cd ~/raspberry-pi
python3 -m venv venv
source venv/bin/activate
pip install pyserial requests RPi.GPIO
```

## Configure

Edit `app.py` (or export env vars) and set:

```bash
export TERRAMONITOR_USER_ID="<your-supabase-user-uuid>"
```

Find your user UUID by signing in to the dashboard and checking your
profile, or query `auth.users` from the cloud backend.

## Run

```bash
source venv/bin/activate
python3 app.py
```

You should see logs like:

```
=== TerraMonitor Pi controller ===
[gpio] Initialised pins {'irrigation': 18, 'fan': 23, 'grow_light': 24}
[serial] Using port: /dev/ttyUSB0 @ 115200
[push] OK  T=24.6 soil=Moist dli=8.42
[exec] grow_light -> ON (GPIO 24)
```

## Auto-control thresholds

Set them from the web dashboard → **Alert Configuration**. The
`check-irrigation` edge function reads them from `alert_configurations`
and queues commands the Pi then executes. Defaults:

- Soil moisture: 30% – 70%
- Fan ON: temp > tempMax (35°C) or humidity > humidityMax (80%)
- Grow light ON: at sunset (`is_day = false`) when `dli < 12 mol/m²`,
  auto-OFF after 2 h of runtime
