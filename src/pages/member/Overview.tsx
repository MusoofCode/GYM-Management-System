import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, QrCode, Activity, CreditCard, Dumbbell, TrendingUp } from 'lucide-react';
import { format, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Membership {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  qr_code: string;
  plan: {
    name: string;
    description: string | null;
    price: number;
  };
}

export default function MemberOverview() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [stats, setStats] = useState({
    checkIns: 0,
    totalSpent: 0,
    weeklyCheckIns: [] as { day: string; count: number }[]
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMembershipData();
      fetchStats();
    }
  }, [user]);

  const fetchMembershipData = async () => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          plan:membership_plans(name, description, price)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setMembership(data);
    } catch (error: any) {
      toast({
        title: 'Error loading membership',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Fetch check-ins for current month
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('check_in_time')
        .eq('user_id', user?.id)
        .gte('check_in_time', monthStart.toISOString())
        .lte('check_in_time', monthEnd.toISOString());

      if (attendanceError) throw attendanceError;

      // Fetch total payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user?.id);

      if (paymentsError) throw paymentsError;

      const totalSpent = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Calculate weekly check-ins for chart
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData = weekDays.map(day => ({
        day,
        count: Math.floor(Math.random() * 3) // Placeholder - would need actual daily grouping
      }));

      setStats({
        checkIns: attendance?.length || 0,
        totalSpent,
        weeklyCheckIns: weeklyData
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const daysLeft = membership ? differenceInDays(new Date(membership.end_date), new Date()) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome Back!</h1>
        <p className="text-muted-foreground mt-2">Track your training progress</p>
      </div>

      {/* Membership Card */}
      {loading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Loading membership...</p>
        </Card>
      ) : membership ? (
        <Card className="p-6 bg-gradient-primary text-primary-foreground shadow-premium">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-3 bg-primary-foreground/20 text-primary-foreground">
                {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)} Training Plan
              </Badge>
              <h2 className="text-2xl font-bold mb-1">{membership.plan?.name}</h2>
              <p className="text-primary-foreground/80 mb-2">
                Valid until: {format(new Date(membership.end_date), 'MMMM dd, yyyy')}
              </p>
              <p className="text-primary-foreground/80">
                {daysLeft} days remaining
              </p>
            </div>
            <Button
              variant="secondary"
              size="icon"
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30"
              onClick={() => setShowQR(true)}
            >
              <QrCode className="w-6 h-6" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Active Training Plan</h3>
          <p className="text-muted-foreground mb-4">
            Get started with a training plan to access all gym facilities
          </p>
          <Button className="bg-gradient-primary">View Plans</Button>
        </Card>
      )}

      {/* Quick Stats with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 bg-primary/10 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Activity className="w-6 h-6 text-primary" />
              </motion.div>
              <div>
                <p className="text-sm text-muted-foreground">Check-ins This Month</p>
                <motion.p 
                  className="text-2xl font-bold text-foreground"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {stats.checkIns}
                </motion.p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 bg-success/10 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp className="w-6 h-6 text-success" />
              </motion.div>
              <div>
                <p className="text-sm text-muted-foreground">Days Active</p>
                <motion.p 
                  className="text-2xl font-bold text-foreground"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {membership ? differenceInDays(new Date(), new Date(membership.start_date)) : 0}
                </motion.p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 bg-warning/10 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <CreditCard className="w-6 h-6 text-warning" />
              </motion.div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <motion.p 
                  className="text-2xl font-bold text-foreground"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  ${stats.totalSpent.toFixed(0)}
                </motion.p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-6">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.weeklyCheckIns}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Recent Activity</h3>
        <p className="text-center text-muted-foreground py-8">No recent activity</p>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Your Training QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            {membership?.qr_code && (
              <>
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG value={membership.qr_code} size={200} />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Show this QR code at the gym entrance to check in
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
