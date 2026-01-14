import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Heart,
  FileText,
  Activity,
  CreditCard,
  LogOut,
  Menu,
  X,
  Dumbbell,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MemberOverview from './Overview';
import MemberProfile from './Profile';
import MemberPayments from './Payments';
import HealthStatus from './HealthStatus';
import Plan from './Plan';
import ExerciseRoutine from './ExerciseRoutine';

const navigationItems = [
  { name: 'Dashboard', href: '/member', icon: LayoutDashboard },
  { name: 'Payments', href: '/member/payments', icon: CreditCard },
  { name: 'Health Status', href: '/member/health', icon: Heart },
  { name: 'Plan', href: '/member/plan', icon: FileText },
  { name: 'Exercise Routine', href: '/member/exercise', icon: Activity },
  { name: 'Profile', href: '/member/profile', icon: User },
];

export default function MemberDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-screen bg-card border-r border-border transition-all duration-300 z-50",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-primary">
                    <Dumbbell className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg text-foreground">FitFlow</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="ml-auto"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && <span>{item.name}</span>}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-20"
      )}>
        <div className="p-6">
          <Routes>
            <Route index element={<MemberOverview />} />
            <Route path="profile" element={<MemberProfile />} />
            <Route path="payments" element={<MemberPayments />} />
            <Route path="health" element={<HealthStatus />} />
            <Route path="plan" element={<Plan />} />
            <Route path="exercise" element={<ExerciseRoutine />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
