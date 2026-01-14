import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, Activity, TrendingUp, Weight, Ruler, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressData {
  measurement_date: string;
  weight: number | null;
  body_fat_percentage: number | null;
  bmi: number | null;
  waist: number | null;
  chest: number | null;
  arms: number | null;
}

export default function HealthStatus() {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', user?.id)
        .order('measurement_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setProgressData(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading health data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const latestData = progressData[progressData.length - 1];
  const previousData = progressData[progressData.length - 2];

  const getChange = (current: number | null | undefined, previous: number | null | undefined) => {
    if (!current || !previous) return null;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const healthMetrics = [
    {
      icon: Weight,
      label: 'Weight',
      value: latestData?.weight ? `${latestData.weight} kg` : 'N/A',
      change: getChange(latestData?.weight, previousData?.weight),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Activity,
      label: 'Body Fat %',
      value: latestData?.body_fat_percentage ? `${latestData.body_fat_percentage}%` : 'N/A',
      change: getChange(latestData?.body_fat_percentage, previousData?.body_fat_percentage),
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      icon: Target,
      label: 'BMI',
      value: latestData?.bmi ? latestData.bmi.toFixed(1) : 'N/A',
      change: getChange(latestData?.bmi, previousData?.bmi),
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Ruler,
      label: 'Waist',
      value: latestData?.waist ? `${latestData.waist} cm` : 'N/A',
      change: getChange(latestData?.waist, previousData?.waist),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const weightChartData = progressData.map(d => ({
    date: new Date(d.measurement_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: d.weight || 0
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Status</h1>
        <p className="text-muted-foreground mt-2">Track your health metrics and progress</p>
      </div>

      {loading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Loading health data...</p>
        </Card>
      ) : progressData.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Health Data Yet</h3>
          <p className="text-muted-foreground">
            Ask your trainer to record your first health measurements
          </p>
        </Card>
      ) : (
        <>
          {/* Health Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <metric.icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    {metric.change && (
                      <Badge variant={parseFloat(metric.change) < 0 ? 'default' : 'secondary'}>
                        {parseFloat(metric.change) > 0 ? '+' : ''}{metric.change}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Weight Progress Chart */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weight Progress
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Your weight trend over time</p>
            </div>
            {weightChartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
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
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </Card>

          {/* Body Measurements */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-6">Body Measurements</h3>
            <div className="space-y-4">
              {latestData?.chest && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Chest</span>
                    <span className="text-sm text-muted-foreground">{latestData.chest} cm</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </motion.div>
              )}
              {latestData?.waist && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Waist</span>
                    <span className="text-sm text-muted-foreground">{latestData.waist} cm</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </motion.div>
              )}
              {latestData?.arms && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Arms</span>
                    <span className="text-sm text-muted-foreground">{latestData.arms} cm</span>
                  </div>
                  <Progress value={55} className="h-2" />
                </motion.div>
              )}
            </div>
          </Card>
        </>
      )}
    </motion.div>
  );
}
