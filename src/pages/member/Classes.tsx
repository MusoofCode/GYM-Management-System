import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Users, MapPin, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GymClass {
  id: string;
  name: string;
  description: string;
  schedule_day: string;
  schedule_time: string;
  duration_minutes: number;
  capacity: number;
  class_type: string;
  trainer: {
    full_name: string;
  };
  bookings_count?: number;
}

interface Booking {
  id: string;
  booking_date: string;
  status: string;
  class: GymClass;
}

export default function MemberClasses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [availableClasses, setAvailableClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailableClasses, setShowAvailableClasses] = useState(false);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [bookingClass, setBookingClass] = useState<GymClass | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyBookings();
      fetchAvailableClasses();
    }
  }, [user]);

  const fetchMyBookings = async () => {
    try {
      // First get bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('class_bookings')
        .select(`
          id,
          booking_date,
          status,
          class_id
        `)
        .eq('user_id', user?.id)
        .eq('status', 'confirmed')
        .order('booking_date', { ascending: true });

      if (bookingsError) throw bookingsError;

      // Get class details
      const classIds = bookingsData?.map((b: any) => b.class_id) || [];
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds);

      // Get trainer info
      const trainerIds = classesData?.map((c: any) => c.trainer_id).filter(Boolean) || [];
      const { data: trainersData } = await supabase
        .from('trainers')
        .select('id, user_id')
        .in('id', trainerIds);

      const userIds = trainersData?.map((t: any) => t.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Build a map of trainer_id to full_name
      const trainerMap = new Map();
      trainersData?.forEach((trainer: any) => {
        const profile = profilesData?.find((p: any) => p.user_id === trainer.user_id);
        if (profile) {
          trainerMap.set(trainer.id, profile.full_name);
        }
      });

      // Combine all data
      const transformedData = (bookingsData || []).map((booking: any) => {
        const classData = classesData?.find((c: any) => c.id === booking.class_id);
        return {
          ...booking,
          class: {
            ...classData,
            trainer: {
              full_name: classData ? trainerMap.get(classData.trainer_id) || 'N/A' : 'N/A'
            }
          }
        };
      });
      
      setMyBookings(transformedData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      // First get all active classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('schedule_day')
        .order('schedule_time');

      if (classesError) throw classesError;

      // Get booking counts
      const { data: bookingCounts } = await supabase
        .from('class_bookings')
        .select('class_id')
        .eq('status', 'confirmed');

      // Get trainer info separately
      const trainerIds = classesData?.map((c: any) => c.trainer_id).filter(Boolean) || [];
      const { data: trainersData } = await supabase
        .from('trainers')
        .select('id, user_id')
        .in('id', trainerIds);

      const userIds = trainersData?.map((t: any) => t.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Build a map of trainer_id to full_name
      const trainerMap = new Map();
      trainersData?.forEach((trainer: any) => {
        const profile = profilesData?.find((p: any) => p.user_id === trainer.user_id);
        if (profile) {
          trainerMap.set(trainer.id, profile.full_name);
        }
      });

      const classesWithCounts = (classesData || []).map((cls: any) => ({
        ...cls,
        trainer: {
          full_name: trainerMap.get(cls.trainer_id) || 'N/A'
        },
        bookings_count: bookingCounts?.filter((b) => b.class_id === cls.id).length || 0,
      }));

      setAvailableClasses(classesWithCounts);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load classes',
        variant: 'destructive',
      });
    }
  };

  const handleBookClass = async (classItem: GymClass) => {
    setBookingClass(classItem);
  };

  const confirmBooking = async () => {
    if (!bookingClass || !user) return;

    try {
      const { error } = await supabase.from('class_bookings').insert({
        user_id: user.id,
        class_id: bookingClass.id,
        booking_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'confirmed',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Class booked successfully!',
      });

      fetchMyBookings();
      fetchAvailableClasses();
      setBookingClass(null);
      setShowAvailableClasses(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to book class',
        variant: 'destructive',
      });
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBooking) return;

    try {
      const { error } = await supabase
        .from('class_bookings')
        .update({ status: 'cancelled' })
        .eq('id', cancelBooking.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Booking cancelled successfully',
      });

      fetchMyBookings();
      fetchAvailableClasses();
      setCancelBooking(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel booking',
        variant: 'destructive',
      });
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">My Classes</h1>
          <p className="text-muted-foreground mt-2">Manage your class bookings</p>
        </div>
        <Button
          onClick={() => setShowAvailableClasses(true)}
          className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Book a Class
        </Button>
      </div>

      {/* My Bookings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Upcoming Classes</h2>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : myBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No upcoming classes booked</p>
            <Button
              onClick={() => setShowAvailableClasses(true)}
              variant="outline"
              className="mt-4"
            >
              Browse Available Classes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myBookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{booking.class.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {booking.class.schedule_day}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.class.schedule_time} ({booking.class.duration_minutes} min)
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {booking.class.trainer.full_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {booking.class.class_type || 'General'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelBooking(booking)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Available Classes Dialog */}
      <Dialog open={showAvailableClasses} onOpenChange={setShowAvailableClasses}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Available Classes</DialogTitle>
            <DialogDescription>Browse and book classes for the week</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {daysOrder.map((day) => {
              const dayClasses = availableClasses.filter((c) => c.schedule_day === day);
              if (dayClasses.length === 0) return null;

              return (
                <div key={day}>
                  <h3 className="font-semibold text-lg mb-3">{day}</h3>
                  <div className="space-y-2">
                    {dayClasses.map((classItem) => {
                      const isFull = classItem.bookings_count >= classItem.capacity;
                      const isBooked = myBookings.some((b) => b.class.id === classItem.id);

                      return (
                        <div
                          key={classItem.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{classItem.name}</h4>
                              {isFull && <Badge variant="destructive">Full</Badge>}
                              {isBooked && <Badge variant="outline">Booked</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {classItem.description}
                            </p>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {classItem.schedule_time}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {classItem.bookings_count}/{classItem.capacity}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleBookClass(classItem)}
                            disabled={isFull || isBooked}
                            size="sm"
                          >
                            {isBooked ? 'Already Booked' : 'Book'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Dialog */}
      <AlertDialog open={!!bookingClass} onOpenChange={() => setBookingClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to book {bookingClass?.name} on {bookingClass?.schedule_day} at{' '}
              {bookingClass?.schedule_time}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBooking}>Confirm Booking</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Booking Dialog */}
      <AlertDialog open={!!cancelBooking} onOpenChange={() => setCancelBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your booking for {cancelBooking?.class.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} className="bg-destructive">
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
