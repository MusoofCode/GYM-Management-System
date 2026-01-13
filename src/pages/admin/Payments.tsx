import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_type: string;
  invoice_number: string | null;
  discount_amount: number;
  paid_at: string;
  user: {
    full_name: string;
    email: string;
  };
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('paid_at', { ascending: false })
        .limit(100);

      if (paymentsError) throw paymentsError;

      // Fetch profiles for all users
      const userIds = paymentsData?.map(p => p.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Combine data
      const paymentsWithUsers = paymentsData?.map(payment => ({
        ...payment,
        user: profilesData?.find(p => p.user_id === payment.user_id) || { full_name: 'Unknown', email: '' }
      }));

      setPayments(paymentsWithUsers || []);
    } catch (error: any) {
      toast({
        title: 'Error loading payments',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDiscounts = payments.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'success';
      case 'card': return 'primary';
      case 'mobile_money': return 'warning';
      default: return 'secondary';
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'membership': return 'primary';
      case 'personal_training': return 'warning';
      case 'product': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments & Billing</h1>
          <p className="text-muted-foreground mt-2">Track payments and generate invoices</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium">
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-foreground">{payments.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Discounts Given</p>
              <p className="text-2xl font-bold text-foreground">
                ${totalDiscounts.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Calendar className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground">
                ${payments.filter(p => {
                  const paidDate = new Date(p.paid_at);
                  const now = new Date();
                  return paidDate.getMonth() === now.getMonth() && 
                         paidDate.getFullYear() === now.getFullYear();
                }).reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by member name or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Payments List */}
      <Card className="p-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading payments...</p>
        ) : filteredPayments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No payments found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Member
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Invoice
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Method
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {format(new Date(payment.paid_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {payment.user?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.user?.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {payment.invoice_number || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`text-xs bg-${getPaymentTypeColor(payment.payment_type)}/10 text-${getPaymentTypeColor(payment.payment_type)} border-${getPaymentTypeColor(payment.payment_type)}/20`}>
                        {payment.payment_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`text-xs bg-${getPaymentMethodColor(payment.payment_method)}/10 text-${getPaymentMethodColor(payment.payment_method)} border-${getPaymentMethodColor(payment.payment_method)}/20`}>
                        {payment.payment_method.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="text-sm font-bold text-foreground">
                        ${Number(payment.amount).toLocaleString()}
                      </p>
                      {payment.discount_amount > 0 && (
                        <p className="text-xs text-warning">
                          -${Number(payment.discount_amount).toLocaleString()} discount
                        </p>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
