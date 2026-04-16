# Complete Setup Guide — Arduino Uno + Raspberry Pi Greenhouse System

## System Architecture

```
[Arduino Uno] --Serial USB--> [Raspberry Pi] --HTTPS--> [Supabase Cloud] <--HTTPS-- [Web Dashboard]
   Sensors                     Controller                  Database               React Frontend
```

**Arduino Uno** — Data Acquisition Unit
- DHT11 → Temperature & Humidity
- Light Sensor → Light intensity (analog)
- Soil Moisture Sensor → Digital moisture detection

**Raspberry Pi** — Main Controller
- Reads sensor data from Arduino via Serial (USB)
- Processes & analyzes data, makes decisions
- Controls actuators via Relay Module (irrigation pump, cooling fans)
- Pushes data to cloud, polls for commands

---

## Hardware Requirements

- Arduino Uno
- Raspberry Pi 3 Model B+ (or newer)
- DHT11 Temperature & Humidity Sensor
- Light Dependent Resistor (LDR) + 10kΩ resistor
- Soil Moisture Sensor (digital output)
- 2-Channel 5V Relay Module
- Water Pump (12V recommended)
- DC Fan (12V)
- USB Cable (A to B) for Arduino ↔ Pi
- Jumper Wires & Breadboard
- Power Supplies (5V for Pi, 12V for pump/fan)

---

## Step 1: Arduino Wiring

### DHT11 Sensor
```
DHT11 VCC  → Arduino 5V
DHT11 DATA → Arduino Digital Pin 2
DHT11 GND  → Arduino GND
```

### Light Sensor (LDR)
```
LDR one leg  → Arduino 5V
LDR other leg → Arduino A0 + 10kΩ resistor to GND
```

### Soil Moisture Sensor
```
Sensor VCC  → Arduino 5V
Sensor GND  → Arduino GND
Sensor DO   → Arduino Digital Pin 7
```

---

## Step 2: Arduino Sketch

Upload this sketch to Arduino Uno using the Arduino IDE:

```cpp
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11
#define LIGHT_PIN A0
#define SOIL_PIN 7

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
  pinMode(SOIL_PIN, INPUT);
}

void loop() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int lightValue = analogRead(LIGHT_PIN);
  int soilDigital = digitalRead(SOIL_PIN);

  String soilStatus = (soilDigital == LOW) ? "Wet" : "Dry";

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("ERROR:DHT_READ_FAIL");
  } else {
    // Format: TEMP,HUMIDITY,LIGHT,SOIL_STATUS
    Serial.print(temperature, 1);
    Serial.print(",");
    Serial.print(humidity, 1);
    Serial.print(",");
    Serial.print(lightValue);
    Serial.print(",");
    Serial.println(soilStatus);
  }

  delay(5000); // Read every 5 seconds
}
```

**Arduino IDE Setup:**
1. Install the "DHT sensor library" by Adafruit (Sketch → Include Library → Manage Libraries)
2. Select Board: Arduino Uno
3. Select correct COM port
4. Upload sketch

---

## Step 3: Raspberry Pi Wiring (Relay Module)

```
Relay VCC  → Pi Pin 2 (5V)
Relay GND  → Pi Pin 6 (Ground)
Relay IN1  → Pi Pin 12 (GPIO 18) — Irrigation pump
Relay IN2  → Pi Pin 16 (GPIO 23) — Cooling fan
```

### Actuator Connections
```
Relay 1 COM → 12V Power (+)    |  Relay 1 NO → Water Pump (+)  |  Pump (-) → 12V (-)
Relay 2 COM → 12V Power (+)    |  Relay 2 NO → DC Fan (+)      |  Fan (-)  → 12V (-)
```

---

## Step 4: Raspberry Pi OS Setup

1. Flash Raspberry Pi OS Lite to SD card using Raspberry Pi Imager
2. Enable SSH: create empty `ssh` file in boot partition
3. Configure WiFi in boot partition (`wpa_supplicant.conf`):
```
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="YOUR_WIFI_NAME"
    psk="YOUR_WIFI_PASSWORD"
}
```
4. Boot, find IP with `hostname -I`

---

## Step 5: Pi Software Installation

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install python3 python3-pip python3-venv -y

mkdir ~/greenhouse-monitor && cd ~/greenhouse-monitor
python3 -m venv venv
source venv/bin/activate

pip install pyserial requests python-dotenv RPi.GPIO
```

---

## Step 6: Pi Python Script — `app.py`

```python
import serial
import json
import time
import os
import requests
import RPi.GPIO as GPIO
from datetime import datetime

# === CONFIGURATION ===
SERIAL_PORT = "/dev/ttyACM0"  # Arduino USB port (check with: ls /dev/tty*)
BAUD_RATE = 9600
SUPABASE_URL = "https://skorxurbkdwfwgigegez.supabase.co"
SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"
USER_ID = "YOUR_USER_ID"  # Get from dashboard after login

# Relay GPIO pins
IRRIGATION_PIN = 18
FAN_PIN = 23

