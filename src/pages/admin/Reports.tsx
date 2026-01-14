import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileDown, FileSpreadsheet, DollarSign, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportStats {
  totalRevenue: number;
  membershipRevenue: number;
  productRevenue: number;
  trainingRevenue: number;
  totalStudents: number;
  activeStudents: number;
  expiredStudents: number;
  totalPayments: number;
  totalPayrollExpenses: number;
  netIncome: number;
  averageRevenuePerStudent: number;
}

interface DailyAttendance {
  date: string;
  count: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    membershipRevenue: 0,
    productRevenue: 0,
    trainingRevenue: 0,
    totalStudents: 0,
    activeStudents: 0,
    expiredStudents: 0,
    totalPayments: 0,
    totalPayrollExpenses: 0,
    netIncome: 0,
    averageRevenuePerStudent: 0
  });
  const [revenueByType, setRevenueByType] = useState<any[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch revenue data
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .gte('paid_at', startDate)
        .lte('paid_at', endDate + 'T23:59:59');

      const totalRevenue = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const membershipRevenue = paymentsData?.filter(p => p.payment_type === 'membership')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const productRevenue = paymentsData?.filter(p => p.payment_type === 'product')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const trainingRevenue = paymentsData?.filter(p => p.payment_type === 'personal_training')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Fetch student data
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: memberships } = await supabase
        .from('memberships')
        .select('status');

      const activeStudents = memberships?.filter(m => m.status === 'active').length || 0;
      const expiredStudents = memberships?.filter(m => m.status === 'expired').length || 0;

      // Fetch payroll expenses
      const { data: payrollData } = await supabase
        .from('payroll')
        .select('net_amount')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      const totalPayrollExpenses = payrollData?.reduce((sum, p) => sum + Number(p.net_amount), 0) || 0;

      // Calculate net income
      const netIncome = totalRevenue - totalPayrollExpenses;

      // Revenue by type for pie chart
      const revenueTypes = [
        { name: 'Memberships', value: membershipRevenue },
        { name: 'Products', value: productRevenue },
        { name: 'Training', value: trainingRevenue }
      ].filter(item => item.value > 0);

      setRevenueByType(revenueTypes);

      // Fetch attendance data
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('check_in_time')
        .gte('check_in_time', startDate)
        .lte('check_in_time', endDate + 'T23:59:59')
        .order('check_in_time');

      // Group attendance by date
      const attendanceByDate: { [key: string]: number } = {};
      attendanceData?.forEach(a => {
        const date = a.check_in_time.split('T')[0];
        attendanceByDate[date] = (attendanceByDate[date] || 0) + 1;
      });

      const dailyAttendanceArray = Object.entries(attendanceByDate).map(([date, count]) => ({
        date: format(new Date(date), 'MMM dd'),
        count
      }));

      setDailyAttendance(dailyAttendanceArray);

      // Monthly data for last 6 months
      const monthlyDataArray: MonthlyRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = format(startOfMonth(subMonths(new Date(), i)), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(subMonths(new Date(), i)), 'yyyy-MM-dd');

        const { data: monthPayments } = await supabase
          .from('payments')
          .select('amount')
          .gte('paid_at', monthStart)
          .lte('paid_at', monthEnd + 'T23:59:59');

        const { data: monthPayroll } = await supabase
          .from('payroll')
          .select('net_amount')
          .gte('payment_date', monthStart)
          .lte('payment_date', monthEnd);

        const monthRevenue = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const monthExpenses = monthPayroll?.reduce((sum, p) => sum + Number(p.net_amount), 0) || 0;

        monthlyDataArray.push({
          month: format(subMonths(new Date(), i), 'MMM yyyy'),
          revenue: monthRevenue,
          expenses: monthExpenses,
          net: monthRevenue - monthExpenses
        });
      }

      setMonthlyData(monthlyDataArray);

      setStats({
        totalRevenue,
        membershipRevenue,
        productRevenue,
        trainingRevenue,
        totalStudents: totalStudents || 0,
        activeStudents,
        expiredStudents,
        totalPayments: paymentsData?.length || 0,
        totalPayrollExpenses,
        netIncome,
        averageRevenuePerStudent: totalStudents ? totalRevenue / totalStudents : 0
      });

    } catch (error: any) {
      toast({
        title: 'Error loading reports',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Gym Management System - Financial Report'],
      ['Period:', `${startDate} to ${endDate}`],
      ['Generated:', format(new Date(), 'PPP')],
      [],
      ['REVENUE SUMMARY'],
      ['Total Revenue', `$${stats.totalRevenue.toLocaleString()}`],
      ['Membership Revenue', `$${stats.membershipRevenue.toLocaleString()}`],
      ['Product Revenue', `$${stats.productRevenue.toLocaleString()}`],
      ['Training Revenue', `$${stats.trainingRevenue.toLocaleString()}`],
      [],
      ['STUDENT STATISTICS'],
      ['Total Students', stats.totalStudents],
      ['Active Students', stats.activeStudents],
      ['Expired Students', stats.expiredStudents],
      ['Average Revenue per Student', `$${stats.averageRevenuePerStudent.toFixed(2)}`],
      [],
      ['EXPENSES'],
      ['Total Payroll Expenses', `$${stats.totalPayrollExpenses.toLocaleString()}`],
      [],
      ['NET INCOME', `$${stats.netIncome.toLocaleString()}`]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Monthly data sheet
    const monthlySheetData = [
      ['Month', 'Revenue', 'Expenses', 'Net Income'],
      ...monthlyData.map(m => [m.month, m.revenue, m.expenses, m.net])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(monthlySheetData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Data');

    // Attendance sheet
    const attendanceSheetData = [
      ['Date', 'Attendance Count'],
      ...dailyAttendance.map(a => [a.date, a.count])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(attendanceSheetData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Attendance');

    XLSX.writeFile(wb, `gym-report-${startDate}-to-${endDate}.xlsx`);

    toast({
      title: 'Success',
      description: 'Report exported to Excel successfully'
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Gym Management System', 14, 20);
    doc.setFontSize(16);
    doc.text('Financial Report', 14, 28);

    // Period
    doc.setFontSize(10);
    doc.text(`Period: ${format(new Date(startDate), 'PP')} to ${format(new Date(endDate), 'PP')}`, 14, 36);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 42);

    // Revenue Summary
    doc.setFontSize(14);
    doc.text('Revenue Summary', 14, 52);
    
    autoTable(doc, {
      startY: 56,
      head: [['Category', 'Amount']],
      body: [
        ['Total Revenue', `$${stats.totalRevenue.toLocaleString()}`],
        ['Membership Revenue', `$${stats.membershipRevenue.toLocaleString()}`],
        ['Product Revenue', `$${stats.productRevenue.toLocaleString()}`],
        ['Training Revenue', `$${stats.trainingRevenue.toLocaleString()}`]
      ],
      theme: 'striped'
    });

    // Student Statistics
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Student Statistics', 14, lastY);

    autoTable(doc, {
      startY: lastY + 4,
      head: [['Metric', 'Value']],
      body: [
        ['Total Students', stats.totalStudents.toString()],
        ['Active Students', stats.activeStudents.toString()],
        ['Expired Students', stats.expiredStudents.toString()],
        ['Avg Revenue per Student', `$${stats.averageRevenuePerStudent.toFixed(2)}`]
      ],
      theme: 'striped'
    });

    // Expenses & Net Income
    const lastY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Financial Summary', 14, lastY2);

    autoTable(doc, {
      startY: lastY2 + 4,
      head: [['Category', 'Amount']],
      body: [
        ['Total Payroll Expenses', `$${stats.totalPayrollExpenses.toLocaleString()}`],
        ['Net Income', `$${stats.netIncome.toLocaleString()}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`gym-report-${startDate}-to-${endDate}.pdf`);

    toast({
      title: 'Success',
      description: 'Report exported to PDF successfully'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">Comprehensive business insights and reports</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportToExcel}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>
          <Button 
            onClick={exportToPDF}
            className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">${stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
              <p className="text-xs text-success">{stats.activeStudents} active</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payroll Expenses</p>
              <p className="text-2xl font-bold text-foreground">${stats.totalPayrollExpenses.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${stats.netIncome >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <TrendingUp className={`w-6 h-6 ${stats.netIncome >= 0 ? 'text-success' : 'text-destructive'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Income</p>
              <p className={`text-2xl font-bold ${stats.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${stats.netIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Membership Revenue</p>
          <p className="text-2xl font-bold text-primary">${stats.membershipRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalRevenue > 0 ? ((stats.membershipRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}% of total
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Product Revenue</p>
          <p className="text-2xl font-bold text-success">${stats.productRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalRevenue > 0 ? ((stats.productRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}% of total
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Training Revenue</p>
          <p className="text-2xl font-bold text-warning">${stats.trainingRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalRevenue > 0 ? ((stats.trainingRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}% of total
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue vs Expenses */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Monthly Revenue vs Expenses</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Revenue by Type */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Revenue Distribution</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : revenueByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {revenueByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">No revenue data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Daily Attendance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Daily Attendance</h3>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : dailyAttendance.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyAttendance}>
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
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No attendance data available</p>
          </div>
        )}
      </Card>

      {/* Net Income Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Net Income Trend (6 Months)</h3>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                name="Net Income"
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </motion.div>
  );
}