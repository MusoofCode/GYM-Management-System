import { Dumbbell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/NotificationDropdown";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Gym Manager</h1>
              <p className="text-xs text-muted-foreground">Student & Payroll Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="border-primary">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
