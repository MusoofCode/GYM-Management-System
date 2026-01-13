import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, QrCode, Activity, CreditCard, Dumbbell } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMembershipData();
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

  const daysLeft = membership ? differenceInDays(new Date(membership.end_date), new Date()) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome Back!</h1>
        <p className="text-muted-foreground mt-2">Track your fitness journey</p>
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
                {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)} Membership
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
          <h3 className="text-xl font-bold text-foreground mb-2">No Active Membership</h3>
          <p className="text-muted-foreground mb-4">
            Get started with a membership plan to access all gym facilities
          </p>
          <Button className="bg-gradient-primary">View Plans</Button>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Classes This Month</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Activity className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check-ins</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold text-foreground">$0</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Recent Activity</h3>
        <p className="text-center text-muted-foreground py-8">No recent activity</p>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Your Membership QR Code</DialogTitle>
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
