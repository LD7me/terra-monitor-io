import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Activity, BookOpen } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary rounded-lg group-hover:bg-primary-glow transition-colors">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">TerraMonitor</h1>
              <p className="text-xs text-muted-foreground">Greenhouse Intelligence</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button 
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Leaf className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button 
                variant={isActive("/dashboard") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Activity className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/documentation">
              <Button 
                variant={isActive("/documentation") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
