-- Add RLS policy to allow members to view basic trainer profile information
-- This is needed so members can see trainer names when viewing classes

CREATE POLICY "Members can view trainer profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.trainers t
    WHERE t.user_id = profiles.user_id 
    AND t.is_active = true
  )
);

-- Add index for better performance on class bookings queries
CREATE INDEX IF NOT EXISTS idx_class_bookings_user_status 
ON public.class_bookings(user_id, status);

CREATE INDEX IF NOT EXISTS idx_class_bookings_class_status 
ON public.class_bookings(class_id, status);

-- Add index for progress tracking queries
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_date 
ON public.progress_tracking(user_id, measurement_date DESC);

-- Ensure trainers table has proper index
CREATE INDEX IF NOT EXISTS idx_trainers_user_id 
ON public.trainers(user_id);

CREATE INDEX IF NOT EXISTS idx_trainers_active 
ON public.trainers(is_active);

-- Add helpful comment
COMMENT ON POLICY "Members can view trainer profiles" ON public.profiles IS 
'Allows all users to view profile information of active trainers so they can see trainer names when viewing classes';
