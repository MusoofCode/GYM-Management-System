import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProgressEntry {
  id: string;
  measurement_date: string;
  weight: number;
  body_fat_percentage: number | null;
  bmi: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  thighs: number | null;
  notes: string | null;
}

export default function MemberProgress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    bodyFat: '',
    bmi: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', user?.id)
        .order('measurement_date', { ascending: false });

      if (error) throw error;
      setProgress(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load progress',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('progress_tracking').insert({
        user_id: user?.id,
        measurement_date: formData.date,
        weight: parseFloat(formData.weight) || null,
        body_fat_percentage: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
        chest: formData.chest ? parseFloat(formData.chest) : null,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        hips: formData.hips ? parseFloat(formData.hips) : null,
        arms: formData.arms ? parseFloat(formData.arms) : null,
        thighs: formData.thighs ? parseFloat(formData.thighs) : null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Progress entry added successfully!',
      });

      fetchProgress();
      setShowAddDialog(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: '',
        bodyFat: '',
        bmi: '',
        chest: '',
        waist: '',
        hips: '',
        arms: '',
        thighs: '',
        notes: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add progress entry',
        variant: 'destructive',
      });
    }
  };

  const getWeightTrend = () => {
    if (progress.length < 2) return null;
    const latest = progress[0].weight;
    const previous = progress[1].weight;
    const diff = latest - previous;
    return { diff, isUp: diff > 0, isDown: diff < 0 };
  };

  const weightTrend = getWeightTrend();

  // Prepare chart data (reverse to show oldest first)
  const chartData = [...progress].reverse().map((entry) => ({
    date: format(new Date(entry.measurement_date), 'MMM dd'),
    weight: entry.weight,
    bodyFat: entry.body_fat_percentage,
    waist: entry.waist,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress Tracking</h1>
          <p className="text-muted-foreground mt-2">Track your fitness journey</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Stats Cards */}
      {progress.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Current Weight</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">{progress[0].weight} kg</p>
              {weightTrend && (
                <span className={`text-sm flex items-center ${weightTrend.isUp ? 'text-red-500' : weightTrend.isDown ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {weightTrend.isUp ? <TrendingUp className="w-4 h-4" /> : weightTrend.isDown ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  {Math.abs(weightTrend.diff).toFixed(1)} kg
                </span>
              )}
            </div>
          </Card>
          {progress[0].body_fat_percentage && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Body Fat</p>
              <p className="text-2xl font-bold text-foreground">{progress[0].body_fat_percentage}%</p>
            </Card>
          )}
          {progress[0].bmi && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">BMI</p>
              <p className="text-2xl font-bold text-foreground">{progress[0].bmi}</p>
            </Card>
          )}
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Entries</p>
            <p className="text-2xl font-bold text-foreground">{progress.length}</p>
          </Card>
        </div>
      )}

      {/* Charts */}
      {progress.length > 1 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Weight Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} name="Weight (kg)" />
              {chartData.some((d) => d.bodyFat) && (
                <Line type="monotone" dataKey="bodyFat" stroke="hsl(var(--destructive))" strokeWidth={2} name="Body Fat (%)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {progress.length > 1 && chartData.some((d) => d.waist) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Measurements</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="waist" stroke="hsl(var(--primary))" strokeWidth={2} name="Waist (cm)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Progress History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Progress History</h2>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : progress.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No progress entries yet</p>
            <Button onClick={() => setShowAddDialog(true)} variant="outline" className="mt-4">
              Add Your First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {progress.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-lg bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">
                    {format(new Date(entry.measurement_date), 'MMMM dd, yyyy')}
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="ml-2 font-semibold">{entry.weight} kg</span>
                  </div>
                  {entry.body_fat_percentage && (
                    <div>
                      <span className="text-muted-foreground">Body Fat:</span>
                      <span className="ml-2 font-semibold">{entry.body_fat_percentage}%</span>
                    </div>
                  )}
                  {entry.waist && (
                    <div>
                      <span className="text-muted-foreground">Waist:</span>
                      <span className="ml-2 font-semibold">{entry.waist} cm</span>
                    </div>
                  )}
                  {entry.chest && (
                    <div>
                      <span className="text-muted-foreground">Chest:</span>
                      <span className="ml-2 font-semibold">{entry.chest} cm</span>
                    </div>
                  )}
                </div>
                {entry.notes && (
                  <p className="mt-2 text-sm text-muted-foreground italic">{entry.notes}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Progress Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Progress Entry</DialogTitle>
            <DialogDescription>Record your latest measurements</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  required
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat">Body Fat (%)</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  step="0.1"
                  value={formData.bodyFat}
                  onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bmi">BMI</Label>
                <Input
                  id="bmi"
                  type="number"
                  step="0.1"
                  value={formData.bmi}
                  onChange={(e) => setFormData({ ...formData, bmi: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chest">Chest (cm)</Label>
                <Input
                  id="chest"
                  type="number"
                  step="0.1"
                  value={formData.chest}
                  onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">Waist (cm)</Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  value={formData.waist}
                  onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hips">Hips (cm)</Label>
                <Input
                  id="hips"
                  type="number"
                  step="0.1"
                  value={formData.hips}
                  onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arms">Arms (cm)</Label>
                <Input
                  id="arms"
                  type="number"
                  step="0.1"
                  value={formData.arms}
                  onChange={(e) => setFormData({ ...formData, arms: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thighs">Thighs (cm)</Label>
                <Input
                  id="thighs"
                  type="number"
                  step="0.1"
                  value={formData.thighs}
                  onChange={(e) => setFormData({ ...formData, thighs: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about your progress..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
