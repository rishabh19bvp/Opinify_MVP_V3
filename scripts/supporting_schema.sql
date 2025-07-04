-- scripts/supporting_schema.sql

-- Comments Table: For threaded discussions on polls.
CREATE TABLE public.comments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  poll_id BIGINT REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE, -- For threading
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- For soft deletes
);
CREATE INDEX comments_poll_id_index ON public.comments(poll_id);
CREATE INDEX comments_parent_id_index ON public.comments(parent_id);


-- NGOs Table: Stores information about Non-Governmental Organizations.
CREATE TABLE public.ngos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT,
  verification_status TEXT DEFAULT 'pending', -- e.g., 'pending', 'verified', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Achievements Table: Defines the available gamification achievements.
CREATE TABLE public.achievements (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements Table: Tracks which users have earned which achievements.
CREATE TABLE public.user_achievements (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id BIGINT REFERENCES public.achievements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);


-- Notifications Table: Stores notifications for users.
CREATE TABLE public.notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT, -- e.g., 'poll_update', 'new_comment', 'achievement_unlocked'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX notifications_user_id_index ON public.notifications(user_id); 