import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { addMonths, format } from 'date-fns';

interface MembershipPlan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
}

interface AssignMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export const AssignMembershipDialog = ({ open, onOpenChange, userId, userName, onSuccess }: AssignMembershipDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      fetchPlans();
    }
  }, [open]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load membership plans',
        variant: 'destructive',
      });
    }
  };

  const generateQRCode = () => {
    return `GYM-${userId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast({
        title: 'Error',
        description: 'Please select a membership plan',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) throw new Error('Plan not found');

      const start = new Date(startDate);
      const end = addMonths(start, plan.duration_months);

      // Check for existing active membership
      const { data: existing } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (existing) {
        // Update existing membership
        const { error: updateError } = await supabase
          .from('memberships')
          .update({
            plan_id: selectedPlan,
            start_date: format(start, 'yyyy-MM-dd'),
            end_date: format(end, 'yyyy-MM-dd'),
            notes: notes || null,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new membership
        const qrCode = generateQRCode();
        
        const { error: insertError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            plan_id: selectedPlan,
            start_date: format(start, 'yyyy-MM-dd'),
            end_date: format(end, 'yyyy-MM-dd'),
            status: 'active',
            qr_code: qrCode,
            notes: notes || null,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Membership assigned successfully',
      });

      onSuccess();
      onOpenChange(false);
      setSelectedPlan('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setNotes('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign membership',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);
  const endDate = selectedPlanDetails 
    ? format(addMonths(new Date(startDate), selectedPlanDetails.duration_months), 'MMM dd, yyyy')
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Membership</DialogTitle>
          <DialogDescription>
            Assign a membership plan to {userName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Membership Plan *</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price} ({plan.duration_months} months)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {endDate && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Membership will end on: <span className="font-semibold text-foreground">{endDate}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Membership
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
