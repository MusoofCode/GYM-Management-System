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
import {
  Search,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PayrollRecord {
  id: string;
  staff_user_id: string;
  payment_date: string;
  salary_amount: number;
  bonus: number;
  deductions: number;
  net_amount: number;
  payment_method: string;
  payment_status: string;
  payment_period_start: string;
  payment_period_end: string;
  notes: string | null;
  staff_name?: string;
}

interface StaffMember {
  user_id: string;
  full_name: string;
  role: string;
}

export default function AdminPayroll() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    staffCount: 0,
    thisMonthTotal: 0,
  });

  const [formData, setFormData] = useState({
    staff_user_id: "",
    salary_amount: "",
    bonus: "0",
    deductions: "0",
    payment_method: "bank_transfer",
    payment_period_start: "",
    payment_period_end: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from("profiles")
        .select(`
          user_id,
          full_name,
          user_roles!inner(role)
        `)
        .in("user_roles.role", ["staff", "trainer"]);

      if (staffError) throw staffError;

      const staff = staffData?.map((profile: any) => ({
        user_id: profile.user_id,
        full_name: profile.full_name,
        role: profile.user_roles.role,
      })) || [];

      setStaffMembers(staff);

      // Fetch payroll records
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select("*")
        .order("payment_date", { ascending: false });

      if (payrollError) throw payrollError;

      // Enrich payroll with staff names
      const enrichedPayroll = payrollData?.map((record: any) => ({
        ...record,
        staff_name: staff.find((s) => s.user_id === record.staff_user_id)?.full_name || "Unknown",
      })) || [];

      setPayrollRecords(enrichedPayroll);

      // Calculate stats
      const totalPaid = enrichedPayroll
        .filter((r) => r.payment_status === "paid")
        .reduce((sum, r) => sum + Number(r.net_amount), 0);

      const totalPending = enrichedPayroll
        .filter((r) => r.payment_status === "pending")
        .reduce((sum, r) => sum + Number(r.net_amount), 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthTotal = enrichedPayroll
        .filter((r) => {
          const paymentDate = new Date(r.payment_date);
          return (
            paymentDate.getMonth() === currentMonth &&
            paymentDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, r) => sum + Number(r.net_amount), 0);

      setStats({
        totalPaid,
        totalPending,
        staffCount: staff.length,
        thisMonthTotal,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load payroll data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const netAmount =
        Number(formData.salary_amount) +
        Number(formData.bonus) -
        Number(formData.deductions);

      const { error } = await supabase.from("payroll").insert({
        staff_user_id: formData.staff_user_id,
        salary_amount: Number(formData.salary_amount),
        bonus: Number(formData.bonus),
        deductions: Number(formData.deductions),
        net_amount: netAmount,
        payment_method: formData.payment_method as any,
        payment_period_start: formData.payment_period_start,
        payment_period_end: formData.payment_period_end,
        notes: formData.notes || null,
      } as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll record added successfully",
      });

      setShowAddDialog(false);
      setFormData({
        staff_user_id: "",
        salary_amount: "",
        bonus: "0",
        deductions: "0",
        payment_method: "bank_transfer",
        payment_period_start: "",
        payment_period_end: "",
        notes: "",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add payroll record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payroll")
        .update({ payment_status: "paid", payment_date: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll marked as paid",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payroll",
        variant: "destructive",
      });
    }
  };

  const filteredRecords = payrollRecords.filter((record) =>
    record.staff_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Payroll</h1>
          <p className="text-muted-foreground mt-2">
            Manage staff salaries and payments
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payroll
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-success/10">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-foreground">
                ${stats.totalPaid.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-warning/10">
              <Calendar className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground">
                ${stats.totalPending.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Staff Count</p>
              <p className="text-2xl font-bold text-foreground">{stats.staffCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-accent/10">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground">
                ${stats.thisMonthTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by staff name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      {/* Payroll Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading payroll records...
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No payroll records found
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.staff_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(record.payment_period_start), "MMM dd")} -{" "}
                      {format(new Date(record.payment_period_end), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>${Number(record.salary_amount).toFixed(2)}</TableCell>
                  <TableCell className="text-success">
                    +${Number(record.bonus).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-destructive">
                    -${Number(record.deductions).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-bold">
                    ${Number(record.net_amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={record.payment_status === "paid" ? "default" : "outline"}
                    >
                      {record.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {record.payment_status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(record.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Payroll Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Payroll Record</DialogTitle>
            <DialogDescription>
              Create a new payroll record for staff member
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPayroll} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff">Staff Member *</Label>
              <Select
                value={formData.staff_user_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, staff_user_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.user_id} value={staff.user_id}>
                      {staff.full_name} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_start">Period Start *</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={formData.payment_period_start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_period_start: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period_end">Period End *</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={formData.payment_period_end}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_period_end: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Base Salary *</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={formData.salary_amount}
                onChange={(e) =>
                  setFormData({ ...formData, salary_amount: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus</Label>
                <Input
                  id="bonus"
                  type="number"
                  step="0.01"
                  value={formData.bonus}
                  onChange={(e) =>
                    setFormData({ ...formData, bonus: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductions">Deductions</Label>
                <Input
                  id="deductions"
                  type="number"
                  step="0.01"
                  value={formData.deductions}
                  onChange={(e) =>
                    setFormData({ ...formData, deductions: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes"
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Net Amount:</p>
              <p className="text-2xl font-bold text-foreground">
                $
                {(
                  Number(formData.salary_amount || 0) +
                  Number(formData.bonus || 0) -
                  Number(formData.deductions || 0)
                ).toFixed(2)}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Payroll"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
