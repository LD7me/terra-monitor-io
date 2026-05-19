# TerraMonitor — Local-first Greenhouse MVP

Arduino sensors → Raspberry Pi (Flask + SQLite) → React dashboard polling the Pi
directly over the local network. No cloud, no auth.

> Graduation-project MVP. Optimised for simplicity, not production.

---

## Architecture

```
[Arduino Uno]  --USB serial-->  [Raspberry Pi]  <--HTTP-->  [React dashboard on laptop]
   DHT11                          Flask + SQLite              (npm run dev)
   Light sensor                   GPIO relays
   Soil ADC                       Auto control + logs
```

* All sensor history and device events are stored in **`terramonitor.db`** on the Pi.
* Dashboard runs on **your laptop** with `npm run dev` so HTTP calls to the Pi
  work without HTTPS mixed-content issues.

---

## Hardware

| Component         | Notes                                                    |
| ----------------- | -------------------------------------------------------- |
| Arduino Uno       | Reads DHT11 (temp/humidity), light sensor, soil ADC      |
| Raspberry Pi      | Runs Flask API, SQLite store, controls relays            |
| Serial USB        | Arduino → Pi data link                                   |
| Relay module      | 3 channels: pump, fan, grow light                        |

**GPIO pin map (BCM):**

| Device     | Pin |
| ---------- | --- |
| Pump       | 18  |
| Fan        | 23  |
| Grow light | 24  |

**Power model (assumed nameplate):** pump 5 W · fan 15 W · grow-light 5 W
**Pump flow:** ~60 mL/s while ON

---

## Pi setup

```sh
cd ~/raspberry-pi
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt   # flask, flask-cors, pyserial, RPi.GPIO
python3 app.py
```

The API listens on `0.0.0.0:5000`. Find the Pi's IP with `hostname -I`.

To run on boot, add a `systemd` unit or simply launch from `~/.bashrc` / `cron @reboot`.

---

## Dashboard setup

```sh
npm install
npm run dev                       # http://localhost:5173
```

Open the dashboard, then in the **Raspberry Pi connection** card enter the Pi's
IP (e.g. `192.168.1.50`) and port `5000`, click **Save & test**.

> ⚠️ Use `npm run dev` (HTTP) not the published HTTPS URL — browsers block HTTPS
> pages from calling plain HTTP devices on your LAN.

---

## HTTP API (served by the Pi)

| Method | Path                                    | Description                                    |
| ------ | --------------------------------------- | ---------------------------------------------- |
| GET    | `/api/status`                           | Health + uptime + device states                |
| GET    | `/api/sensors`                          | Latest reading + last irrigation timestamp     |
| GET    | `/api/history?hours=24`                 | Raw readings for window                        |
| GET    | `/api/consumption?days=7`               | Daily Wh + mL per device                       |
| GET    | `/api/events?limit=50`                  | Recent device events with reason               |
| POST   | `/api/irrigation/<on\|off>`             | Manual pump control (engages manual override)  |
| POST   | `/api/fan/<on\|off>`                    | Manual fan control                             |
| POST   | `/api/grow_light/<on\|off>`             | Manual grow-light control                      |

### Automation rules (Pi)

* **Fan** ON when temp > 30 °C, OFF when < 25 °C.
* **Pump** ON when soil ADC < 330 (Dry), OFF when > 370 (Wet). Paused while fan is ON.
* **Grow light** turns on at sunset if the day's peak DLI < 14 mol/m²/d; runs
  for a duration calculated to make up the deficit (clamped 0.5–4 h).
* Manual control from the dashboard sets a **manual override** for that device.
  The override is released the next time automation and the device agree, or
  (for grow-light) at the next sunrise.

### Event log

Every relay change is written to `device_events(ts, device, state, reason)`:

* `manual` — toggled from the dashboard
* `auto:soil_dry`, `auto:soil_wet`, `auto:temp_high`, `auto:temp_low`,
  `auto:dli_low`, `auto:timer_done`, `auto:pump_priority`

The dashboard's **Activity log** card translates these to human-readable text.

---

## Project tree

```
raspberry-pi/
  app.py              Flask API + SQLite + GPIO + automation
  serial_monitor.py   Arduino USB reader
  requirements.txt
src/
  pages/Dashboard.tsx Main dashboard
  components/         Sensor cards, controls, consumption charts, activity log
  lib/api.ts          HTTP client (talks to the Pi)
```

---

## Lovable project info

URL: <https://lovable.dev/projects/97c25c50-7c76-4f40-9037-3acf3afdfbd3>

Built with Vite + React + TypeScript + Tailwind + shadcn/ui.
