import { useState } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings,
  LogOut,
  Menu,
  X,
  Dumbbell,
  UserSquare,
  Wallet,
  FileText,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminOverview from './Overview';
import AdminMembers from './Members';
import AdminPayments from './Payments';
import AdminSettings from './Settings';
import AdminMembershipPlans from './MembershipPlans';
import AdminReports from './Reports';
import AdminStaff from './Staff';
import AdminPayroll from './Payroll';
import AdminNotifications from './Notifications';

const navigationItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/members', icon: Users },
  { name: 'Staff', href: '/admin/staff', icon: UserSquare },
  { name: 'Payroll', href: '/admin/payroll', icon: Wallet },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Plans', href: '/admin/membership-plans', icon: FileText },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Reports', href: '/admin/reports', icon: TrendingUp },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-screen glass-strong border-r border-border/50 transition-all duration-500 z-50 backdrop-blur-2xl",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-premium">
                    <Dumbbell className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Gym Manager
                  </span>
                </motion.div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="ml-auto hover-scale rounded-full"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                             (item.href !== '/admin' && location.pathname.startsWith(item.href));
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 transition-all duration-300 rounded-xl",
                        isActive ? 
                          "glass-strong text-primary shadow-lg border-primary/20" : 
                          "hover:glass-light hover-lift"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 transition-transform duration-300",
                        isActive && "scale-110"
                      )} />
                      {sidebarOpen && <span className="font-medium">{item.name}</span>}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border/30">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:glass-light rounded-xl transition-all duration-300"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-500 min-h-screen",
        sidebarOpen ? "ml-64" : "ml-20"
      )}>
        <div className="p-6 page-enter">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="payroll" element={<AdminPayroll />} />
            <Route path="membership-plans" element={<AdminMembershipPlans />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
