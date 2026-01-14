import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Check, Clock, DollarSign, Calendar, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  features: string[] | null;
  is_active: boolean;
}

interface CurrentMembership {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  plan: MembershipPlan;
}

export default function Plan() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [currentMembership, setCurrentMembership] = useState<CurrentMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch available plans
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Fetch current membership
      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          *,
          plan:membership_plans(*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') throw membershipError;
      setCurrentMembership(membershipData);
    } catch (error: any) {
      toast({
        title: 'Error loading plans',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'pending': return 'outline';
      case 'frozen': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Membership Plans</h1>
        <p className="text-muted-foreground mt-2">View your current plan and available options</p>
      </div>

      {loading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Loading plans...</p>
        </Card>
      ) : (
        <>
          {/* Current Membership */}
          {currentMembership && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 bg-gradient-primary text-primary-foreground shadow-premium">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-3 bg-primary-foreground/20 text-primary-foreground">
                      Current Plan
                    </Badge>
                    <h2 className="text-2xl font-bold mb-1">{currentMembership.plan.name}</h2>
                    <p className="text-primary-foreground/80 mb-2">
                      {currentMembership.plan.description}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(currentMembership.status)}>
                    {currentMembership.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-foreground/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-primary-foreground/70">Start Date</p>
                      <p className="font-semibold">{format(new Date(currentMembership.start_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-foreground/20">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-primary-foreground/70">End Date</p>
                      <p className="font-semibold">{format(new Date(currentMembership.end_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-foreground/20">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-primary-foreground/70">Monthly Cost</p>
                      <p className="font-semibold">${(currentMembership.plan.price / currentMembership.plan.duration_months).toFixed(0)}/mo</p>
                    </div>
                  </div>
                </div>

                {currentMembership.plan.features && currentMembership.plan.features.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-primary-foreground/20">
                    <p className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Plan Features
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {currentMembership.plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span className="text-sm text-primary-foreground/90">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Available Plans */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {currentMembership ? 'Upgrade Options' : 'Available Plans'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => {
                const isCurrentPlan = currentMembership?.plan.id === plan.id;
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                  >
                    <Card className={`p-6 h-full flex flex-col ${isCurrentPlan ? 'border-2 border-primary' : ''}`}>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                        
                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                            <span className="text-muted-foreground">/ {plan.duration_months} months</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${(plan.price / plan.duration_months).toFixed(0)} per month
                          </p>
                        </div>

                        {plan.features && plan.features.length > 0 && (
                          <div className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        className={`w-full mt-6 ${isCurrentPlan ? 'bg-gradient-primary' : ''}`}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Contact Admin'}
                      </Button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
