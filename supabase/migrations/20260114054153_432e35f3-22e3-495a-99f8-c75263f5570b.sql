-- Create payroll table for staff salary management
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salary_amount NUMERIC NOT NULL,
  bonus NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_period_start DATE NOT NULL,
  payment_period_end DATE NOT NULL,
  notes TEXT,
  paid_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Policies for payroll
CREATE POLICY "Admins can manage all payroll"
ON public.payroll
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view their own payroll"
ON public.payroll
FOR SELECT
USING (
  auth.uid() = staff_user_id OR 
  has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_payroll_updated_at
BEFORE UPDATE ON public.payroll
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_payroll_staff_user_id ON public.payroll(staff_user_id);
CREATE INDEX idx_payroll_payment_date ON public.payroll(payment_date);
CREATE INDEX idx_payroll_payment_status ON public.payroll(payment_status);

-- Add comment
COMMENT ON TABLE public.payroll IS 'Staff salary and payroll management';