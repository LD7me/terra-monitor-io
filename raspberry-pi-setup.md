# Complete Raspberry Pi Setup Guide for Greenhouse Monitoring System

## Hardware Requirements
- Raspberry Pi 3 Model B+
- DHT22 Temperature & Humidity Sensor
- Soil Moisture Sensor
- 5V Relay Module
- Water Pump (12V recommended)
- Jumper Wires
- Breadboard (optional)
- Power Supply for Raspberry Pi
- MicroSD Card (16GB minimum)

---

## Step 1: Operating System Setup

1. **Download Raspberry Pi OS**
   - Download Raspberry Pi OS Lite from: https://www.raspberrypi.com/software/
   - Use Raspberry Pi Imager to flash it to your SD card

2. **Enable SSH**
   - Create an empty file named `ssh` (no extension) in the boot partition
   - This allows remote access to your Pi

3. **Configure WiFi** (if needed)
   - Create `wpa_supplicant.conf` in boot partition:
   ```
   country=US
   ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
   update_config=1
   
   network={
       ssid="YOUR_WIFI_NAME"
       psk="YOUR_WIFI_PASSWORD"
   }
   ```

4. **Boot your Pi**
   - Insert SD card and power on
   - Find IP address: `sudo nmap -sn 192.168.1.0/24` (from another computer)
   - Or connect monitor and run: `hostname -I`

---

## Step 2: Hardware Connections

### DHT22 Temperature & Humidity Sensor
```
DHT22 Pin 1 (VCC)  -> Raspberry Pi Pin 2 (5V)
DHT22 Pin 2 (DATA) -> Raspberry Pi Pin 7 (GPIO 4)
DHT22 Pin 4 (GND)  -> Raspberry Pi Pin 6 (Ground)
```

### Soil Moisture Sensor
```
Sensor VCC  -> Raspberry Pi Pin 4 (5V)
Sensor GND  -> Raspberry Pi Pin 9 (Ground)
Sensor DATA -> Raspberry Pi Pin 11 (GPIO 17)
```

### 5V Relay Module
```
Relay VCC -> Raspberry Pi Pin 1 (3.3V)
Relay GND -> Raspberry Pi Pin 14 (Ground)
Relay IN  -> Raspberry Pi Pin 12 (GPIO 18)
```

### Water Pump Connection to Relay
```
Relay COM -> 12V Power Supply (+)
Relay NO  -> Water Pump (+)
Water Pump (-) -> 12V Power Supply (-)
```

**GPIO Pin Reference:**
```
Pin 1:  3.3V Power
Pin 2:  5V Power
Pin 4:  5V Power
Pin 6:  Ground
Pin 7:  GPIO 4 (DHT22 Data)
Pin 9:  Ground
Pin 11: GPIO 17 (Soil Moisture)
Pin 12: GPIO 18 (Relay Control)
Pin 14: Ground
```

---

## Step 3: Software Installation

### Update System
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Install Python and Dependencies
```bash
# Install Python and pip
sudo apt-get install python3 python3-pip -y

# Install GPIO library
sudo apt-get install python3-rpi.gpio -y

# Install DHT sensor library
sudo pip3 install Adafruit_DHT

# Install Flask for API server
sudo pip3 install Flask flask-cors

# Install additional utilities
sudo pip3 install python-dotenv
```

---

## Step 4: Create Project Files

### Create Project Directory
```bash
mkdir ~/greenhouse-monitor
cd ~/greenhouse-monitor
```

### 1. Sensor Reading Script: `sensors.py`
```python
import Adafruit_DHT
import RPi.GPIO as GPIO
import time
from datetime import datetime

# DHT22 Setup
DHT_SENSOR = Adafruit_DHT.DHT22
DHT_PIN = 4

# Soil Moisture Setup
GPIO.setmode(GPIO.BCM)
MOISTURE_PIN = 17
GPIO.setup(MOISTURE_PIN, GPIO.IN)

# Relay Setup
RELAY_PIN = 18
GPIO.setup(RELAY_PIN, GPIO.OUT)
GPIO.output(RELAY_PIN, GPIO.LOW)  # Start with relay off

def read_dht22():
    """Read temperature and humidity from DHT22"""
    humidity, temperature = Adafruit_DHT.read_retry(DHT_SENSOR, DHT_PIN)
    if humidity is not None and temperature is not None:
        return {
            'temperature': round(temperature, 1),
            'humidity': round(humidity, 1)
        }
    return {'temperature': None, 'humidity': None}

def read_soil_moisture():
    """Read soil moisture status"""
    if GPIO.input(MOISTURE_PIN) == GPIO.HIGH:
        return "Dry"
    else:
        return "Wet"

def get_all_sensor_data():
    """Get all sensor readings"""
    dht_data = read_dht22()
    moisture = read_soil_moisture()
    
    return {
        'temperature': dht_data['temperature'],
        'humidity': dht_data['humidity'],
        'soil_moisture': moisture,
        'timestamp': datetime.now().isoformat()
    }

def control_relay(state):
    """Control relay (True = ON, False = OFF)"""
    if state:
        GPIO.output(RELAY_PIN, GPIO.HIGH)
    else:
        GPIO.output(RELAY_PIN, GPIO.LOW)
    return state

def cleanup():
    """Clean up GPIO on exit"""
    GPIO.cleanup()

if __name__ == "__main__":
    try:
        while True:
            data = get_all_sensor_data()
            print(f"Temperature: {data['temperature']}°C")
            print(f"Humidity: {data['humidity']}%")
            print(f"Soil Moisture: {data['soil_moisture']}")
            print("-" * 30)
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nExiting...")
        cleanup()
```

