import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Thermometer, Droplets, Sprout, Activity, BookOpen, Zap, Download } from "lucide-react";
import { downloadSetupFiles } from "@/lib/downloadSetup";
import { toast } from "sonner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sprout className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Precision Agriculture</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
            Smart Greenhouse Monitoring
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Real-time environmental monitoring and automated control system for your greenhouse. 
            Track temperature, humidity, and soil moisture with Raspberry Pi IoT technology.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/auth">
              <Button variant="hero" size="lg" className="gap-2">
                <Activity className="h-5 w-5" />
                Get Started
              </Button>
            </Link>
            <Link to="/documentation">
              <Button variant="outline" size="lg" className="gap-2">
                <BookOpen className="h-5 w-5" />
                Read Documentation
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2"
              onClick={async () => {
                toast.info("Preparing download...");
                await downloadSetupFiles();
                toast.success("Setup files downloaded!");
              }}
            >
              <Download className="h-5 w-5" />
              Download Setup Files
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">System Features</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Thermometer className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Temperature Monitoring</CardTitle>
                <CardDescription>
                  DHT22 sensor provides accurate temperature readings with ±0.5°C precision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Real-time temperature tracking</li>
                  <li>• Historical data visualization</li>
                  <li>• Automatic alerts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Droplets className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Humidity Control</CardTitle>
                <CardDescription>
                  Monitor and maintain optimal humidity levels for plant growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Relative humidity sensing</li>
                  <li>• Automated fan control</li>
                  <li>• Threshold notifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Sprout className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Soil Moisture</CardTitle>
                <CardDescription>
                  Automatic irrigation based on soil moisture levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Digital moisture detection</li>
                  <li>• Relay-controlled irrigation</li>
                  <li>• Water conservation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Technology Stack</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Hardware
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Raspberry Pi</strong> - Main controller running Python scripts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>DHT22 Sensor</strong> - Temperature & humidity monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Soil Moisture Sensor</strong> - Digital moisture detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Relay Module</strong> - Device control (irrigation, fans)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-secondary" />
                Software
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span><strong>Python</strong> - Sensor data collection & GPIO control</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span><strong>Flask</strong> - REST API backend server</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span><strong>React</strong> - Modern web dashboard interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span><strong>WebSocket</strong> - Real-time data updates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-primary-glow/5 to-secondary/10">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Explore the live dashboard or dive into the documentation to build your own system
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard">
              <Button variant="hero" size="lg">
                Open Dashboard
              </Button>
            </Link>
            <Link to="/documentation">
              <Button variant="outline" size="lg">
                Setup Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 TerraMonitor - Greenhouse Monitoring System</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
