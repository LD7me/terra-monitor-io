import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Leaf, Activity, Menu, Sliders } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", icon: Leaf, label: "Home" },
    { path: "/dashboard", icon: Activity, label: "Dashboard" },
    { path: "/settings", icon: Sliders, label: "Setpoints" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 sm:p-2 bg-primary rounded-lg group-hover:bg-primary-glow transition-colors">
              <Leaf className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-xl text-foreground">TerraMonitor</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Greenhouse Intelligence</p>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-3 mt-8">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className="w-full justify-start gap-3"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
