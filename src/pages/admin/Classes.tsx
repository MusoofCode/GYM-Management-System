import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Calendar as CalendarIcon } from 'lucide-react';

interface GymClass {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  duration_minutes: number;
  schedule_day: string;
  schedule_time: string;
  class_type: string | null;
  is_active: boolean;
  trainer_id: string | null;
  bookings_count: number;
  trainer_name?: string;
}

export default function AdminClasses() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('schedule_day')
        .order('schedule_time');

      if (classesError) throw classesError;

      // Fetch trainers and bookings separately
      const classIds = classesData?.map(c => c.id) || [];
      
      const [trainersData, bookingsData] = await Promise.all([
        supabase.from('trainers').select('id, user_id').in('id', classesData?.map(c => c.trainer_id).filter(Boolean) || []),
        supabase.from('class_bookings').select('class_id').in('class_id', classIds)
      ]);

      // Get trainer profiles
      const trainerUserIds = trainersData.data?.map(t => t.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', trainerUserIds);

      // Combine data
      const classesWithDetails = classesData?.map(gymClass => {
        const trainer = trainersData.data?.find(t => t.id === gymClass.trainer_id);
        const trainerProfile = profilesData?.find(p => p.user_id === trainer?.user_id);
        const bookingsCount = bookingsData.data?.filter(b => b.class_id === gymClass.id).length || 0;

        return {
          ...gymClass,
          trainer_name: trainerProfile?.full_name,
          bookings_count: bookingsCount
        };
      });

      setClasses(classesWithDetails || []);
    } catch (error: any) {
      toast({
        title: 'Error loading classes',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedByDay = classes.reduce((acc, gymClass) => {
    if (!acc[gymClass.schedule_day]) {
      acc[gymClass.schedule_day] = [];
    }
    acc[gymClass.schedule_day].push(gymClass);
    return acc;
  }, {} as Record<string, GymClass[]>);

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classes & Scheduling</h1>
          <p className="text-muted-foreground mt-2">Manage gym classes and schedules</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium">
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Classes</p>
          <p className="text-2xl font-bold text-foreground">{classes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Capacity</p>
          <p className="text-2xl font-bold text-primary">
            {classes.reduce((sum, c) => sum + c.capacity, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg Duration</p>
          <p className="text-2xl font-bold text-foreground">
            {Math.round(classes.reduce((sum, c) => sum + c.duration_minutes, 0) / classes.length || 0)} min
          </p>
        </Card>
      </div>

      {/* Classes by Day */}
      {loading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Loading classes...</p>
        </Card>
      ) : classes.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">No classes scheduled yet</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {daysOrder.map(day => {
            const dayClasses = groupedByDay[day];
            if (!dayClasses || dayClasses.length === 0) return null;

            return (
              <Card key={day} className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                  {day}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dayClasses.map((gymClass, index) => {
                    const capacityPercentage = (gymClass.bookings_count / gymClass.capacity) * 100;
                    const isAlmostFull = capacityPercentage >= 80;

                    return (
                      <motion.div
                        key={gymClass.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-foreground text-lg">{gymClass.name}</h3>
                            {gymClass.class_type && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-secondary/20">
                                {gymClass.class_type}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{gymClass.schedule_time}</p>
                            <p className="text-xs text-muted-foreground">{gymClass.duration_minutes} min</p>
                          </div>
                        </div>

                        {gymClass.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {gymClass.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm mb-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className={isAlmostFull ? "text-warning font-semibold" : ""}>
                              {gymClass.bookings_count}/{gymClass.capacity}
                            </span>
                          </div>
                          {gymClass.trainer_name && (
                            <span className="text-muted-foreground">
                              Trainer: <span className="text-foreground font-medium">
                                {gymClass.trainer_name}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${isAlmostFull ? 'bg-warning' : 'bg-primary'}`}
                            style={{ width: `${capacityPercentage}%` }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
