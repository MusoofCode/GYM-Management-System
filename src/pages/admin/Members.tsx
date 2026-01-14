import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, MoreVertical, Edit, Trash2, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddMemberDialog } from '@/components/admin/AddMemberDialog';
import { EditMemberDialog } from '@/components/admin/EditMemberDialog';
import { AssignMembershipDialog } from '@/components/admin/AssignMembershipDialog';
import { ConfirmPaymentDialog } from '@/components/admin/ConfirmPaymentDialog';

interface Member {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  membership?: {
    id: string;
    status: string;
    end_date: string;
    payment_status: string | null;
    plan: {
      name: string;
    };
  };
}

export default function AdminStudents() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          phone,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch memberships separately due to RLS
      const { data: memberships } = await supabase
        .from('memberships')
        .select(`
          id,
          user_id,
          status,
          end_date,
          payment_status,
          plan:membership_plans(name)
        `);

      // Combine data
      const membersWithMemberships = profiles?.map(profile => ({
        ...profile,
        membership: memberships?.find(m => m.user_id === profile.user_id)
      }));

      setMembers(membersWithMemberships || []);
    } catch (error: any) {
      toast({
        title: 'Error loading students',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      selectedStatus === 'all' || 
      member.membership?.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'destructive';
      case 'pending': return 'warning';
      case 'frozen': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setShowEditDialog(true);
  };

  const handleAssignMembership = (member: Member) => {
    setSelectedMember(member);
    setShowAssignDialog(true);
  };

  const handleConfirmPayment = (member: Member) => {
    setSelectedMember(member);
    setShowPaymentDialog(true);
  };

  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMember) return;

    setDeletingMember(true);
    try {
      // Delete user from auth (this will cascade delete related records)
      const { error } = await supabase.auth.admin.deleteUser(selectedMember.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });

      fetchMembers();
      setShowDeleteDialog(false);
      setSelectedMember(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete student',
        variant: 'destructive',
      });
    } finally {
      setDeletingMember(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students Management</h1>
          <p className="text-muted-foreground mt-2">Manage all gym students and memberships</p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Students</p>
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-success">
            {members.filter(m => m.membership?.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Expired</p>
          <p className="text-2xl font-bold text-destructive">
            {members.filter(m => m.membership?.status === 'expired').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-success">
            {members.filter(m => m.membership?.payment_status === 'paid').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Unpaid</p>
          <p className="text-2xl font-bold text-warning">
            {members.filter(m => m.membership?.payment_status === 'pending' || !m.membership?.payment_status).length}
          </p>
        </Card>
      </div>

      {/* Students List */}
      <Card className="p-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading students...</p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No students found</p>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {member.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{member.full_name}</h3>
                      {member.membership && (
                        <>
                          <Badge variant="outline" className={`text-xs bg-${getStatusColor(member.membership.status)}/10 text-${getStatusColor(member.membership.status)} border-${getStatusColor(member.membership.status)}/20`}>
                            {member.membership.status}
                          </Badge>
                          {member.membership.payment_status === 'paid' ? (
                            <Badge className="text-xs bg-success/10 text-success border-success/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                              <XCircle className="w-3 h-3 mr-1" />
                              Unpaid
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  
                  <div className="hidden md:flex flex-col items-end gap-1">
                    {member.membership ? (
                      <>
                        <span className="text-sm font-medium text-foreground">
                          {member.membership.plan?.name || 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Expires: {format(new Date(member.membership.end_date), 'MMM dd, yyyy')}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">No membership</span>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEdit(member)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Student
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAssignMembership(member)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Assign Membership
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleConfirmPayment(member)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Payment
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteClick(member)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Student
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <AddMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchMembers}
      />

      <EditMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        member={selectedMember}
        onSuccess={fetchMembers}
      />

      {selectedMember && (
        <>
          <AssignMembershipDialog
            open={showAssignDialog}
            onOpenChange={setShowAssignDialog}
            userId={selectedMember.user_id}
            userName={selectedMember.full_name}
            onSuccess={fetchMembers}
          />
          
          <ConfirmPaymentDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            userId={selectedMember.user_id}
            userName={selectedMember.full_name}
            membershipId={selectedMember.membership?.id}
            onSuccess={fetchMembers}
          />
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedMember?.full_name}'s account and all associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingMember ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