# === GPIO SETUP ===
GPIO.setmode(GPIO.BCM)
GPIO.setup(IRRIGATION_PIN, GPIO.OUT)
GPIO.setup(FAN_PIN, GPIO.OUT)
GPIO.output(IRRIGATION_PIN, GPIO.LOW)
GPIO.output(FAN_PIN, GPIO.LOW)

# === SERIAL CONNECTION ===
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
time.sleep(2)  # Wait for Arduino to reset

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def read_arduino():
    """Read sensor data from Arduino via Serial"""
    try:
        line = ser.readline().decode("utf-8").strip()
        if line.startswith("ERROR"):
            print(f"Arduino error: {line}")
            return None

        parts = line.split(",")
        if len(parts) == 4:
            return {
                "temperature": float(parts[0]),
                "humidity": float(parts[1]),
                "light_intensity": int(parts[2]),
                "soil_moisture": parts[3],
            }
    except Exception as e:
        print(f"Serial read error: {e}")
    return None


def push_to_supabase(data):
    """Push sensor reading to Supabase"""
    payload = {
        "user_id": USER_ID,
        "temperature": data["temperature"],
        "humidity": data["humidity"],
        "light_intensity": data["light_intensity"],
        "soil_moisture": data["soil_moisture"],
    }
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/sensor_readings",
            headers=headers,
            json=payload,
            timeout=10,
        )
        if r.status_code in [200, 201]:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Data pushed OK")
        else:
            print(f"Push error {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Push error: {e}")


def poll_commands():
    """Check Supabase for pending device commands"""
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/device_commands"
            f"?user_id=eq.{USER_ID}&status=eq.pending&order=created_at.asc",
            headers=headers,
            timeout=10,
        )
        if r.status_code == 200:
            commands = r.json()
            for cmd in commands:
                execute_command(cmd)
    except Exception as e:
        print(f"Command poll error: {e}")


def execute_command(cmd):
    """Execute a device command"""
    device = cmd["device"]
    action = cmd["action"]
    pin = IRRIGATION_PIN if device == "irrigation" else FAN_PIN

    if action == "on":
        GPIO.output(pin, GPIO.HIGH)
        print(f"{device} turned ON")
    elif action == "off":
        GPIO.output(pin, GPIO.LOW)
        print(f"{device} turned OFF")

    # Mark command as executed
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/device_commands?id=eq.{cmd['id']}",
        headers=headers,
        json={"status": "executed", "executed_at": datetime.now().isoformat()},
    )


# === MAIN LOOP ===
print("Greenhouse Monitor started!")
print(f"Reading from Arduino on {SERIAL_PORT}")

try:
    while True:
        data = read_arduino()
        if data:
            print(
                f"T={data['temperature']}°C  H={data['humidity']}%  "
                f"L={data['light_intensity']}  Soil={data['soil_moisture']}"
            )
            push_to_supabase(data)

        poll_commands()
        time.sleep(5)

except KeyboardInterrupt:
    print("\nShutting down...")
finally:
    GPIO.cleanup()
    ser.close()
```

---

## Step 7: Configure & Run

1. **Find your Arduino port:**
```bash
ls /dev/tty*
# Usually /dev/ttyACM0 or /dev/ttyUSB0
```

2. **Set your credentials** in `app.py`:
   - `SUPABASE_KEY`: Your anon key
   - `USER_ID`: Your user ID from the dashboard

3. **Run:**
```bash
cd ~/greenhouse-monitor
source venv/bin/activate
python3 app.py
```

---

## Step 8: Auto-Start on Boot

```bash
sudo nano /etc/systemd/system/greenhouse.service
```

```ini
[Unit]
Description=Greenhouse Monitoring System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/greenhouse-monitor
ExecStart=/home/pi/greenhouse-monitor/venv/bin/python3 /home/pi/greenhouse-monitor/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable greenhouse.service
sudo systemctl start greenhouse.service
sudo systemctl status greenhouse.service
```

---

## Troubleshooting

### Arduino not detected?
- Check USB cable (use data cable, not charge-only)
- `ls /dev/ttyACM*` or `ls /dev/ttyUSB*`
- Add user to dialout group: `sudo usermod -a -G dialout pi`

### No serial data?
- Open Arduino IDE Serial Monitor at 9600 baud to verify output
- Check DHT11 wiring (data pin needs pull-up resistor on some modules)

### Relay not switching?
- Check relay LED indicators
- Test GPIO manually: `python3 -c "import RPi.GPIO as GPIO; GPIO.setmode(GPIO.BCM); GPIO.setup(18, GPIO.OUT); GPIO.output(18, GPIO.HIGH)"`

### Data not appearing in dashboard?
- Check `USER_ID` matches your login
- Check Supabase anon key is correct
- Check `sudo journalctl -u greenhouse -f` for errors

---

## Security Notes

- Change default Pi password: `passwd`
- Keep system updated: `sudo apt-get update && sudo apt-get upgrade`
- Use strong WiFi password
- Never expose Pi directly to the internet

---

**Your graduation project is ready!** 🎓🌱
