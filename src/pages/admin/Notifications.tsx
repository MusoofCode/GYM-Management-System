import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, AlertCircle, DollarSign, Calendar, Users, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

interface ExpiringMembership {
  user_id: string;
  full_name: string;
  email: string;
  end_date: string;
  plan_name: string;
  days_left: number;
}

interface UnpaidStudent {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  membership_status: string;
  last_payment: string | null;
}

interface PayrollDue {
  id: string;
  staff_name: string;
  payment_period_end: string;
  salary_amount: number;
  payment_status: string;
}

export default function Notifications() {
  const [expiringMemberships, setExpiringMemberships] = useState<ExpiringMembership[]>([]);
  const [unpaidStudents, setUnpaidStudents] = useState<UnpaidStudent[]>([]);
  const [payrollDue, setPayrollDue] = useState<PayrollDue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Fetch expiring memberships (within 7 days)
      const sevenDaysFromNow = addDays(new Date(), 7);
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('memberships')
        .select(`
          user_id,
          end_date,
          plan:membership_plans(name)
        `)
        .eq('status', 'active')
        .lte('end_date', sevenDaysFromNow.toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0]);

      if (membershipsError) throw membershipsError;

      // Get profiles for expiring memberships
      if (membershipsData && membershipsData.length > 0) {
        const userIds = membershipsData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        const expiring = membershipsData.map(membership => {
          const profile = profilesData?.find(p => p.user_id === membership.user_id);
          const daysLeft = differenceInDays(new Date(membership.end_date), new Date());
          return {
            user_id: membership.user_id,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
            end_date: membership.end_date,
            plan_name: (membership.plan as any)?.name || 'Unknown Plan',
            days_left: daysLeft
          };
        });

        setExpiringMemberships(expiring);
      }

      // Fetch students with no recent payments (last 60 days)
      const sixtyDaysAgo = addDays(new Date(), -60);
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone');

      if (allProfiles) {
        const { data: recentPayments } = await supabase
          .from('payments')
          .select('user_id')
          .gte('paid_at', sixtyDaysAgo.toISOString())
          .eq('payment_type', 'membership');

        const paidUserIds = new Set(recentPayments?.map(p => p.user_id) || []);
        
        const unpaid = allProfiles
          .filter(profile => !paidUserIds.has(profile.user_id))
          .map(profile => ({
            ...profile,
            membership_status: 'No recent payment',
            last_payment: null
          }));

        setUnpaidStudents(unpaid.slice(0, 10)); // Show top 10
      }

      // Fetch unpaid payroll
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select(`
          id,
          staff_user_id,
          payment_period_end,
          salary_amount,
          payment_status
        `)
        .eq('payment_status', 'pending')
        .lte('payment_period_end', new Date().toISOString().split('T')[0])
        .order('payment_period_end', { ascending: true });

      if (payrollError) throw payrollError;

      if (payrollData && payrollData.length > 0) {
        const staffUserIds = payrollData.map(p => p.staff_user_id);
        const { data: staffProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', staffUserIds);

        const payrollWithNames = payrollData.map(payroll => {
          const staff = staffProfiles?.find(s => s.user_id === payroll.staff_user_id);
          return {
            id: payroll.id,
            staff_name: staff?.full_name || 'Unknown Staff',
            payment_period_end: payroll.payment_period_end,
            salary_amount: payroll.salary_amount,
            payment_status: payroll.payment_status
          };
        });

        setPayrollDue(payrollWithNames);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading notifications',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const markPayrollAsPaid = async (payrollId: string) => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ 
          payment_status: 'paid',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', payrollId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payroll marked as paid'
      });

      fetchNotifications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const totalAlerts = expiringMemberships.length + unpaidStudents.length + payrollDue.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications & Alerts</h1>
          <p className="text-muted-foreground mt-2">Stay updated on important events</p>
        </div>
        <Badge variant="destructive" className="text-lg px-4 py-2">
          <Bell className="w-5 h-5 mr-2" />
          {totalAlerts} Alerts
        </Badge>
      </div>

      {loading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Loading notifications...</p>
        </Card>
      ) : (
        <>
          {/* Expiring Memberships */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Expiring Memberships</h2>
                <p className="text-sm text-muted-foreground">Students whose plans expire within 7 days</p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {expiringMemberships.length} Students
              </Badge>
            </div>

            {expiringMemberships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>No memberships expiring soon</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringMemberships.map((membership, index) => (
                  <motion.div
                    key={membership.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-warning/5 border border-warning/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{membership.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{membership.email}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Plan: {membership.plan_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={membership.days_left <= 3 ? 'destructive' : 'outline'}>
                          {membership.days_left} {membership.days_left === 1 ? 'day' : 'days'} left
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Expires: {format(new Date(membership.end_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Unpaid Students */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <DollarSign className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Unpaid Students</h2>
                <p className="text-sm text-muted-foreground">No payment received in last 60 days</p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {unpaidStudents.length} Students
              </Badge>
            </div>

            {unpaidStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>All students have recent payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unpaidStudents.map((student, index) => (
                  <motion.div
                    key={student.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{student.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.phone && (
                          <p className="text-sm text-muted-foreground">📱 {student.phone}</p>
                        )}
                      </div>
                      <Badge variant="destructive">No Recent Payment</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Payroll Due */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Payroll Due</h2>
                <p className="text-sm text-muted-foreground">Pending staff salary payments</p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {payrollDue.length} Payments
              </Badge>
            </div>

            {payrollDue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>No pending payroll payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payrollDue.map((payroll, index) => (
                  <motion.div
                    key={payroll.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{payroll.staff_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Period ended: {format(new Date(payroll.payment_period_end), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-xl font-bold text-foreground">
                            ${Number(payroll.salary_amount).toFixed(2)}
                          </p>
                          <Badge variant="outline" className="mt-1">Pending</Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => markPayrollAsPaid(payroll.id)}
                          className="bg-gradient-primary"
                        >
                          Mark as Paid
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </motion.div>
  );
}