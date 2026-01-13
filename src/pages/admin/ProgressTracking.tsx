import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Member {
  user_id: string;
  full_name: string;
}

interface ProgressEntry {
  id: string;
  user_id: string;
  measurement_date: string;
  weight: number | null;
  bmi: number | null;
  body_fat_percentage: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  thighs: number | null;
  notes: string | null;
  profile: {
    full_name: string;
  };
}

export default function AdminProgressTracking() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    measurementDate: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    bmi: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    notes: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      fetchProgressData(selectedMember);
    }
  }, [selectedMember]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading members',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const fetchProgressData = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('measurement_date', { ascending: false });

      if (error) throw error;

      // Fetch member name separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      const dataWithProfile = data?.map(entry => ({
        ...entry,
        profile: { full_name: profile?.full_name || 'Unknown' }
      })) || [];

      setProgressData(dataWithProfile);
    } catch (error: any) {
      toast({
        title: 'Error loading progress data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      toast({
        title: 'Error',
        description: 'Please select a member first',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('progress_tracking')
        .insert({
          user_id: selectedMember,
          measurement_date: formData.measurementDate,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          bmi: formData.bmi ? parseFloat(formData.bmi) : null,
          body_fat_percentage: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
          chest: formData.chest ? parseFloat(formData.chest) : null,
          waist: formData.waist ? parseFloat(formData.waist) : null,
          hips: formData.hips ? parseFloat(formData.hips) : null,
          arms: formData.arms ? parseFloat(formData.arms) : null,
          thighs: formData.thighs ? parseFloat(formData.thighs) : null,
          notes: formData.notes || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Progress entry added successfully'
      });

      setShowAddDialog(false);
      setFormData({
        measurementDate: format(new Date(), 'yyyy-MM-dd'),
        weight: '',
        bmi: '',
        bodyFat: '',
        chest: '',
        waist: '',
        hips: '',
        arms: '',
        thighs: '',
        notes: ''
      });
      fetchProgressData(selectedMember);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare chart data
  const chartData = [...progressData]
    .reverse()
    .map(entry => ({
      date: format(new Date(entry.measurement_date), 'MMM dd'),
      weight: entry.weight || 0,
      bmi: entry.bmi || 0,
      bodyFat: entry.body_fat_percentage || 0
    }));

  // Calculate trends
  const getWeightTrend = () => {
    if (progressData.length < 2) return null;
    const latest = progressData[0].weight || 0;
    const previous = progressData[1].weight || 0;
    const diff = latest - previous;
    return { value: Math.abs(diff).toFixed(1), isUp: diff > 0 };
  };

  const weightTrend = getWeightTrend();

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
          <p className="text-muted-foreground mt-2">Monitor member fitness progress and measurements</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          disabled={!selectedMember}
          className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Member Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <Label>Select Member</Label>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {filteredMembers.map(member => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {selectedMember && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Latest Weight</p>
                  <p className="text-2xl font-bold text-foreground">
                    {progressData[0]?.weight || 'N/A'} {progressData[0]?.weight && 'kg'}
                  </p>
                </div>
                {weightTrend && (
                  <div className={`flex items-center gap-1 text-sm ${weightTrend.isUp ? 'text-warning' : 'text-success'}`}>
                    {weightTrend.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {weightTrend.value}kg
                  </div>
                )}
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">BMI</p>
              <p className="text-2xl font-bold text-foreground">
                {progressData[0]?.bmi?.toFixed(1) || 'N/A'}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Body Fat %</p>
              <p className="text-2xl font-bold text-foreground">
                {progressData[0]?.body_fat_percentage?.toFixed(1) || 'N/A'}{progressData[0]?.body_fat_percentage && '%'}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-2xl font-bold text-foreground">{progressData.length}</p>
            </Card>
          </div>

          {/* Progress Chart */}
          {chartData.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Progress Chart</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
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
                  <Legend />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} name="Weight (kg)" />
                  <Line type="monotone" dataKey="bmi" stroke="hsl(var(--success))" strokeWidth={2} name="BMI" />
                  <Line type="monotone" dataKey="bodyFat" stroke="hsl(var(--warning))" strokeWidth={2} name="Body Fat %" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Progress History */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Progress History</h3>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading progress data...</p>
            ) : progressData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No progress entries yet</p>
            ) : (
              <div className="space-y-3">
                {progressData.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-foreground">
                        {format(new Date(entry.measurement_date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {entry.weight && (
                        <div>
                          <span className="text-muted-foreground">Weight: </span>
                          <span className="font-medium text-foreground">{entry.weight} kg</span>
                        </div>
                      )}
                      {entry.bmi && (
                        <div>
                          <span className="text-muted-foreground">BMI: </span>
                          <span className="font-medium text-foreground">{entry.bmi.toFixed(1)}</span>
                        </div>
                      )}
                      {entry.body_fat_percentage && (
                        <div>
                          <span className="text-muted-foreground">Body Fat: </span>
                          <span className="font-medium text-foreground">{entry.body_fat_percentage}%</span>
                        </div>
                      )}
                      {entry.chest && (
                        <div>
                          <span className="text-muted-foreground">Chest: </span>
                          <span className="font-medium text-foreground">{entry.chest} cm</span>
                        </div>
                      )}
                      {entry.waist && (
                        <div>
                          <span className="text-muted-foreground">Waist: </span>
                          <span className="font-medium text-foreground">{entry.waist} cm</span>
                        </div>
                      )}
                      {entry.hips && (
                        <div>
                          <span className="text-muted-foreground">Hips: </span>
                          <span className="font-medium text-foreground">{entry.hips} cm</span>
                        </div>
                      )}
                      {entry.arms && (
                        <div>
                          <span className="text-muted-foreground">Arms: </span>
                          <span className="font-medium text-foreground">{entry.arms} cm</span>
                        </div>
                      )}
                      {entry.thighs && (
                        <div>
                          <span className="text-muted-foreground">Thighs: </span>
                          <span className="font-medium text-foreground">{entry.thighs} cm</span>
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
        </>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Progress Entry</DialogTitle>
            <DialogDescription>
              Record measurements and notes for {members.find(m => m.user_id === selectedMember)?.full_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEntry} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="measurementDate">Measurement Date *</Label>
              <Input
                id="measurementDate"
                type="date"
                required
                value={formData.measurementDate}
                onChange={(e) => setFormData({ ...formData, measurementDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
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
                <Label htmlFor="bodyFat">Body Fat %</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  step="0.1"
                  value={formData.bodyFat}
                  onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any observations or notes..."
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
