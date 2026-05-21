import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Sprout, Activity, Download } from "lucide-react";
import { downloadSetupFiles } from "@/lib/downloadSetup";
import { toast } from "sonner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-5">
            <Sprout className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Precision Agriculture · MVP</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-5 bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
            Smart Greenhouse Monitoring
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground mb-7 max-w-2xl mx-auto">
            Local-first greenhouse dashboard. Arduino sensors + Raspberry Pi controller,
            all data stored on the Pi.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/dashboard">
              <Button variant="hero" size="lg" className="gap-2">
                <Activity className="h-5 w-5" />
                Open Dashboard
              </Button>
            </Link>
            {/* <Button
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
              Pi Setup Files
            </Button> */}
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Setup & API docs are in the<code className="bg-muted px-1.5 py-0.5 rounded"><a href="https://github.com/LD7me/terra-monitor-io">github repo</a></code>
          </p>
        </div>
      </section>

      <footer className="py-6 px-4 border-t border-border">
        <div className="container mx-auto text-center text-xs sm:text-sm text-muted-foreground">
          <p>© 2026 TerraMonitor — Local-first greenhouse MVP</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
