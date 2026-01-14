import { useState, useEffect } from 'react';
import { StatsCard } from "@/components/StatsCard";
import { MembersList } from "@/components/MembersList";
import { ClassSchedule } from "@/components/ClassSchedule";
import { Users, Calendar, DollarSign, TrendingUp, Activity, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import heroImage from "@/assets/gym-hero.jpg";

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  todayAttendance: number;
  monthlyRevenue: number;
  revenueGrowth: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    todayAttendance: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [membershipData, setMembershipData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch members count
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch memberships by status
      const { data: memberships } = await supabase
        .from('memberships')
        .select('status');

      const activeMembers = memberships?.filter(m => m.status === 'active').length || 0;
      const expiredMembers = memberships?.filter(m => m.status === 'expired').length || 0;

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { count: todayAttendance } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', `${today}T00:00:00`)
        .lte('check_in_time', `${today}T23:59:59`);

      // Fetch current month revenue
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, paid_at')
        .gte('paid_at', firstDayOfMonth);

      const monthlyRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Calculate revenue for last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRevenue = payments?.filter(p => 
          p.paid_at.startsWith(dateStr)
        ).reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        last7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue
        });
      }

      setRevenueData(last7Days);

      // Membership status distribution
      const statusDistribution = [
        { name: 'Active', value: activeMembers },
        { name: 'Expired', value: expiredMembers },
        { name: 'Pending', value: memberships?.filter(m => m.status === 'pending').length || 0 },
        { name: 'Frozen', value: memberships?.filter(m => m.status === 'frozen').length || 0 }
      ].filter(item => item.value > 0);

      setMembershipData(statusDistribution);

      setStats({
        totalMembers: totalMembers || 0,
        activeMembers,
        expiredMembers,
        todayAttendance: todayAttendance || 0,
        monthlyRevenue,
        revenueGrowth: 8.5 // Placeholder
      });
    } catch (error: any) {
      toast({
        title: 'Error loading dashboard data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[250px] overflow-hidden rounded-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent z-10" />
        <img 
          src={heroImage} 
          alt="Gym Hero" 
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
        />
        <div className="relative z-20 h-full flex flex-col justify-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Monitor and manage your gym's performance
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Students"
          value={stats.totalMembers.toString()}
          icon={Users}
          trend={`${stats.activeMembers} active`}
          trendUp={true}
          delay={0.1}
        />
        <StatsCard
          title="Today's Attendance"
          value={stats.todayAttendance.toString()}
          icon={Activity}
          trend="Check-ins today"
          trendUp={true}
          delay={0.2}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={`${stats.revenueGrowth}% from last month`}
          trendUp={true}
          delay={0.3}
        />
        <StatsCard
          title="Active Memberships"
          value={stats.activeMembers.toString()}
          icon={CreditCard}
          trend={`${stats.expiredMembers} expired`}
          trendUp={false}
          delay={0.4}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Revenue (Last 7 Days)</h3>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Membership Distribution</h3>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={membershipData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {membershipData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <MembersList />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <ClassSchedule />
        </motion.div>
      </div>
    </div>
  );
}
