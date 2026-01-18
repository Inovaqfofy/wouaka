-- Fix foreign keys: change from auth.users to public.profiles
-- This is required for PostgREST joins to work from client

-- Drop old FKs pointing to auth.users
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_assigned_to_fkey;
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_partner_id_fkey;
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_escalated_to_fkey;
ALTER TABLE public.ticket_messages DROP CONSTRAINT IF EXISTS ticket_messages_author_id_fkey;

-- Re-create FKs pointing to public.profiles
ALTER TABLE public.support_tickets
ADD CONSTRAINT support_tickets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.support_tickets
ADD CONSTRAINT support_tickets_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.support_tickets
ADD CONSTRAINT support_tickets_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.support_tickets
ADD CONSTRAINT support_tickets_escalated_to_fkey 
FOREIGN KEY (escalated_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.ticket_messages
ADD CONSTRAINT ticket_messages_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;