import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Package, 
  Settings,
  LogOut,
  Menu,
  X,
  Dumbbell,
  TrendingUp,
  UserSquare,
  UserCheck,
  Tag,
  ShoppingCart,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminOverview from './Overview';
import AdminMembers from './Members';
import AdminClasses from './Classes';
import AdminPayments from './Payments';
import AdminProducts from './Products';
import AdminSettings from './Settings';
import AdminAttendance from './Attendance';
import AdminMembershipPlans from './MembershipPlans';
import AdminPOS from './POS';
import AdminCoupons from './Coupons';
import AdminReports from './Reports';
import AdminProgressTracking from './ProgressTracking';
import AdminStaff from './Staff';

const navigationItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Members', href: '/admin/members', icon: Users },
  { name: 'Staff', href: '/admin/staff', icon: UserSquare },
  { name: 'Attendance', href: '/admin/attendance', icon: UserCheck },
  { name: 'Classes', href: '/admin/classes', icon: Calendar },
  { name: 'Memberships', href: '/admin/membership-plans', icon: FileText },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'POS', href: '/admin/pos', icon: ShoppingCart },
  { name: 'Progress', href: '/admin/progress', icon: TrendingUp },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Reports', href: '/admin/reports', icon: TrendingUp },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { signOut, user } = useAuth();

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
              const isActive = location.pathname === item.href || 
                             (item.href !== '/admin' && location.pathname.startsWith(item.href));
              
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
            <Route index element={<AdminOverview />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="membership-plans" element={<AdminMembershipPlans />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="pos" element={<AdminPOS />} />
            <Route path="progress" element={<AdminProgressTracking />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
