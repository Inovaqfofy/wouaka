-- Ajouter les colonnes de gestion aux produits marketplace
ALTER TABLE marketplace_products 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;

-- Mettre à jour les produits existants comme publiés
UPDATE marketplace_products SET status = 'published', published_at = NOW() WHERE status IS NULL;

-- Créer la table des candidatures de prêt
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  national_id TEXT,
  identity_document_url TEXT,
  additional_documents JSONB DEFAULT '[]',
  score INTEGER,
  score_grade TEXT,
  score_details JSONB,
  risk_level TEXT,
  kyc_status TEXT DEFAULT 'pending',
  kyc_identity_score INTEGER,
  kyc_fraud_score INTEGER,
  kyc_request_id UUID REFERENCES kyc_requests(id),
  is_eligible BOOLEAN,
  eligibility_reason TEXT,
  status TEXT DEFAULT 'pending',
  partner_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_loan_applications_product_id ON loan_applications(product_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_created_at ON loan_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_provider_id ON marketplace_products(provider_id);

-- Activer RLS sur loan_applications
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

-- Politique: Les partenaires peuvent voir les candidatures pour leurs offres
CREATE POLICY "Partners can view applications for their products"
ON loan_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM marketplace_products mp
    WHERE mp.id = loan_applications.product_id
    AND mp.provider_id = auth.uid()
  )
);

-- Politique: Les partenaires peuvent mettre à jour les candidatures pour leurs offres
CREATE POLICY "Partners can update applications for their products"
ON loan_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM marketplace_products mp
    WHERE mp.id = loan_applications.product_id
    AND mp.provider_id = auth.uid()
  )
);

-- Politique: Tout le monde peut créer une candidature (emprunteurs publics)
CREATE POLICY "Anyone can create loan applications"
ON loan_applications
FOR INSERT
WITH CHECK (true);

-- Trigger pour updated_at sur loan_applications
CREATE OR REPLACE FUNCTION update_loan_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_loan_applications_updated_at ON loan_applications;
CREATE TRIGGER trigger_loan_applications_updated_at
  BEFORE UPDATE ON loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_applications_updated_at();

-- Activer realtime pour les candidatures
ALTER PUBLICATION supabase_realtime ADD TABLE loan_applications;