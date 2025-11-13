import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Cpu, Database, Wifi, Terminal, CheckCircle, Download } from "lucide-react";
import { downloadSetupFiles } from "@/lib/downloadSetup";
import { toast } from "sonner";

const Documentation = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-4">Documentation</h1>
              <p className="text-lg text-muted-foreground">
                Complete guide to building and deploying your greenhouse monitoring system
              </p>
            </div>
            <Button 
              size="lg"
              className="gap-2"
              onClick={async () => {
                toast.info("Preparing download...");
                await downloadSetupFiles();
                toast.success("Setup files downloaded!");
              }}
            >
              <Download className="h-5 w-5" />
              Download All Files
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="hardware">Hardware</TabsTrigger>
              <TabsTrigger value="software">Software</TabsTrigger>
              <TabsTrigger value="setup">Setup Guide</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Architecture</CardTitle>
                  <CardDescription>How all the components work together</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    The greenhouse monitoring system consists of three main layers:
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Cpu className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Hardware Layer</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Raspberry Pi with connected sensors (DHT22, soil moisture) and relay modules for device control
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border-2 border-secondary/20 bg-secondary/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-5 w-5 text-secondary" />
                        <h3 className="font-semibold">Backend Layer</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Python Flask server reading sensors via GPIO and exposing REST API endpoints
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border-2 border-accent/20 bg-accent/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Wifi className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold">Frontend Layer</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        React dashboard consuming the API and displaying real-time data with device controls
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Required Components</CardTitle>
                  <CardDescription>What you'll need to build this system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Raspberry Pi (3/4/Zero W)", desc: "Main controller with GPIO pins" },
                      { name: "DHT22 Sensor", desc: "Temperature and humidity measurement" },
                      { name: "Soil Moisture Sensor", desc: "Digital or analog moisture detection" },
                      { name: "Relay Module (5V)", desc: "Control irrigation pumps and fans" },
                      { name: "Jumper Wires", desc: "Connect components to GPIO pins" },
                      { name: "Power Supply", desc: "5V 2.5A+ for Raspberry Pi" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hardware Setup Tab */}
            <TabsContent value="hardware" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Hardware Wiring</CardTitle>
                  <CardDescription>Step-by-step connection guide for all components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-amber-600 mb-2">⚠️ Important Safety Notes</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Power off Raspberry Pi before making connections</li>
                      <li>• Double-check pin connections before powering on</li>
                      <li>• Never connect high voltage directly to GPIO pins</li>
                      <li>• Use proper power supply (5V 2.5A+ for Pi 3)</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>DHT22 Temperature & Humidity Sensor</Badge>
                      </div>
                      <div className="space-y-2 font-mono text-sm mb-3">
                        <p><span className="text-primary font-bold">Pin 1 (VCC)</span> → Raspberry Pi Pin 2 (5V Power)</p>
                        <p><span className="text-primary font-bold">Pin 2 (DATA)</span> → Raspberry Pi Pin 7 (GPIO 4)</p>
                        <p><span className="text-primary font-bold">Pin 4 (GND)</span> → Raspberry Pi Pin 6 (Ground)</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Note: DHT22 Pin 3 is not used. Some DHT22 modules have built-in pull-up resistors.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/5 border-2 border-secondary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>Soil Moisture Sensor</Badge>
                      </div>
                      <div className="space-y-2 font-mono text-sm mb-3">
                        <p><span className="text-secondary font-bold">VCC</span> → Raspberry Pi Pin 4 (5V Power)</p>
                        <p><span className="text-secondary font-bold">DATA (D0)</span> → Raspberry Pi Pin 11 (GPIO 17)</p>
                        <p><span className="text-secondary font-bold">GND</span> → Raspberry Pi Pin 9 (Ground)</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Digital output: HIGH = Dry soil, LOW = Wet soil. Adjust sensitivity with onboard potentiometer.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-accent/5 border-2 border-accent/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>5V Relay Module (for Irrigation)</Badge>
                      </div>
                      <div className="space-y-2 font-mono text-sm mb-3">
                        <p><span className="text-accent font-bold">VCC</span> → Raspberry Pi Pin 1 (3.3V) or Pin 2 (5V)</p>
                        <p><span className="text-accent font-bold">IN</span> → Raspberry Pi Pin 12 (GPIO 18)</p>
                        <p><span className="text-accent font-bold">GND</span> → Raspberry Pi Pin 14 (Ground)</p>
                      </div>
                      <div className="mt-3 p-3 bg-background rounded border">
                        <p className="text-xs font-semibold mb-2">Connecting Water Pump to Relay:</p>
                        <div className="space-y-1 text-xs font-mono">
                          <p><span className="text-accent">COM</span> → 12V Power Supply (+)</p>
                          <p><span className="text-accent">NO (Normally Open)</span> → Water Pump (+)</p>
                          <p><span className="text-muted-foreground">Pump (-)</span> → 12V Power Supply (-)</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
                      <p className="font-semibold mb-3 text-sm">📍 GPIO Pin Quick Reference</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 bg-background rounded">Pin 1: 3.3V Power</div>
                        <div className="p-2 bg-background rounded">Pin 2: 5V Power</div>
                        <div className="p-2 bg-background rounded">Pin 4: 5V Power</div>
                        <div className="p-2 bg-background rounded">Pin 6: Ground</div>
                        <div className="p-2 bg-background rounded text-primary font-bold">Pin 7: GPIO 4 (DHT22)</div>
                        <div className="p-2 bg-background rounded">Pin 9: Ground</div>
                        <div className="p-2 bg-background rounded text-secondary font-bold">Pin 11: GPIO 17 (Moisture)</div>
                        <div className="p-2 bg-background rounded text-accent font-bold">Pin 12: GPIO 18 (Relay)</div>
                        <div className="p-2 bg-background rounded">Pin 14: Ground</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Software Tab */}
            <TabsContent value="software" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: System Update</CardTitle>
                  <CardDescription>Update Raspberry Pi OS packages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                    <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                      <Terminal className="h-4 w-4" />
                      <span>Terminal</span>
                    </div>
                    <pre className="text-foreground whitespace-pre-wrap">
{`sudo apt-get update
sudo apt-get upgrade -y`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Install Dependencies</CardTitle>
                  <CardDescription>Python libraries for sensors and API</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                    <pre className="text-foreground whitespace-pre-wrap">
{`# Install Python and pip
sudo apt-get install python3 python3-pip -y

# Install GPIO library
sudo apt-get install python3-rpi.gpio -y

# Install DHT sensor library
sudo pip3 install Adafruit_DHT

# Install Flask for API server
sudo pip3 install Flask flask-cors`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Create sensors.py</CardTitle>
                  <CardDescription>Sensor reading module</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg overflow-x-auto">
                    <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
                      <Code className="h-4 w-4" />
                      <span>~/greenhouse-monitor/sensors.py</span>
                    </div>
                    <pre className="text-xs font-mono text-foreground whitespace-pre">
{`import Adafruit_DHT
import RPi.GPIO as GPIO
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
GPIO.output(RELAY_PIN, GPIO.LOW)

def read_dht22():
    humidity, temperature = Adafruit_DHT.read_retry(DHT_SENSOR, DHT_PIN)
    if humidity and temperature:
        return {'temperature': round(temperature, 1), 'humidity': round(humidity, 1)}
    return {'temperature': None, 'humidity': None}

def read_soil_moisture():
    return "Dry" if GPIO.input(MOISTURE_PIN) == GPIO.HIGH else "Wet"

def get_all_sensor_data():
    dht_data = read_dht22()
    return {
        'temperature': dht_data['temperature'],
        'humidity': dht_data['humidity'],
        'soil_moisture': read_soil_moisture(),
        'timestamp': datetime.now().isoformat()
    }

def control_relay(state):
    GPIO.output(RELAY_PIN, GPIO.HIGH if state else GPIO.LOW)
    return state`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 4: Create app.py</CardTitle>
                  <CardDescription>Flask API server with CORS support</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg overflow-x-auto">
                    <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
                      <Code className="h-4 w-4" />
                      <span>~/greenhouse-monitor/app.py</span>
                    </div>
                    <pre className="text-xs font-mono text-foreground whitespace-pre">
{`from flask import Flask, jsonify
from flask_cors import CORS
import sensors

app = Flask(__name__)
CORS(app)  # Allow React dashboard to connect

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({'status': 'online', 'message': 'System active'})

@app.route('/api/sensors', methods=['GET'])
def get_sensors():
    data = sensors.get_all_sensor_data()
    return jsonify(data)

@app.route('/api/irrigation/<action>', methods=['POST'])
def control_irrigation(action):
    if action == 'on':
        sensors.control_relay(True)
        return jsonify({'status': 'success', 'message': 'Irrigation ON'})
    elif action == 'off':
        sensors.control_relay(False)
        return jsonify({'status': 'success', 'message': 'Irrigation OFF'})
    return jsonify({'error': 'Invalid action'}), 400

@app.route('/api/fan/<action>', methods=['POST'])
def control_fan(action):
    # Add second relay if you have a fan
    return jsonify({'status': 'success', 'message': f'Fan {action}'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 5: Test Your Setup</CardTitle>
                  <CardDescription>Verify sensors and API are working</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Test sensors directly:</p>
                    <div className="p-3 bg-muted rounded font-mono text-xs">
                      sudo python3 sensors.py
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Start API server:</p>
                    <div className="p-3 bg-muted rounded font-mono text-xs">
                      sudo python3 app.py
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Find your Pi's IP:</p>
                    <div className="p-3 bg-muted rounded font-mono text-xs">
                      hostname -I
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Setup Guide Tab */}
            <TabsContent value="setup" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Setup Checklist</CardTitle>
                  <CardDescription>Follow these steps to get your system running</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { step: 1, title: "Set up Raspberry Pi", desc: "Flash Raspberry Pi OS and boot your Pi" },
                      { step: 2, title: "Connect hardware", desc: "Wire sensors and relay according to GPIO diagram" },
                      { step: 3, title: "Install software", desc: "Update system and install Python dependencies" },
                      { step: 4, title: "Create project files", desc: "Create sensors.py and app.py in ~/greenhouse-monitor" },
                      { step: 5, title: "Test sensors", desc: "Run sudo python3 sensors.py to verify readings" },
                      { step: 6, title: "Start API server", desc: "Run sudo python3 app.py to start Flask server" },
                      { step: 7, title: "Find Pi's IP", desc: "Run hostname -I and note the IP address" },
                      { step: 8, title: "Configure dashboard", desc: "Enter Pi's IP in System Configuration" },
                      { step: 9, title: "Test connection", desc: "Click 'Test Connection' to verify setup" },
                      { step: 10, title: "Monitor greenhouse!", desc: "View real-time data and control devices" },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Issues & Solutions</CardTitle>
                  <CardDescription>Troubleshooting guide</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="font-medium text-sm mb-1">Sensors not reading?</p>
                    <p className="text-xs text-muted-foreground">Check wiring connections and GPIO pin numbers. Try running with sudo.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="font-medium text-sm mb-1">Can't connect to API?</p>
                    <p className="text-xs text-muted-foreground">Verify Pi's IP address, ensure Flask is running, check firewall settings.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="font-medium text-sm mb-1">Relay not switching?</p>
                    <p className="text-xs text-muted-foreground">Check relay power supply, verify GPIO 18 connection, test relay LED indicator.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="font-medium text-sm mb-1">Permission denied errors?</p>
                    <p className="text-xs text-muted-foreground">Run Python scripts with sudo: sudo python3 app.py</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Ready for Your Presentation
                  </CardTitle>
                  <CardDescription>Tips for graduation project demo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Have backup screenshots/data ready in case of technical issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Explain how solar panels power the system (energy efficiency angle)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Demonstrate real-time monitoring and manual/automatic control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Show the relay controlling the water pump in action</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Discuss potential improvements (data logging, alerts, mobile app)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Reference Tab */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>Available REST API endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border-2 border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="default">GET</Badge>
                      <code className="text-sm font-mono">/api/sensors</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Retrieve current sensor readings
                    </p>
                    <div className="p-3 bg-muted rounded text-xs font-mono">
{`{
  "temperature": 24.5,
  "humidity": 65,
  "soil_moisture": "Wet"
}`}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary">POST</Badge>
                      <code className="text-sm font-mono">/api/irrigation/&lt;action&gt;</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Control irrigation system (action: "on" or "off")
                    </p>
                    <div className="p-3 bg-muted rounded text-xs font-mono">
{`{
  "status": "on"
}`}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Testing with cURL</CardTitle>
                  <CardDescription>Command-line testing examples</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Get sensor data:</p>
                      <div className="p-3 bg-muted rounded font-mono text-xs">
                        curl http://raspberry-pi-ip:5000/api/sensors
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Turn irrigation on:</p>
                      <div className="p-3 bg-muted rounded font-mono text-xs">
                        curl -X POST http://raspberry-pi-ip:5000/api/irrigation/on
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
