import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Mail, Phone, Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AddStaffDialog } from "@/components/admin/AddStaffDialog";

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  joined_date: string | null;
  role: string;
}

export default function AdminStaff() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      // Fetch all staff and trainer profiles with their roles
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles!inner(role)
        `)
        .in("user_roles.role", ["staff", "trainer"])
        .order("full_name");

      if (error) throw error;

      const staffData = data?.map((profile: any) => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        status: profile.status,
        joined_date: profile.joined_date,
        role: profile.user_roles.role,
      })) || [];

      setStaff(staffData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load staff",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from staff?`)) return;

    try {
      // Delete user role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });

      fetchStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff member",
        variant: "destructive",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your staff and trainer accounts
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Staff</p>
          <p className="text-2xl font-bold text-foreground">{staff.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Staff Members</p>
          <p className="text-2xl font-bold text-primary">
            {staff.filter((s) => s.role === "staff").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Trainers</p>
          <p className="text-2xl font-bold text-secondary">
            {staff.filter((s) => s.role === "trainer").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-success">
            {staff.filter((s) => s.status === "active").length}
          </p>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      {/* Staff Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading staff...
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No staff members found
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === "trainer" ? "default" : "secondary"}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.phone ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3" />
                        {member.phone}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.joined_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(member.joined_date), "MMM dd, yyyy")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.status === "active" ? "default" : "outline"}
                    >
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.user_id, member.full_name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AddStaffDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchStaff}
      />
    </motion.div>
  );
}
