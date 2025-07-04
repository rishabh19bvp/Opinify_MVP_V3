-- scripts/security_and_indexes.sql

-- Enable Row-Level Security (RLS) for all relevant tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to certain tables
-- Note: More restrictive policies will be layered on top for write operations
CREATE POLICY "Allow public read access to polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Allow public read access to comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to NGOs" ON public.ngos FOR SELECT USING (true);

-- Users can only view their own profile information
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Authenticated users can insert their own votes
CREATE POLICY "Authenticated users can insert votes" ON public.votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own votes
CREATE POLICY "Users can view their own votes" ON public.votes
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can (soft) delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);
  
-- Users can see their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Create indexes for performance optimization

-- Index on users' phone and ward for quick lookups
CREATE INDEX IF NOT EXISTS users_phone_index ON public.users(phone);
CREATE INDEX IF NOT EXISTS users_ward_index ON public.users(ward);

-- Index on polls' user_id and ward for filtering
CREATE INDEX IF NOT EXISTS polls_user_id_index ON public.polls(user_id);
CREATE INDEX IF NOT EXISTS polls_ward_index ON public.polls(ward);

-- Composite index on votes for user and poll to enforce uniqueness and speed up lookups
CREATE UNIQUE INDEX IF NOT EXISTS votes_user_poll_unique_index ON public.votes(user_id, poll_id);

-- Index on comments for user and poll
CREATE INDEX IF NOT EXISTS comments_user_id_index ON public.comments(user_id);

-- Index on notifications for user
CREATE INDEX IF NOT EXISTS notifications_user_id_index ON public.notifications(user_id); 