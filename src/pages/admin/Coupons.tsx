import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Ticket, Percent } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
}

export default function AdminCoupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    max_uses: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load coupons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until,
      max_uses: coupon.max_uses?.toString() || '',
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const couponData = {
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      valid_from: formData.valid_from,
      valid_until: formData.valid_until,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      is_active: true,
    };

    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Coupon updated successfully',
        });
      } else {
        const { error } = await supabase.from('coupons').insert(couponData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Coupon created successfully',
        });
      }

      fetchCoupons();
      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save coupon',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingCoupon) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: false })
        .eq('id', deletingCoupon.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coupon deactivated successfully',
      });

      fetchCoupons();
      setShowDeleteDialog(false);
      setDeletingCoupon(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate coupon',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      valid_from: format(new Date(), 'yyyy-MM-dd'),
      valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      max_uses: '',
    });
    setEditingCoupon(null);
  };

  const isExpired = (validUntil: string) => new Date(validUntil) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discount Coupons</h1>
          <p className="text-muted-foreground mt-2">Manage discount codes and promotions</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
          className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Coupons List */}
      <Card className="p-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No coupons found</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon, index) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Ticket className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold font-mono">{coupon.code}</h3>
                      <Badge
                        variant={
                          !coupon.is_active
                            ? 'secondary'
                            : isExpired(coupon.valid_until)
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {!coupon.is_active
                          ? 'Inactive'
                          : isExpired(coupon.valid_until)
                          ? 'Expired'
                          : 'Active'}
                      </Badge>
                    </div>
                    {coupon.description && (
                      <p className="text-sm text-muted-foreground mb-2">{coupon.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}% off`
                          : `$${coupon.discount_value} off`}
                      </span>
                      <span>
                        Valid: {format(new Date(coupon.valid_from), 'MMM dd')} -{' '}
                        {format(new Date(coupon.valid_until), 'MMM dd, yyyy')}
                      </span>
                      {coupon.max_uses && (
                        <span>
                          Used: {coupon.used_count}/{coupon.max_uses}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(coupon)} size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setDeletingCoupon(coupon);
                      setShowDeleteDialog(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit' : 'Create'} Coupon</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Update' : 'Create'} a discount coupon for members
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., NEWYEAR2024"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_value">
                Discount Value ({formData.discount_type === 'percentage' ? '%' : '$'}) *
              </Label>
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                min="0"
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                required
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                placeholder="e.g., 20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the coupon promotion..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  required
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until *</Label>
                <Input
                  id="valid_until"
                  type="date"
                  required
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_uses">Maximum Uses (Optional)</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                placeholder="Leave empty for unlimited"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingCoupon ? 'Update' : 'Create'} Coupon</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the coupon "{deletingCoupon?.code}". It will no longer be valid
              for use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
