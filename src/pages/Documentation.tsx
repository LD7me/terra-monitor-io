import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Code, Cpu, Database, Wifi, Terminal, CheckCircle } from "lucide-react";

const Documentation = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-lg text-muted-foreground">
              Complete guide to building and deploying your greenhouse monitoring system
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="hardware">Hardware Setup</TabsTrigger>
              <TabsTrigger value="software">Software</TabsTrigger>
              <TabsTrigger value="api">API Reference</TabsTrigger>
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
                  <CardTitle>GPIO Pin Connections</CardTitle>
                  <CardDescription>Wiring diagram for all sensors and modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>DHT22 Sensor</Badge>
                      </div>
                      <div className="space-y-2 font-mono text-sm">
                        <p><span className="text-primary">VCC</span> → 5V (Pin 2)</p>
                        <p><span className="text-primary">GND</span> → Ground (Pin 6)</p>
                        <p><span className="text-primary">DATA</span> → GPIO 4 (Pin 7)</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/5 border-2 border-secondary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>Soil Moisture Sensor</Badge>
                      </div>
                      <div className="space-y-2 font-mono text-sm">
                        <p><span className="text-secondary">VCC</span> → 5V (Pin 4)</p>
                        <p><span className="text-secondary">GND</span> → Ground (Pin 9)</p>
                        <p><span className="text-secondary">DATA</span> → GPIO 17 (Pin 11)</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-accent/5 border-2 border-accent/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>Relay Module</Badge>
                      </div>
                      <div className="space-y-2 font-mono text-sm">
                        <p><span className="text-accent">VCC</span> → 5V (Pin 2)</p>
                        <p><span className="text-accent">GND</span> → Ground (Pin 14)</p>
                        <p><span className="text-accent">IN</span> → GPIO 18 (Pin 12)</p>
                        <p className="text-muted-foreground text-xs mt-2">
                          💡 Connect your irrigation pump or fan to the relay's COM and NO terminals
                        </p>
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
                  <CardTitle>Python Dependencies</CardTitle>
                  <CardDescription>Install required packages on Raspberry Pi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                    <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                      <Terminal className="h-4 w-4" />
                      <span>Terminal</span>
                    </div>
                    <pre className="text-foreground whitespace-pre-wrap">
{`sudo apt-get update
sudo apt-get install python3-pip
sudo pip3 install Adafruit_DHT RPi.GPIO Flask`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sensor Reading Script</CardTitle>
                  <CardDescription>Python code to read sensor data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg overflow-x-auto">
                    <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
                      <Code className="h-4 w-4" />
                      <span>sensor_reader.py</span>
                    </div>
                    <pre className="text-xs font-mono text-foreground whitespace-pre">
{`import Adafruit_DHT
import RPi.GPIO as GPIO
import time

# DHT22 Configuration
sensor = Adafruit_DHT.DHT22
pin_dht = 4

# Soil Moisture Configuration
GPIO.setmode(GPIO.BCM)
moisture_pin = 17
GPIO.setup(moisture_pin, GPIO.IN)

def read_sensors():
    # Read temperature and humidity
    humidity, temperature = Adafruit_DHT.read_retry(sensor, pin_dht)
    
    # Read soil moisture (HIGH = Dry, LOW = Wet)
    moisture_status = "Dry" if GPIO.input(moisture_pin) == GPIO.HIGH else "Wet"
    
    return {
        "temperature": temperature,
        "humidity": humidity,
        "soil_moisture": moisture_status
    }

if __name__ == "__main__":
    while True:
        data = read_sensors()
        print(f"Temp: {data['temperature']}°C | "
              f"Humidity: {data['humidity']}% | "
              f"Soil: {data['soil_moisture']}")
        time.sleep(2)`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Flask API Server</CardTitle>
                  <CardDescription>REST API endpoint for the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg overflow-x-auto">
                    <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
                      <Code className="h-4 w-4" />
                      <span>app.py</span>
                    </div>
                    <pre className="text-xs font-mono text-foreground whitespace-pre">
{`from flask import Flask, jsonify
import Adafruit_DHT
import RPi.GPIO as GPIO

app = Flask(__name__)

# Sensor setup
sensor = Adafruit_DHT.DHT22
pin_dht = 4
GPIO.setmode(GPIO.BCM)
moisture_pin = 17
GPIO.setup(moisture_pin, GPIO.IN)

# Relay setup
relay_pin = 18
GPIO.setup(relay_pin, GPIO.OUT)

@app.route('/api/sensors', methods=['GET'])
def get_sensor_data():
    humidity, temperature = Adafruit_DHT.read_retry(sensor, pin_dht)
    moisture = "Dry" if GPIO.input(moisture_pin) == GPIO.HIGH else "Wet"
    
    return jsonify({
        "temperature": temperature,
        "humidity": humidity,
        "soil_moisture": moisture
    })

@app.route('/api/irrigation/<action>', methods=['POST'])
def control_irrigation(action):
    if action == "on":
        GPIO.output(relay_pin, GPIO.HIGH)
        return jsonify({"status": "on"})
    else:
        GPIO.output(relay_pin, GPIO.LOW)
        return jsonify({"status": "off"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)`}
                    </pre>
                  </div>
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
