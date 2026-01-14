import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dumbbell, Calendar, User, PlayCircle, CheckCircle2 } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';

interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  exercises: any;
  trainer: {
    full_name: string;
  } | null;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
  day?: string;
}

export default function ExerciseRoutine() {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWorkoutPlans();
    }
  }, [user]);

  const fetchWorkoutPlans = async () => {
    try {
      // First, get workout plans
      const { data: plansData, error: plansError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      if (!plansData || plansData.length === 0) {
        setWorkoutPlans([]);
        return;
      }

      // Get trainer IDs
      const trainerIds = plansData
        .map(plan => plan.trainer_id)
        .filter(Boolean) as string[];

      // Fetch trainer profiles if any trainer IDs exist
      let trainersMap: Record<string, any> = {};
      if (trainerIds.length > 0) {
        // Get trainer user IDs
        const { data: trainersData } = await supabase
          .from('trainers')
          .select('id, user_id')
          .in('id', trainerIds);

        if (trainersData && trainersData.length > 0) {
          const trainerUserIds = trainersData.map(t => t.user_id);
          
          // Get profiles for trainers
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', trainerUserIds);

          // Create a map of trainer_id -> profile
          if (profilesData) {
            trainersData.forEach(trainer => {
              const profile = profilesData.find(p => p.user_id === trainer.user_id);
              if (profile) {
                trainersMap[trainer.id] = {
                  full_name: profile.full_name
                };
              }
            });
          }
        }
      }

      // Transform the data to include trainer info
      const transformedPlans = plansData.map(plan => ({
        ...plan,
        trainer: plan.trainer_id && trainersMap[plan.trainer_id] 
          ? trainersMap[plan.trainer_id]
          : null
      }));

      setWorkoutPlans(transformedPlans);
    } catch (error: any) {
      toast({
        title: 'Error loading workout plans',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanStatus = (plan: WorkoutPlan) => {
    const now = new Date();
    const startDate = new Date(plan.start_date);
    const endDate = plan.end_date ? new Date(plan.end_date) : null;

    if (!plan.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    if (isBefore(now, startDate)) return { label: 'Upcoming', variant: 'default' as const };
    if (endDate && isAfter(now, endDate)) return { label: 'Completed', variant: 'secondary' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exercise Routine</h1>
        <p className="text-muted-foreground mt-2">Your personalized workout plans</p>
      </div>

      {loading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Loading workout plans...</p>
        </Card>
      ) : workoutPlans.length === 0 ? (
        <Card className="p-12 text-center">
          <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Workout Plans Yet</h3>
          <p className="text-muted-foreground mb-6">
            Contact your trainer to create a personalized workout plan
          </p>
          <Button className="bg-gradient-primary">Contact Trainer</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {workoutPlans.map((plan, index) => {
            const status = getPlanStatus(plan);
            const exercises = plan.exercises as Exercise[] | null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  {/* Plan Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-foreground">{plan.name}</h2>
                        <Badge variant={status.variant} className="bg-primary/10 text-primary border-primary/20">
                          {status.label}
                        </Badge>
                      </div>
                      {plan.description && (
                        <p className="text-muted-foreground">{plan.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Plan Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-semibold text-foreground">
                          {format(new Date(plan.start_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    {plan.end_date && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">End Date</p>
                          <p className="font-semibold text-foreground">
                            {format(new Date(plan.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                    {plan.trainer && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Trainer</p>
                          <p className="font-semibold text-foreground">{plan.trainer.full_name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Exercises */}
                  {exercises && exercises.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-primary" />
                        Exercises
                      </h3>
                      <div className="space-y-3">
                        {exercises.map((exercise, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * idx }}
                            className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-foreground">{exercise.name}</h4>
                                  {exercise.day && (
                                    <Badge variant="outline" className="text-xs">
                                      {exercise.day}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium text-foreground">{exercise.sets}</span> sets
                                  </span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium text-foreground">{exercise.reps}</span> reps
                                  </span>
                                </div>
                                {exercise.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">{exercise.notes}</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No exercises added yet</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
