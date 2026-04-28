# Arduino → Raspberry Pi: Read Sensor Data via USB (Step-by-Step)

Arduino is plugged into the Pi's USB. Follow these steps in order.

---

## ✅ Step 1: Upload the sensor sketch to the Arduino (one time)

Do this on a **PC/laptop with the Arduino IDE** installed (easiest), then plug the board into the Pi.

1. Open Arduino IDE → **Tools → Manage Libraries** → install **"DHT sensor library" by Adafruit** (and its dependency *Adafruit Unified Sensor*).
2. Open a new sketch, paste the code below, and upload to the Arduino Uno.

```cpp
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11
#define LIGHT_PIN A0
#define SOIL_PIN 7   // digital soil moisture sensor

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
  pinMode(SOIL_PIN, INPUT);
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int light = analogRead(LIGHT_PIN);            // 0–1023
  int soilDigital = digitalRead(SOIL_PIN);      // 0 = wet, 1 = dry
  String soil = (soilDigital == 0) ? "WET" : "DRY";

  if (isnan(t) || isnan(h)) { t = 0; h = 0; }

  // CSV format: TEMP,HUMIDITY,LIGHT,SOIL
  Serial.print(t); Serial.print(",");
  Serial.print(h); Serial.print(",");
  Serial.print(light); Serial.print(",");
  Serial.println(soil);

  delay(2000);
}
```

3. Open **Tools → Serial Monitor** (baud **9600**). You should see lines like:
   ```
   24.50,55.00,612,DRY
   ```
4. Close the Serial Monitor, **unplug the Arduino**, and plug it into the **Raspberry Pi USB port**.

---

## ✅ Step 2: Find the Arduino's serial port on the Pi

Open a terminal on the Pi and run:

```bash
ls /dev/tty*
```

Look for one of these:
- `/dev/ttyACM0` ← most common for Arduino Uno
- `/dev/ttyUSB0` ← for clones with CH340 chip

Confirm it's the Arduino:

```bash
dmesg | grep -i tty | tail
```

You should see something like `cdc_acm ... now attached to ttyACM0`.

> 📌 Remember the port name (e.g. `/dev/ttyACM0`) — you'll need it below.

---

## ✅ Step 3: Give your user permission to use the serial port

```bash
sudo usermod -a -G dialout $USER
```

Then **log out and back in** (or reboot):

```bash
sudo reboot
```

---

## ✅ Step 4: Quick test — read raw data with `screen`

```bash
sudo apt update
sudo apt install -y screen
screen /dev/ttyACM0 9600
```

You should immediately see lines scrolling like:
```
24.50,55.00,612,DRY
24.60,54.80,610,DRY
```

🎉 **That confirms the Arduino → Pi USB link works.**

To exit `screen`: press `Ctrl + A` then `K` then `Y`.

---

## ✅ Step 5: Read the data with Python (real script)

### 5a. Install Python serial library

```bash
sudo apt install -y python3-pip python3-venv
mkdir -p ~/greenhouse && cd ~/greenhouse
python3 -m venv venv
source venv/bin/activate
pip install pyserial
```

### 5b. Create the reader script

```bash
nano ~/greenhouse/read_arduino.py
```

Paste this:

```python
import serial
import time

PORT = "/dev/ttyACM0"   # change to /dev/ttyUSB0 if needed
BAUD = 9600

ser = serial.Serial(PORT, BAUD, timeout=2)
time.sleep(2)  # give Arduino time to reset after opening port
ser.reset_input_buffer()

print("Reading from Arduino... (Ctrl+C to stop)")

while True:
    try:
        line = ser.readline().decode("utf-8", errors="ignore").strip()
        if not line:
            continue

        parts = line.split(",")
        if len(parts) != 4:
            print("Skipping malformed line:", line)
            continue

        temperature = float(parts[0])
        humidity    = float(parts[1])
        light       = int(parts[2])
        soil        = parts[3]

        print(f"🌡 {temperature}°C | 💧 {humidity}% | ☀ {light} | 🌱 {soil}")

    except KeyboardInterrupt:
        print("\nStopped.")
        break
    except Exception as e:
        print("Error:", e)
        time.sleep(1)

ser.close()
```

### 5c. Run it

```bash
source ~/greenhouse/venv/bin/activate
python ~/greenhouse/read_arduino.py
```

Expected output:
```
Reading from Arduino... (Ctrl+C to stop)
🌡 24.5°C | 💧 55.0% | ☀ 612 | 🌱 DRY
🌡 24.6°C | 💧 54.8% | ☀ 610 | 🌱 DRY
```

---

## ✅ Step 6: (Next) Send the data to your dashboard

Once Step 5 prints values correctly, you're ready to push them to the cloud so they appear in your TerraMonitor dashboard. The full Supabase upload script is in **`raspberry-pi-setup.md` → "Raspberry Pi Python Controller"**. Just replace the `print(...)` line in your script with the Supabase insert code from that file.

---

## 🛠 Troubleshooting

| Problem | Fix |
|---|---|
| `Permission denied: '/dev/ttyACM0'` | You forgot Step 3. Run `sudo usermod -a -G dialout $USER` and reboot. |
| `could not open port` | Wrong port. Re-run `ls /dev/tty*` after plugging Arduino in vs. unplugged to spot the difference. |
| Garbled characters | Wrong baud. Make sure Arduino sketch and Python both use **9600**. |
| `nan` temperature/humidity | DHT11 wiring loose. Check VCC, GND, and DATA on Pin 2. |
| No output at all | Make sure Serial Monitor in Arduino IDE is **closed** — only one program can use the port at a time. |
| Light value always 0 or 1023 | LDR voltage divider wiring issue. Check the 10kΩ resistor to GND on A0. |

---

That's it — once `read_arduino.py` prints clean values, your data acquisition unit is fully working. ✅
