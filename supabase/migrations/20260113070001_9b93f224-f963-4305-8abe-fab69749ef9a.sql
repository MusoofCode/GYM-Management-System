-- ============================================
-- COMPREHENSIVE GYM MANAGEMENT SYSTEM DATABASE
-- ============================================

-- 1. Add missing columns to profiles for enhanced member management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS blood_group text,
ADD COLUMN IF NOT EXISTS medical_conditions text,
ADD COLUMN IF NOT EXISTS joined_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- 2. Add columns to memberships for better tracking
ALTER TABLE public.memberships
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS transferred_from uuid REFERENCES public.profiles(user_id),
ADD COLUMN IF NOT EXISTS freeze_reason text;

-- 3. Create membership history table
CREATE TABLE IF NOT EXISTS public.membership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'renewed', 'transferred', 'frozen', 'unfrozen', 'cancelled', 'expired')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  amount numeric,
  performed_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Add discount/coupon system
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  max_uses integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Enhanced attendance with check-out
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS checked_in_by uuid,
ADD COLUMN IF NOT EXISTS checked_out_by uuid;

-- 6. Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Create notifications table (already exists, but ensure structure)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- 8. Create system settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now()
);

-- 9. Add invoice tracking to payments
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS invoice_path text,
ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.coupons(id);

-- 10. Create personal training sessions table
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  trainer_id uuid NOT NULL,
  session_date date NOT NULL,
  session_time time NOT NULL,
  duration_minutes integer NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 11. Add stock tracking to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS reorder_level integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS supplier text,
ADD COLUMN IF NOT EXISTS last_restocked timestamp with time zone;

-- 12. Create sales transactions table
CREATE TABLE IF NOT EXISTS public.sales_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  customer_name text,
  payment_method payment_method NOT NULL,
  sold_by uuid NOT NULL,
  sale_date timestamp with time zone DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Membership history policies
ALTER TABLE public.membership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all membership history"
ON public.membership_history FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can create membership history"
ON public.membership_history FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Coupons policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view coupons"
ON public.coupons FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Audit logs policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- System settings policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view settings"
ON public.system_settings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can manage settings"
ON public.system_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Training sessions policies
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their sessions"
ON public.training_sessions FOR SELECT
USING (auth.uid() = member_id);

CREATE POLICY "Trainers can view their sessions"
ON public.training_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trainers t
    WHERE t.user_id = auth.uid() AND t.id = training_sessions.trainer_id
  )
);

CREATE POLICY "Staff can manage all sessions"
ON public.training_sessions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Sales transactions policies
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view sales"
ON public.sales_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can create sales"
ON public.sales_transactions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_membership_history_user_id ON public.membership_history(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_history_created_at ON public.membership_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_member ON public.training_sessions(member_id, session_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer ON public.training_sessions(trainer_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON public.sales_transactions(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_joined_date ON public.profiles(joined_date DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on coupons
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on training sessions
CREATE TRIGGER update_training_sessions_updated_at
BEFORE UPDATE ON public.training_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- USEFUL FUNCTIONS
-- ============================================

-- Function to get membership statistics
CREATE OR REPLACE FUNCTION public.get_membership_stats()
RETURNS TABLE (
  total_members bigint,
  active_members bigint,
  expired_members bigint,
  frozen_members bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE m.status = 'active' AND m.end_date >= CURRENT_DATE) as active_members,
    COUNT(*) FILTER (WHERE m.status = 'active' AND m.end_date < CURRENT_DATE) as expired_members,
    COUNT(*) FILTER (WHERE m.status = 'frozen') as frozen_members
  FROM public.profiles p
  LEFT JOIN public.memberships m ON m.user_id = p.user_id;
$$;

-- Function to get revenue statistics
CREATE OR REPLACE FUNCTION public.get_revenue_stats(
  start_date date,
  end_date date
)
RETURNS TABLE (
  total_revenue numeric,
  membership_revenue numeric,
  product_revenue numeric,
  training_revenue numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(amount), 0) as total_revenue,
    COALESCE(SUM(amount) FILTER (WHERE payment_type = 'membership'), 0) as membership_revenue,
    COALESCE(SUM(amount) FILTER (WHERE payment_type = 'product'), 0) as product_revenue,
    COALESCE(SUM(amount) FILTER (WHERE payment_type = 'personal_training'), 0) as training_revenue
  FROM public.payments
  WHERE DATE(paid_at) BETWEEN start_date AND end_date;
$$;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('gym_name', '"FitFlow Gym"', 'Name of the gym'),
  ('gym_address', '"123 Fitness Street, City, Country"', 'Gym address'),
  ('gym_phone', '"+1 (555) 123-4567"', 'Gym contact phone'),
  ('gym_email', '"contact@fitflow.com"', 'Gym contact email'),
  ('membership_expiry_alert_days', '7', 'Days before expiry to send alert'),
  ('low_stock_alert_threshold', '10', 'Product quantity threshold for alerts')
ON CONFLICT (setting_key) DO NOTHING;
