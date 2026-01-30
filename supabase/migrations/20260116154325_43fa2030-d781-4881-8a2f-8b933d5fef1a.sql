-- =====================================================
-- Module LBC/FT (Anti-Blanchiment / Counter Financing of Terrorism)
-- Tables pour le screening sanctions, PEP et investigations
-- =====================================================

-- Extension pour fuzzy matching (doit être créée en premier)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Table des résultats de screening sanctions
CREATE TABLE public.aml_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_request_id UUID REFERENCES public.kyc_requests(id),
  user_id UUID,
  partner_id UUID REFERENCES public.profiles(id),
  
  -- Données screenées (hashées pour confidentialité)
  full_name_hash TEXT NOT NULL,
  dob_hash TEXT,
  national_id_hash TEXT,
  
  -- Résultats du screening
  screening_status TEXT NOT NULL DEFAULT 'pending' CHECK (screening_status IN ('pending', 'clear', 'potential_match', 'confirmed_match', 'false_positive')),
  match_score NUMERIC,
  match_type TEXT[],
  
  -- Détails des correspondances
  matches JSONB DEFAULT '[]',
  pep_detected BOOLEAN DEFAULT false,
  pep_category TEXT,
  pep_risk_increase NUMERIC DEFAULT 0,
  
  -- Métadonnées
  screening_provider TEXT DEFAULT 'wouaka_internal',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des investigations manuelles
CREATE TABLE public.aml_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES public.aml_screenings(id),
  kyc_request_id UUID REFERENCES public.kyc_requests(id),
  
  -- Statut investigation
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'cleared', 'confirmed_match', 'escalated')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Assignation
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ,
  
  -- Décision
  decision TEXT,
  decision_reason TEXT,
  decided_by UUID REFERENCES public.profiles(id),
  decided_at TIMESTAMPTZ,
  
  -- Pièces jointes pour comparaison
  document_image_url TEXT,
  sanction_reference_url TEXT,
  comparison_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des listes de sanctions (cache local)
CREATE TABLE public.sanctions_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_source TEXT NOT NULL,
  list_version TEXT,
  
  -- Données de la personne/entité
  entry_type TEXT NOT NULL CHECK (entry_type IN ('individual', 'entity')),
  full_name TEXT NOT NULL,
  full_name_normalized TEXT NOT NULL,
  aliases TEXT[],
  date_of_birth DATE,
  nationality TEXT[],
  national_id TEXT,
  
  -- Détails sanction
  sanction_type TEXT[],
  reason TEXT,
  listed_on DATE,
  delisted_on DATE,
  reference_url TEXT,
  
  -- Métadonnées
  raw_data JSONB,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des catégories PEP
CREATE TABLE public.pep_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code TEXT UNIQUE NOT NULL,
  category_name TEXT NOT NULL,
  risk_weight NUMERIC NOT NULL DEFAULT 40,
  description TEXT,
  keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insérer les catégories PEP UEMOA
INSERT INTO public.pep_categories (category_code, category_name, risk_weight, keywords) VALUES
('HEAD_STATE', 'Chef d''État / Président', 50, ARRAY['president', 'chef etat', 'chef de l''etat', 'premier ministre']),
('MINISTER', 'Ministre / Secrétaire d''État', 40, ARRAY['ministre', 'secretaire etat', 'secretaire d''etat']),
('PARLIAMENT', 'Député / Sénateur', 35, ARRAY['depute', 'senateur', 'assemblee nationale', 'parlement']),
('JUDICIARY', 'Magistrat / Juge', 35, ARRAY['magistrat', 'juge', 'procureur', 'cour supreme', 'cour constitutionnelle']),
('CENTRAL_BANK', 'Dirigeant Banque Centrale', 45, ARRAY['bceao', 'banque centrale', 'gouverneur bceao']),
('MILITARY', 'Haut Gradé Militaire', 40, ARRAY['general', 'colonel', 'chef etat major', 'armee']),
('DIPLOMAT', 'Ambassadeur / Diplomate', 30, ARRAY['ambassadeur', 'consul', 'diplomate']),
('SOE_DIRECTOR', 'Dirigeant Entreprise Publique', 35, ARRAY['directeur general', 'dg', 'pca', 'regie financiere', 'societe d''etat']),
('PARTY_LEADER', 'Dirigeant Parti Politique', 30, ARRAY['president parti', 'secretaire general parti', 'chef parti']),
('INTL_ORG', 'Fonctionnaire Organisation Internationale', 25, ARRAY['onu', 'ua', 'cedeao', 'uemoa', 'bad']);

