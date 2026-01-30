-- =============================================
-- ENTERPRISE HELPDESK - DATABASE SCHEMA
-- =============================================

-- 1. Table ticket_logs pour l'audit trail complet
CREATE TABLE IF NOT EXISTS public.ticket_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'created', 'status_changed', 'priority_changed', 'assigned', 'message_added', 'escalated', 'resolved', 'reopened'
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET DEFAULT '0.0.0.0'::inet,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_ticket_logs_ticket_id ON public.ticket_logs(ticket_id);
CREATE INDEX idx_ticket_logs_created_at ON public.ticket_logs(created_at DESC);

-- 2. Table SLA configurations
CREATE TABLE IF NOT EXISTS public.sla_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL, -- 'low', 'medium', 'high', 'urgent'
  user_type TEXT NOT NULL, -- 'EMPRUNTEUR', 'PARTENAIRE', 'VIP'
  first_response_minutes INTEGER NOT NULL DEFAULT 240, -- 4h par défaut
  resolution_minutes INTEGER NOT NULL DEFAULT 1440, -- 24h par défaut
  escalation_minutes INTEGER NOT NULL DEFAULT 120, -- 2h pour escalade
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les SLA par défaut
INSERT INTO public.sla_configs (name, priority, user_type, first_response_minutes, resolution_minutes, escalation_minutes) VALUES
  ('Urgent VIP', 'urgent', 'VIP', 30, 120, 30),
  ('Urgent Partenaire', 'urgent', 'PARTENAIRE', 60, 240, 60),
  ('Urgent Emprunteur', 'urgent', 'EMPRUNTEUR', 120, 480, 120),
  ('Haute Partenaire', 'high', 'PARTENAIRE', 120, 480, 120),
  ('Haute Emprunteur', 'high', 'EMPRUNTEUR', 240, 1440, 240),
  ('Moyenne', 'medium', 'EMPRUNTEUR', 480, 2880, 480),
  ('Basse', 'low', 'EMPRUNTEUR', 1440, 4320, 1440)
ON CONFLICT DO NOTHING;

-- 3. Table pour les tags AI
CREATE TABLE IF NOT EXISTS public.ticket_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0, -- Confiance du tag AI (0-1)
  source TEXT DEFAULT 'manual', -- 'manual', 'ai', 'system'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ticket_id, tag)
);

CREATE INDEX idx_ticket_tags_ticket_id ON public.ticket_tags(ticket_id);
CREATE INDEX idx_ticket_tags_tag ON public.ticket_tags(tag);

-- 4. Table CSAT (Customer Satisfaction)
CREATE TABLE IF NOT EXISTS public.ticket_csat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  agent_id UUID REFERENCES auth.users(id),
  resolution_quality INTEGER CHECK (resolution_quality >= 1 AND resolution_quality <= 5),
  response_speed INTEGER CHECK (response_speed >= 1 AND response_speed <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ticket_csat_ticket_id ON public.ticket_csat(ticket_id);
CREATE INDEX idx_ticket_csat_agent_id ON public.ticket_csat(agent_id);

-- 5. Base de connaissances pour suggestions IA
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- 'technical', 'billing', 'score_dispute', 'identity', 'general'
  keywords TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX idx_knowledge_base_keywords ON public.knowledge_base USING GIN(keywords);

-- 6. Réponses suggérées utilisées
CREATE TABLE IF NOT EXISTS public.suggested_response_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID REFERENCES public.knowledge_base(id),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id),
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Ajouter des colonnes au support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS frustration_score DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sla_first_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_resolution_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalated_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_suggested_category TEXT,
ADD COLUMN IF NOT EXISTS csat_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

-- 8. Storage bucket pour pièces jointes sécurisées
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments', 
  'ticket-attachments', 
  false, -- Privé!
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Policies pour le bucket
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'PARTENAIRE')
    )
  )
);

-- 9. RLS Policies pour les nouvelles tables
ALTER TABLE public.ticket_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_csat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_response_usage ENABLE ROW LEVEL SECURITY;

-- ticket_logs: visible par les admins et propriétaires du ticket
CREATE POLICY "Ticket logs visible by ticket owner and admins"
ON public.ticket_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id
    AND (
      st.user_id = auth.uid()
      OR st.assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'SUPER_ADMIN'
      )
    )
  )
);

-- sla_configs: lecture pour tous, écriture pour admins
CREATE POLICY "SLA configs readable by all authenticated"
ON public.sla_configs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "SLA configs editable by admins"
ON public.sla_configs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
  )
);

-- ticket_tags: visible par ceux qui peuvent voir le ticket
CREATE POLICY "Ticket tags visible by ticket viewers"
ON public.ticket_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id
    AND (
      st.user_id = auth.uid()
      OR st.assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'PARTENAIRE')
      )
    )
  )
);

CREATE POLICY "Ticket tags manageable by agents"
ON public.ticket_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'PARTENAIRE')
  )
);

-- ticket_csat: utilisateur peut créer/voir son propre CSAT
CREATE POLICY "CSAT by ticket owner"
ON public.ticket_csat FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "CSAT visible by admins"
ON public.ticket_csat FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
  )
);

-- knowledge_base: lecture pour agents, écriture pour admins
CREATE POLICY "Knowledge base readable by agents"
ON public.knowledge_base FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Knowledge base editable by admins"
ON public.knowledge_base FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
  )
);