### 2. Flask API Server: `app.py`
```python
from flask import Flask, jsonify
from flask_cors import CORS
import sensors

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global state for devices
irrigation_state = False
fan_state = False

@app.route('/api/status', methods=['GET'])
def status():
    """Health check endpoint"""
    return jsonify({'status': 'online', 'message': 'Greenhouse monitoring system active'})

@app.route('/api/sensors', methods=['GET'])
def get_sensors():
    """Get current sensor readings"""
    try:
        data = sensors.get_all_sensor_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/irrigation/<action>', methods=['POST'])
def control_irrigation(action):
    """Control irrigation system"""
    global irrigation_state
    try:
        if action == 'on':
            sensors.control_relay(True)
            irrigation_state = True
            return jsonify({'status': 'success', 'message': 'Irrigation turned ON'})
        elif action == 'off':
            sensors.control_relay(False)
            irrigation_state = False
            return jsonify({'status': 'success', 'message': 'Irrigation turned OFF'})
        else:
            return jsonify({'error': 'Invalid action'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/irrigation/status', methods=['GET'])
def irrigation_status():
    """Get irrigation status"""
    return jsonify({'status': 'on' if irrigation_state else 'off'})

@app.route('/api/fan/<action>', methods=['POST'])
def control_fan(action):
    """Control fan system (if you add a second relay)"""
    global fan_state
    try:
        if action == 'on':
            fan_state = True
            return jsonify({'status': 'success', 'message': 'Fan turned ON'})
        elif action == 'off':
            fan_state = False
            return jsonify({'status': 'success', 'message': 'Fan turned OFF'})
        else:
            return jsonify({'error': 'Invalid action'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fan/status', methods=['GET'])
def fan_status():
    """Get fan status"""
    return jsonify({'status': 'on' if fan_state else 'off'})

if __name__ == '__main__':
    try:
        # Run on all network interfaces, port 5000
        app.run(host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        sensors.cleanup()
```

### 3. Auto-start Script: `start.sh`
```bash
#!/bin/bash
cd /home/pi/greenhouse-monitor
sudo python3 app.py
```

Make it executable:
```bash
chmod +x start.sh
```

---

## Step 5: Test Your Setup

### Test Sensors Manually
```bash
cd ~/greenhouse-monitor
sudo python3 sensors.py
```

You should see sensor readings every 2 seconds.

### Test API Server
```bash
sudo python3 app.py
```

From another device on the same network:
```bash
# Get your Pi's IP
hostname -I

# Test endpoints (replace IP_ADDRESS with your Pi's IP)
curl http://IP_ADDRESS:5000/api/status
curl http://IP_ADDRESS:5000/api/sensors
curl -X POST http://IP_ADDRESS:5000/api/irrigation/on
curl -X POST http://IP_ADDRESS:5000/api/irrigation/off
```

---

## Step 6: Auto-Start on Boot

### Create systemd service
```bash
sudo nano /etc/systemd/system/greenhouse.service
```

Add this content:
```ini
[Unit]
Description=Greenhouse Monitoring System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/greenhouse-monitor
ExecStart=/usr/bin/python3 /home/pi/greenhouse-monitor/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable greenhouse.service
sudo systemctl start greenhouse.service
sudo systemctl status greenhouse.service
```

---

## Step 7: Connect React Dashboard

1. Find your Raspberry Pi's IP address:
   ```bash
   hostname -I
   ```

2. Open the React dashboard in your browser

3. Go to the Dashboard page

4. Enter your Pi's IP address in the System Configuration card

5. Click "Test Connection" to verify

6. You should now see real-time sensor data!

---

## Troubleshooting

### Sensors not reading?
- Check wiring connections
- Verify GPIO pins match the code
- Run `gpio readall` to check pin status
- Try `sudo python3 sensors.py` to test directly

### API not accessible?
- Check if Flask is running: `sudo systemctl status greenhouse`
- Check firewall: `sudo ufw status`
- Verify Pi's IP address hasn't changed
- Make sure you're on the same network

### Relay not working?
- Check relay LED indicator
- Verify relay is getting power
- Test relay manually: `python3 -c "import RPi.GPIO as GPIO; GPIO.setmode(GPIO.BCM); GPIO.setup(18, GPIO.OUT); GPIO.output(18, GPIO.HIGH)"`

### Service won't start?
- Check logs: `sudo journalctl -u greenhouse -f`
- Verify Python path: `which python3`
- Check file permissions: `ls -la /home/pi/greenhouse-monitor/`

---

## Security Notes

- Change default Pi password: `passwd`
- Keep system updated: `sudo apt-get update && sudo apt-get upgrade`
- Use strong WiFi password
- Consider using HTTPS for production
- Don't expose Pi directly to internet without proper security

---

## Next Steps

1. ✅ Set up hardware connections
2. ✅ Install software
3. ✅ Test sensors
4. ✅ Start API server
5. ✅ Connect React dashboard
6. 📈 Monitor your greenhouse!

**Your graduation project is ready!** 🎓🌱
