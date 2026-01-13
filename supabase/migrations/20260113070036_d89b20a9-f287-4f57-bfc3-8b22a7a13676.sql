-- Fix the audit log policy to be more restrictive
-- Only allow authenticated users to create audit logs
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
