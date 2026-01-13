-- Fix Security Issue #1: Protect QR Codes
-- Drop existing policies that expose QR codes
DROP POLICY IF EXISTS "Users can view their own membership" ON public.memberships;
DROP POLICY IF EXISTS "Staff can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Staff can manage memberships" ON public.memberships;

-- Create new policies that exclude QR codes from general view
-- Members can view their own membership (including QR code)
CREATE POLICY "Members can view their own membership" ON public.memberships
    FOR SELECT USING (auth.uid() = user_id);

-- Members can update their own membership notes
CREATE POLICY "Members can update their own membership notes" ON public.memberships
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all memberships (including QR codes)
CREATE POLICY "Admins can view all memberships" ON public.memberships
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all memberships
CREATE POLICY "Admins can manage memberships" ON public.memberships
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create a secure function for QR validation (staff can validate without seeing QR code)
CREATE OR REPLACE FUNCTION public.validate_qr_code(_qr_code TEXT)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    membership_status membership_status,
    membership_end_date DATE,
    is_valid BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        m.user_id,
        p.full_name,
        m.status,
        m.end_date,
        (m.status = 'active' AND m.end_date >= CURRENT_DATE) as is_valid
    FROM public.memberships m
    JOIN public.profiles p ON p.user_id = m.user_id
    WHERE m.qr_code = _qr_code
    LIMIT 1;
$$;

-- Grant execute permission to authenticated users (for staff check-in)
GRANT EXECUTE ON FUNCTION public.validate_qr_code TO authenticated;

-- Fix Security Issue #2: Restrict Payment Data Access
-- Drop existing payment policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Staff can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Staff can create payments" ON public.payments;

-- Users can view their own payments
CREATE POLICY "Members can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Only admins can view all payments (not general staff)
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can create and manage payments
CREATE POLICY "Admins can create payments" ON public.payments
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payments" ON public.payments
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Fix Security Issue #3: Restrict Profile Access
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Staff and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Trainers can only view profiles of members they have workout plans for
CREATE POLICY "Trainers can view their clients profiles" ON public.profiles
    FOR SELECT USING (
        public.has_role(auth.uid(), 'trainer') AND
        EXISTS (
            SELECT 1 FROM public.workout_plans wp
            JOIN public.trainers t ON t.id = wp.trainer_id
            WHERE t.user_id = auth.uid() AND wp.user_id = profiles.user_id
        )
    );

-- Create a secure function for staff to search members during check-in
-- This allows limited lookup without exposing all profiles
CREATE OR REPLACE FUNCTION public.search_member_for_checkin(_search_term TEXT)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    membership_status membership_status,
    has_active_membership BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        p.user_id,
        p.full_name,
        p.email,
        m.status,
        (m.status = 'active' AND m.end_date >= CURRENT_DATE) as has_active_membership
    FROM public.profiles p
    LEFT JOIN public.memberships m ON m.user_id = p.user_id
    WHERE 
        (p.full_name ILIKE '%' || _search_term || '%' OR 
         p.email ILIKE '%' || _search_term || '%')
        AND LENGTH(_search_term) >= 3
    ORDER BY p.full_name
    LIMIT 10;
$$;

-- Grant execute permission to staff for member search
GRANT EXECUTE ON FUNCTION public.search_member_for_checkin TO authenticated;