-- suggested_response_usage: visible par agents
CREATE POLICY "Suggested response usage by agents"
ON public.suggested_response_usage FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'PARTENAIRE')
  )
);

-- 10. Fonction pour calculer le SLA deadline
CREATE OR REPLACE FUNCTION public.calculate_sla_deadline(
  p_ticket_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
  v_user_role TEXT;
  v_sla RECORD;
  v_first_response_deadline TIMESTAMPTZ;
  v_resolution_deadline TIMESTAMPTZ;
  v_escalation_deadline TIMESTAMPTZ;
BEGIN
  -- Get ticket info
  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Ticket not found');
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role FROM public.user_roles WHERE user_id = v_ticket.user_id;
  v_user_role := COALESCE(v_user_role, 'EMPRUNTEUR');
  
  -- Find matching SLA config
  SELECT * INTO v_sla 
  FROM public.sla_configs 
  WHERE priority = v_ticket.priority::text
    AND user_type = v_user_role
    AND is_active = true
  ORDER BY first_response_minutes ASC
  LIMIT 1;
  
  -- Fallback to default if no match
  IF NOT FOUND THEN
    SELECT * INTO v_sla 
    FROM public.sla_configs 
    WHERE priority = 'medium' AND user_type = 'EMPRUNTEUR' AND is_active = true
    LIMIT 1;
  END IF;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'first_response_deadline', v_ticket.created_at + interval '4 hours',
      'resolution_deadline', v_ticket.created_at + interval '24 hours',
      'escalation_deadline', v_ticket.created_at + interval '2 hours'
    );
  END IF;
  
  v_first_response_deadline := v_ticket.created_at + (v_sla.first_response_minutes || ' minutes')::interval;
  v_resolution_deadline := v_ticket.created_at + (v_sla.resolution_minutes || ' minutes')::interval;
  v_escalation_deadline := v_ticket.created_at + (v_sla.escalation_minutes || ' minutes')::interval;
  
  RETURN jsonb_build_object(
    'first_response_deadline', v_first_response_deadline,
    'resolution_deadline', v_resolution_deadline,
    'escalation_deadline', v_escalation_deadline,
    'sla_name', v_sla.name,
    'first_response_minutes', v_sla.first_response_minutes,
    'resolution_minutes', v_sla.resolution_minutes
  );
END;
$$;

-- 11. Trigger pour logger les changements automatiquement
CREATE OR REPLACE FUNCTION public.log_ticket_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ticket_logs (ticket_id, actor_id, action, new_value)
    VALUES (NEW.id, NEW.user_id, 'created', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.ticket_logs (ticket_id, actor_id, action, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'status_changed', 
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status));
    END IF;
    
    -- Log priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO public.ticket_logs (ticket_id, actor_id, action, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'priority_changed',
        jsonb_build_object('priority', OLD.priority),
        jsonb_build_object('priority', NEW.priority));
    END IF;
    
    -- Log assignment changes
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO public.ticket_logs (ticket_id, actor_id, action, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'assigned',
        jsonb_build_object('assigned_to', OLD.assigned_to),
        jsonb_build_object('assigned_to', NEW.assigned_to));
    END IF;
    
    -- Log escalation
    IF OLD.escalated_at IS NULL AND NEW.escalated_at IS NOT NULL THEN
      INSERT INTO public.ticket_logs (ticket_id, actor_id, action, new_value)
      VALUES (NEW.id, auth.uid(), 'escalated',
        jsonb_build_object('escalated_to', NEW.escalated_to, 'reason', NEW.escalation_reason));
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_log_ticket_changes
  AFTER INSERT OR UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_changes();

-- 12. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_csat;

-- 13. Articles de base de connaissances par défaut
INSERT INTO public.knowledge_base (title, content, category, keywords) VALUES
  ('Délai de mise à jour du score', 
   'Votre score de crédit est recalculé à chaque nouvelle preuve ajoutée. Les mises à jour peuvent prendre jusqu''à 24h pour être reflétées. Assurez-vous que tous vos documents sont validés.',
   'score_dispute',
   ARRAY['score', 'délai', 'mise à jour', 'attente', 'calcul']),
  ('Documents requis pour le KYC',
   'Pour valider votre identité, vous devez fournir : 1) Une pièce d''identité valide (CNI ou Passeport), 2) Un selfie clair, 3) Optionnellement un justificatif de domicile. Les documents doivent être lisibles et non expirés.',
   'identity',
   ARRAY['kyc', 'identité', 'document', 'cni', 'passeport', 'selfie']),
  ('Problèmes de paiement',
   'Si votre paiement a échoué : 1) Vérifiez votre solde Mobile Money, 2) Réessayez après 5 minutes, 3) Contactez votre opérateur si le problème persiste. Les paiements sont traités par CinetPay.',
   'billing',
   ARRAY['paiement', 'échec', 'mobile money', 'erreur', 'cinetpay']),
  ('Score faible malgré des preuves',
   'Un score faible peut être dû à : 1) Preuves insuffisantes ou non vérifiées, 2) Historique de transactions limité, 3) Incohérences dans les données. Ajoutez plus de preuves variées pour améliorer votre score.',
   'score_dispute',
   ARRAY['score', 'faible', 'améliorer', 'preuves', 'bas'])
ON CONFLICT DO NOTHING;