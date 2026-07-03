<div align="center">

# 🌱 TerraMonitor

### Solar-Powered Automated Greenhouse

**CEN 492 Graduation Project · King Saud University, Dept. of Computer Engineering**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Flask](https://img.shields.io/badge/Flask-Python-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Raspberry Pi](https://img.shields.io/badge/Raspberry%20Pi-controller-A22846?logo=raspberrypi&logoColor=white)](https://www.raspberrypi.com/)
[![Arduino](https://img.shields.io/badge/Arduino-Uno-00979D?logo=arduino&logoColor=white)](https://www.arduino.cc/)

<img src="docs/images/physical-setup.jpg" alt="The assembled greenhouse prototype: solar panel, battery, AWG unit, and planted enclosure" width="800">

</div>

A greenhouse that waters, cools, and lights itself. Sensors watch the soil, air, and sun;
a Raspberry Pi decides what to do about it; solar panels keep the lights on; and a
desiccant unit pulls irrigation water straight out of the air. This repo holds the
software — Arduino firmware, Pi controller, and the web dashboard — for the whole build.

<div align="center">
<img src="docs/images/concept-overview.png" alt="System concept overview — solar power, sensing, actuators, AWG, and dashboard" width="800">
</div>

## The build

**Sensing** — DHT11, an FC-28 soil probe, and a VEML7700 light sensor feed an Arduino Uno,
which streams JSON to the Pi over serial every half second.

<img src="docs/images/circuit-diagram.png" alt="Arduino Uno wiring for DHT11, FC-28, and VEML7700" width="560">

**Actuators** — pump, fans, and red/blue grow lights, each on its own MOSFET driver off
the Pi's GPIO.

<img src="docs/images/actuators.jpg" alt="Pump in reservoir, fans on the greenhouse wall, grow-light strips on the roof" width="560">

**Power** — a 280 W solar panel charges a 50 Ah LiFePO4 battery bank through an MPPT
controller, giving the whole system ~1.5 days of off-grid autonomy.

<img src="docs/images/solar-unit.jpg" alt="280W solar panel, 50Ah LiFePO4 battery bank, and MPPT charge controller" width="560">

**Water, out of thin air** — a passive atmospheric water generator: silica gel soaks up
humidity overnight, then a sealed glass-topped box uses solar heat to sweat it back out as
water during the day.

<img src="docs/images/awg-cycle.png" alt="AWG absorption phase at night, release/condensation phase during the day" width="560">
<img src="docs/images/awg-result.jpg" alt="Water collected from a release cycle" width="200">

**Dashboard** — live readings, manual overrides, consumption charts, and an activity log
that explains *why* something turned on. Also runs as a touchscreen kiosk mounted right on
the greenhouse.

<img src="docs/images/dashboard.png" alt="TerraMonitor dashboard: live sensor cards, device control panel, consumption charts, activity log" width="900">
<img src="docs/images/kiosk.jpg" alt="Touchscreen kiosk running the dashboard, mounted on the greenhouse enclosure" width="560">

## How it fits together

```
[Arduino Uno]  --USB serial (JSON)-->  [Raspberry Pi]  <--HTTP-->  [React dashboard]
   sensors                                Flask + SQLite              web or kiosk
                                           relays + automation
```

<img src="docs/images/architecture.png" alt="Software stack: sensing unit, controller unit, and user interface unit" width="460">

Everything is local-first — the Pi stores every reading and device event in SQLite and
serves it over the LAN, no cloud required. Fan, pump, and grow-light thresholds are all
editable live from the dashboard's Settings page.

## Running it

```bash
# Pi controller
cd raspberry-pi
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

```bash
# Dashboard
npm install
npm run dev   # http://localhost:8080
```

Point the dashboard at the Pi's IP from **Settings → Raspberry Pi connection**. More detail
on GPIO pins, systemd, and troubleshooting in [raspberry-pi/README.md](raspberry-pi/README.md).

<details>
<summary><strong>HTTP API</strong></summary>

| Method | Path                        | Description                        |
| ------ | --------------------------- | ------------------------------------ |
| GET    | `/api/status`                | Health + uptime + device states     |
| GET    | `/api/sensors`                | Latest reading + device states      |
| GET    | `/api/history?hours=24`       | Raw readings for the window         |
| GET    | `/api/consumption?days=7`     | Daily Wh + mL per device            |
| GET    | `/api/events?limit=50`        | Recent device events with reason    |
| GET/POST | `/api/settings`             | Read/update automation thresholds   |
| POST   | `/api/irrigation\|fan\|grow_light\|door/<on\|off>` | Manual device control |

</details>

## Team

**Abdulrahman Bin Zuair** (lead) · Badr Owais · Abdulrahman Albulaihi
Advisor: Dr. Abdulwadood Abdulwaheed — KSU College of Computer and Information Sciences

---

<div align="center">
Built with Vite + React + TypeScript + Tailwind + shadcn/ui.
</div>
