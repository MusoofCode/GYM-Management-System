import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, UserCheck, UserX, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Member {
  user_id: string;
  full_name: string;
  email: string;
  membership?: {
    status: string;
    end_date: string;
  };
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  member: {
    full_name: string;
  };
}

export default function AdminAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ checkedIn: 0, checkedOut: 0, total: 0 });

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      searchMembers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchTodayAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          user_id,
          check_in_time,
          check_out_time,
          member:profiles!attendance_user_id_fkey(full_name)
        `)
        .gte('check_in_time', `${today}T00:00:00`)
        .lte('check_in_time', `${today}T23:59:59`)
        .order('check_in_time', { ascending: false });

      if (error) throw error;

      const transformedData = (data || []).map((record: any) => ({
        ...record,
        member: Array.isArray(record.member) ? record.member[0] : record.member
      }));

      setTodayAttendance(transformedData);
      
      const checkedIn = transformedData.filter((r: any) => !r.check_out_time).length;
      const checkedOut = transformedData.filter((r: any) => r.check_out_time).length;
      
      setStats({
        checkedIn,
        checkedOut,
        total: transformedData.length
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load attendance',
        variant: 'destructive',
      });
    }
  };

  const searchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          membership:memberships(status, end_date)
        `)
        .ilike('full_name', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      
      const transformed = (data || []).map((member: any) => ({
        ...member,
        membership: Array.isArray(member.membership) && member.membership.length > 0 
          ? member.membership[0] 
          : null
      }));
      
      setSearchResults(transformed);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to search members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (member: Member) => {
    try {
      // Check if already checked in today
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: existing } = await supabase
        .from('attendance')
        .select('id, check_out_time')
        .eq('user_id', member.user_id)
        .gte('check_in_time', `${today}T00:00:00`)
        .lte('check_in_time', `${today}T23:59:59`)
        .maybeSingle();

      if (existing && !existing.check_out_time) {
        toast({
          title: 'Already Checked In',
          description: `${member.full_name} is already checked in`,
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('attendance')
        .insert({
          user_id: member.user_id,
          checked_in_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Check-in Successful',
        description: `${member.full_name} has been checked in`,
      });

      fetchTodayAttendance();
      setSearchTerm('');
      setSearchResults([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in',
        variant: 'destructive',
      });
    }
  };

  const handleCheckOut = async (recordId: string, memberName: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          check_out_time: new Date().toISOString(),
          checked_out_by: user?.id,
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: 'Check-out Successful',
        description: `${memberName} has been checked out`,
      });

      fetchTodayAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check out',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
        <p className="text-muted-foreground mt-2">Check-in and track member attendance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-500/10">
              <UserCheck className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currently In</p>
              <p className="text-2xl font-bold text-foreground">{stats.checkedIn}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-500/10">
              <UserX className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Checked Out</p>
              <p className="text-2xl font-bold text-foreground">{stats.checkedOut}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Today</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Check-in */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Check-in Member</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search member by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  {member.membership && (
                    <Badge 
                      variant={member.membership.status === 'active' ? 'default' : 'destructive'}
                    >
                      {member.membership.status}
                    </Badge>
                  )}
                </div>
                <Button onClick={() => handleCheckIn(member)} size="sm">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Today's Attendance */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Attendance</h2>
        {todayAttendance.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No attendance records today</p>
        ) : (
          <div className="space-y-2">
            {todayAttendance.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {record.member?.full_name?.split(' ').map(n => n[0]).join('') || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{record.member?.full_name || 'Unknown'}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        In: {format(new Date(record.check_in_time), 'HH:mm')}
                      </span>
                      {record.check_out_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Out: {format(new Date(record.check_out_time), 'HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!record.check_out_time && (
                  <Button
                    onClick={() => handleCheckOut(record.id, record.member?.full_name || 'Member')}
                    size="sm"
                    variant="outline"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Check Out
                  </Button>
                )}
                {record.check_out_time && (
                  <Badge variant="secondary">Completed</Badge>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
