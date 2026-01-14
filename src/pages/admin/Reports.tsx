import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Users, TrendingUp, Calendar, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminReports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    membershipRevenue: 0,
    productRevenue: 0,
    trainingRevenue: 0,
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    frozenMembers: 0,
    newMembers: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [membershipData, setMembershipData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch revenue stats
      const { data: revenueStats, error: revenueError } = await supabase
        .rpc('get_revenue_stats', {
          start_date: dateRange.start,
          end_date: dateRange.end,
        });

      if (revenueError) throw revenueError;

      // Fetch membership stats
      const { data: membershipStats, error: membershipError } = await supabase
        .rpc('get_membership_stats');

      if (membershipError) throw membershipError;

      // Fetch new members count
      const { count: newMembersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('joined_date', dateRange.start)
        .lte('joined_date', dateRange.end);

      // Fetch daily revenue for chart
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, paid_at, payment_type')
        .gte('paid_at', `${dateRange.start}T00:00:00`)
        .lte('paid_at', `${dateRange.end}T23:59:59`)
        .order('paid_at');

      // Process revenue data by day
      const revenueByDay = payments?.reduce((acc: any, payment: any) => {
        const day = format(new Date(payment.paid_at), 'MMM dd');
        if (!acc[day]) {
          acc[day] = { date: day, revenue: 0 };
        }
        acc[day].revenue += Number(payment.amount);
        return acc;
      }, {});

      // Fetch attendance data
      const { data: attendance } = await supabase
        .from('attendance')
        .select('check_in_time')
        .gte('check_in_time', `${dateRange.start}T00:00:00`)
        .lte('check_in_time', `${dateRange.end}T23:59:59`);

      const attendanceByDay = attendance?.reduce((acc: any, record: any) => {
        const day = format(new Date(record.check_in_time), 'MMM dd');
        if (!acc[day]) {
          acc[day] = { date: day, count: 0 };
        }
        acc[day].count += 1;
        return acc;
      }, {});

      setStats({
        totalRevenue: revenueStats?.[0]?.total_revenue || 0,
        membershipRevenue: revenueStats?.[0]?.membership_revenue || 0,
        productRevenue: revenueStats?.[0]?.product_revenue || 0,
        trainingRevenue: revenueStats?.[0]?.training_revenue || 0,
        totalMembers: membershipStats?.[0]?.total_members || 0,
        activeMembers: membershipStats?.[0]?.active_members || 0,
        expiredMembers: membershipStats?.[0]?.expired_members || 0,
        frozenMembers: membershipStats?.[0]?.frozen_members || 0,
        newMembers: newMembersCount || 0,
      });

      setRevenueData(Object.values(revenueByDay || {}));
      setAttendanceData(Object.values(attendanceByDay || {}));
      
      // Membership status pie chart data
      setMembershipData([
        { name: 'Active', value: membershipStats?.[0]?.active_members || 0, color: '#10b981' },
        { name: 'Expired', value: membershipStats?.[0]?.expired_members || 0, color: '#ef4444' },
        { name: 'Frozen', value: membershipStats?.[0]?.frozen_members || 0, color: '#f59e0b' },
      ]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = [
        {
          'Report Type': 'Revenue Summary',
          'Period': `${dateRange.start} to ${dateRange.end}`,
          'Total Revenue': `$${stats.totalRevenue.toFixed(2)}`,
          'Membership Revenue': `$${stats.membershipRevenue.toFixed(2)}`,
          'Product Revenue': `$${stats.productRevenue.toFixed(2)}`,
          'Training Revenue': `$${stats.trainingRevenue.toFixed(2)}`,
        },
        {},
        {
          'Report Type': 'Membership Summary',
          'Total Members': stats.totalMembers,
          'Active Members': stats.activeMembers,
          'Expired Members': stats.expiredMembers,
          'Frozen Members': stats.frozenMembers,
          'New Members': stats.newMembers,
        },
      ];

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');

      // Generate filename with date
      const fileName = `FitFlow_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Success',
        description: 'Report exported to Excel successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text('FitFlow - Business Report', 14, 20);

      // Add date range
      doc.setFontSize(12);
      doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);

      // Revenue Summary
      doc.setFontSize(16);
      doc.text('Revenue Summary', 14, 45);

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Amount']],
        body: [
          ['Total Revenue', `$${stats.totalRevenue.toFixed(2)}`],
          ['Membership Revenue', `$${stats.membershipRevenue.toFixed(2)}`],
          ['Product Revenue', `$${stats.productRevenue.toFixed(2)}`],
          ['Training Revenue', `$${stats.trainingRevenue.toFixed(2)}`],
        ],
      });

      // Membership Summary
      doc.setFontSize(16);
      doc.text('Membership Summary', 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Metric', 'Count']],
        body: [
          ['Total Members', stats.totalMembers.toString()],
          ['Active Members', stats.activeMembers.toString()],
          ['Expired Members', stats.expiredMembers.toString()],
          ['Frozen Members', stats.frozenMembers.toString()],
          ['New Members', stats.newMembers.toString()],
        ],
      });

      // Generate filename with date
      const fileName = `FitFlow_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

      // Download file
      doc.save(fileName);

      toast({
        title: 'Success',
        description: 'Report exported to PDF successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export report',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">Comprehensive business insights</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="start">Start Date</Label>
            <Input
              id="start"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">End Date</Label>
            <Input
              id="end"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setDateRange({
                start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                end: format(new Date(), 'yyyy-MM-dd'),
              })}
              variant="outline"
              size="sm"
            >
              Last 7 Days
            </Button>
            <Button
              onClick={() => setDateRange({
                start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                end: format(new Date(), 'yyyy-MM-dd'),
              })}
              variant="outline"
              size="sm"
            >
              Last 30 Days
            </Button>
          </div>
        </div>
      </Card>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-500/10">
              <FileText className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Memberships</p>
              <p className="text-2xl font-bold text-foreground">${stats.membershipRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-500/10">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="text-2xl font-bold text-foreground">${stats.productRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-500/10">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Training</p>
              <p className="text-2xl font-bold text-foreground">${stats.trainingRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Member Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Members</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalMembers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-500">{stats.activeMembers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Expired</p>
          <p className="text-2xl font-bold text-red-500">{stats.expiredMembers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Frozen</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.frozenMembers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">New Members</p>
          <p className="text-2xl font-bold text-primary">{stats.newMembers}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Membership Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Membership Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={membershipData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {membershipData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Attendance Trend */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Daily Attendance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Check-ins" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </motion.div>
  );
}
