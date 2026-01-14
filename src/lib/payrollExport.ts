import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface PayrollRecord {
  id: string;
  staff_user_id: string;
  staff_name?: string;
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
}

export const exportPayrollToCSV = (records: PayrollRecord[], filename?: string) => {
  // Create CSV headers
  const headers = [
    'Staff Name',
    'Period Start',
    'Period End',
    'Base Salary',
    'Bonus',
    'Deductions',
    'Net Amount',
    'Payment Method',
    'Status',
    'Payment Date',
    'Notes'
  ];

  // Create CSV rows
  const rows = records.map(record => [
    record.staff_name || 'Unknown',
    format(new Date(record.payment_period_start), 'MM/dd/yyyy'),
    format(new Date(record.payment_period_end), 'MM/dd/yyyy'),
    `$${Number(record.salary_amount).toFixed(2)}`,
    `$${Number(record.bonus).toFixed(2)}`,
    `$${Number(record.deductions).toFixed(2)}`,
    `$${Number(record.net_amount).toFixed(2)}`,
    record.payment_method.replace('_', ' ').toUpperCase(),
    record.payment_status.toUpperCase(),
    format(new Date(record.payment_date), 'MM/dd/yyyy'),
    record.notes || ''
  ]);

  // Calculate totals
  const totals = [
    'TOTAL',
    '',
    '',
    `$${records.reduce((sum, r) => sum + Number(r.salary_amount), 0).toFixed(2)}`,
    `$${records.reduce((sum, r) => sum + Number(r.bonus), 0).toFixed(2)}`,
    `$${records.reduce((sum, r) => sum + Number(r.deductions), 0).toFixed(2)}`,
    `$${records.reduce((sum, r) => sum + Number(r.net_amount), 0).toFixed(2)}`,
    '',
    '',
    '',
    ''
  ];

  // Combine all data
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    totals.map(cell => `"${cell}"`).join(',')
  ].join('\n');

  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `payroll-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPayrollToPDF = (records: PayrollRecord[], filename?: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Payroll Report', 14, 22);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, 14, 30);
  
  // Calculate totals
  const totalSalary = records.reduce((sum, r) => sum + Number(r.salary_amount), 0);
  const totalBonus = records.reduce((sum, r) => sum + Number(r.bonus), 0);
  const totalDeductions = records.reduce((sum, r) => sum + Number(r.deductions), 0);
  const totalNet = records.reduce((sum, r) => sum + Number(r.net_amount), 0);
  
  // Add summary section
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Summary', 14, 40);
  
  doc.setFontSize(10);
  doc.text(`Total Records: ${records.length}`, 14, 48);
  doc.text(`Total Base Salary: $${totalSalary.toFixed(2)}`, 14, 54);
  doc.text(`Total Bonus: $${totalBonus.toFixed(2)}`, 14, 60);
  doc.text(`Total Deductions: $${totalDeductions.toFixed(2)}`, 14, 66);
  doc.text(`Total Net Amount: $${totalNet.toFixed(2)}`, 14, 72);
  
  // Prepare table data
  const tableData = records.map(record => [
    record.staff_name || 'Unknown',
    `${format(new Date(record.payment_period_start), 'MM/dd/yy')} - ${format(new Date(record.payment_period_end), 'MM/dd/yy')}`,
    `$${Number(record.salary_amount).toFixed(2)}`,
    `$${Number(record.bonus).toFixed(2)}`,
    `$${Number(record.deductions).toFixed(2)}`,
    `$${Number(record.net_amount).toFixed(2)}`,
    record.payment_status.toUpperCase()
  ]);
  
  // Add table
  (doc as any).autoTable({
    startY: 82,
    head: [['Staff', 'Period', 'Salary', 'Bonus', 'Deductions', 'Net', 'Status']],
    body: tableData,
    foot: [['TOTAL', '', `$${totalSalary.toFixed(2)}`, `$${totalBonus.toFixed(2)}`, `$${totalDeductions.toFixed(2)}`, `$${totalNet.toFixed(2)}`, '']],
    theme: 'grid',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [40, 40, 40],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'center' }
    }
  });
  
  // Save the PDF
  doc.save(filename || `payroll-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
