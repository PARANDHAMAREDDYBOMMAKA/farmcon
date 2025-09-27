-- Enable RLS on notifications table if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications for any user" ON public.notifications;

-- Policy to allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy to allow users to update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy to allow the system to create notifications for any user
-- This is needed for server-side code to create notifications
CREATE POLICY "System can create notifications for any user" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO service_role;

-- Optional: Allow anonymous users to create notifications (for webhook handlers)
GRANT INSERT ON public.notifications TO anon;

-- You can run this script in your Supabase SQL editor or via psql