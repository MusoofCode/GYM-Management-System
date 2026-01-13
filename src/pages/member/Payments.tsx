import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Calendar, FileText, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_type: string;
  invoice_number: string | null;
  paid_at: string;
  discount_amount: number;
  notes: string | null;
}

export default function MemberPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'default';
      case 'card':
        return 'secondary';
      case 'bank_transfer':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'membership':
        return 'default';
      case 'product':
        return 'secondary';
      case 'personal_training':
        return 'outline';
      default:
        return 'default';
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDiscount = payments.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment History</h1>
        <p className="text-muted-foreground mt-2">View all your payments and invoices</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-foreground">${totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-500/10">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Savings</p>
              <p className="text-2xl font-bold text-green-500">${totalDiscount.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-500/10">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-foreground">{payments.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No payment history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground capitalize">
                      {payment.payment_type.replace('_', ' ')}
                    </h3>
                    <Badge variant={getPaymentTypeColor(payment.payment_type) as any}>
                      {payment.payment_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getPaymentMethodColor(payment.payment_method) as any}>
                      {payment.payment_method.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(payment.paid_at), 'MMM dd, yyyy')}
                    </div>
                    {payment.invoice_number && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Invoice: {payment.invoice_number}
                      </div>
                    )}
                    {payment.discount_amount > 0 && (
                      <div className="text-green-500">
                        Discount: ${Number(payment.discount_amount).toFixed(2)}
                      </div>
                    )}
                  </div>
                  {payment.notes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">{payment.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    ${Number(payment.amount).toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