-- Logs de conformité anonymisés
CREATE TABLE public.compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL CHECK (log_type IN ('screening', 'pep_check', 'investigation', 'decision')),
  
  -- Hash anonymisé (SHA-256)
  subject_hash TEXT NOT NULL,
  
  -- Résultat sans données personnelles
  result_code TEXT NOT NULL,
  risk_level TEXT,
  match_count INTEGER DEFAULT 0,
  
  -- Contexte
  partner_id UUID,
  performed_by UUID,
  ip_address INET,
  
  -- Référence au traitement (sans lien direct aux données)
  processing_reference TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aml_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aml_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions_list_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pep_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view their own screenings" ON public.aml_screenings 
  FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can create screenings" ON public.aml_screenings 
  FOR INSERT WITH CHECK (auth.uid() = partner_id);
CREATE POLICY "Admins can manage all screenings" ON public.aml_screenings 
  FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Admins can manage investigations" ON public.aml_investigations 
  FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "Assigned users can view their investigations" ON public.aml_investigations 
  FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Assigned users can update their investigations" ON public.aml_investigations 
  FOR UPDATE USING (auth.uid() = assigned_to);

CREATE POLICY "Anyone can read active sanctions" ON public.sanctions_list_entries 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage sanctions list" ON public.sanctions_list_entries 
  FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Anyone can read PEP categories" ON public.pep_categories 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage PEP categories" ON public.pep_categories 
  FOR ALL USING (has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Admins can view all compliance logs" ON public.compliance_logs 
  FOR SELECT USING (has_role(auth.uid(), 'SUPER_ADMIN'));
CREATE POLICY "System can create compliance logs" ON public.compliance_logs 
  FOR INSERT WITH CHECK (true);

-- Index pour performance recherche fuzzy
CREATE INDEX idx_sanctions_name_normalized ON public.sanctions_list_entries USING gin (full_name_normalized gin_trgm_ops);
CREATE INDEX idx_sanctions_source ON public.sanctions_list_entries (list_source) WHERE is_active = true;
CREATE INDEX idx_screenings_status ON public.aml_screenings (screening_status) WHERE screening_status != 'clear';
CREATE INDEX idx_investigations_status ON public.aml_investigations (status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_compliance_logs_date ON public.compliance_logs (created_at DESC);

-- Fonction de calcul de similarité Jaro-Winkler (approximation via pg_trgm)
CREATE OR REPLACE FUNCTION public.fuzzy_name_match(name1 TEXT, name2 TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  similarity_score NUMERIC;
  n1 TEXT;
  n2 TEXT;
BEGIN
  -- Normalize names
  n1 := LOWER(TRIM(REGEXP_REPLACE(name1, '[^a-zA-Z\s]', '', 'g')));
  n2 := LOWER(TRIM(REGEXP_REPLACE(name2, '[^a-zA-Z\s]', '', 'g')));
  
  -- Use trigram similarity (approximates Jaro-Winkler behavior)
  similarity_score := similarity(n1, n2);
  
  -- Boost for prefix match (Winkler modification)
  IF LEFT(n1, 4) = LEFT(n2, 4) THEN
    similarity_score := similarity_score + (1 - similarity_score) * 0.1;
  END IF;
  
  RETURN LEAST(similarity_score, 1.0);
END;
$$;

-- Trigger pour updated_at
CREATE TRIGGER update_aml_screenings_updated_at
  BEFORE UPDATE ON public.aml_screenings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aml_investigations_updated_at
  BEFORE UPDATE ON public.aml_investigations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();