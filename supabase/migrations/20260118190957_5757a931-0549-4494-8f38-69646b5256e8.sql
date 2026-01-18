-- ============================================
-- HELPDESK MODULE - Support Tickets System
-- ============================================

-- Enum for ticket status
CREATE TYPE public.ticket_status AS ENUM (
  'new',
  'in_progress', 
  'waiting_user',
  'resolved',
  'closed'
);

-- Enum for ticket priority
CREATE TYPE public.ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Enum for ticket category
CREATE TYPE public.ticket_category AS ENUM (
  'technical',
  'billing',
  'score_dispute',
  'identity',
  'general'
);

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Content
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.ticket_category NOT NULL DEFAULT 'general',
  
  -- Status & Priority
  status public.ticket_status NOT NULL DEFAULT 'new',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  ai_priority_reason TEXT,
  ai_sentiment_score DECIMAL(3,2),
  
  -- Related entities (optional links)
  related_certificate_id UUID REFERENCES public.certificates(id) ON DELETE SET NULL,
  related_kyc_id UUID REFERENCES public.kyc_requests(id) ON DELETE SET NULL,
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Index for performance
CREATE INDEX idx_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_tickets_partner_id ON public.support_tickets(partner_id);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_tickets_created_at ON public.support_tickets(created_at DESC);

-- ============================================
-- TICKET MESSAGES TABLE
-- ============================================
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  
  -- Author
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL, -- 'user', 'agent', 'system'
  
  -- Content
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  is_internal BOOLEAN DEFAULT false, -- Internal notes not visible to user
  is_automated BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX idx_messages_author_id ON public.ticket_messages(author_id);
CREATE INDEX idx_messages_created_at ON public.ticket_messages(created_at);

-- ============================================
-- TICKET NUMBER GENERATOR
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_prefix TEXT;
  seq_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 6) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.support_tickets
  WHERE ticket_number LIKE 'WK' || year_prefix || '%';
  
  NEW.ticket_number := 'WK' || year_prefix || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_generate_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_number();

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_ticket_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- ============================================
-- SUPPORT_TICKETS POLICIES
-- ============================================

-- Emprunteurs: See only their own tickets
CREATE POLICY "Emprunteurs can view own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR public.get_user_ticket_role(auth.uid()) IN ('SUPER_ADMIN', 'PARTENAIRE')
  );

-- Emprunteurs can create tickets
CREATE POLICY "Users can create tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.get_user_ticket_role(auth.uid()) = 'SUPER_ADMIN'
  );

-- Only admins can delete tickets
CREATE POLICY "Admins can delete tickets"
  ON public.support_tickets
  FOR DELETE
  USING (public.get_user_ticket_role(auth.uid()) = 'SUPER_ADMIN');

-- ============================================
-- TICKET_MESSAGES POLICIES
-- ============================================

-- View messages: ticket owner, assigned agent, admin
CREATE POLICY "Users can view ticket messages"
  ON public.ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
      AND (
        t.user_id = auth.uid()
        OR t.assigned_to = auth.uid()
        OR t.partner_id = auth.uid()
        OR public.get_user_ticket_role(auth.uid()) = 'SUPER_ADMIN'
      )
    )
    AND (
      is_internal = false 
      OR public.get_user_ticket_role(auth.uid()) IN ('SUPER_ADMIN', 'PARTENAIRE')
    )
  );

-- Users can add messages to their tickets
CREATE POLICY "Users can add messages"
  ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
      AND (
        t.user_id = auth.uid()
        OR t.assigned_to = auth.uid()
        OR t.partner_id = auth.uid()
        OR public.get_user_ticket_role(auth.uid()) = 'SUPER_ADMIN'
      )
    )
  );

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;