-- scripts/soft_delete_and_optimization.sql

-- Function to automatically update the 'updated_at' timestamp
-- This can be used as a trigger on any table with an 'updated_at' column.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Apply the 'updated_at' trigger to all tables that have the column
-- This ensures the timestamp is current whenever a record is updated.

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_polls_updated_at
BEFORE UPDATE ON public.polls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Note: We do not add this trigger to 'votes', as votes are generally immutable.


-- For soft deletes on comments, we will adjust the RLS policy.
-- Instead of deleting the row, an application should set 'deleted_at' to NOW().
-- We can update the SELECT policy to hide "deleted" comments from view.

-- First, remove the old read policy for comments
DROP POLICY IF EXISTS "Allow public read access to comments" ON public.comments;

-- Create a new read policy that filters out soft-deleted comments
CREATE POLICY "Allow public read access to non-deleted comments" ON public.comments
  FOR SELECT USING (deleted_at IS NULL);
  
-- The DELETE policy created in the previous script still allows users to delete their own comments,
-- but the application logic should be built to perform an UPDATE on 'deleted_at'
-- instead of a true DELETE. 