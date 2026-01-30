-- Table audit_logs pour tracer toutes les actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Analysts can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'ANALYSTE'));

CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Table notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Table KYC documents
CREATE TABLE public.kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  ocr_data JSONB,
  ocr_confidence NUMERIC,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_documents_user ON public.kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_status ON public.kyc_documents(status);

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own KYC documents"
  ON public.kyc_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own KYC documents"
  ON public.kyc_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Analysts can view all KYC documents"
  ON public.kyc_documents FOR SELECT
  USING (has_role(auth.uid(), 'ANALYSTE'));

CREATE POLICY "Super admins can manage all KYC documents"
  ON public.kyc_documents FOR ALL
  USING (has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Analysts can update KYC documents"
  ON public.kyc_documents FOR UPDATE
  USING (has_role(auth.uid(), 'ANALYSTE'));

-- Table KYC validations (workflow)
CREATE TABLE public.kyc_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  overall_score NUMERIC,
  identity_verified BOOLEAN DEFAULT false,
  address_verified BOOLEAN DEFAULT false,
  income_verified BOOLEAN DEFAULT false,
  documents_complete BOOLEAN DEFAULT false,
  risk_flags TEXT[],
  notes TEXT,
  assigned_analyst UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_validations_user ON public.kyc_validations(user_id);
CREATE INDEX idx_kyc_validations_status ON public.kyc_validations(status);
CREATE INDEX idx_kyc_validations_analyst ON public.kyc_validations(assigned_analyst);

ALTER TABLE public.kyc_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own KYC validation"
  ON public.kyc_validations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Analysts can view all KYC validations"
  ON public.kyc_validations FOR SELECT
  USING (has_role(auth.uid(), 'ANALYSTE'));

CREATE POLICY "Analysts can update KYC validations"
  ON public.kyc_validations FOR UPDATE
  USING (has_role(auth.uid(), 'ANALYSTE'));

CREATE POLICY "Super admins can manage all KYC validations"
  ON public.kyc_validations FOR ALL
  USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Table datasets pour import CSV
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  row_count INTEGER DEFAULT 0,
  column_count INTEGER DEFAULT 0,
  columns JSONB,
  status TEXT DEFAULT 'pending',
  processing_progress INTEGER DEFAULT 0,
  error_message TEXT,
  scores_calculated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_datasets_user ON public.datasets(user_id);
CREATE INDEX idx_datasets_status ON public.datasets(status);

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own datasets"
  ON public.datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own datasets"
  ON public.datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON public.datasets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON public.datasets FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Analysts can view all datasets"
  ON public.datasets FOR SELECT
  USING (has_role(auth.uid(), 'ANALYSTE'));

CREATE POLICY "Super admins can manage all datasets"
  ON public.datasets FOR ALL
  USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Table dataset_rows pour stocker les données importées
CREATE TABLE public.dataset_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  score INTEGER,
  risk_category TEXT,
  confidence NUMERIC,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_dataset_rows_dataset ON public.dataset_rows(dataset_id);
CREATE INDEX idx_dataset_rows_processed ON public.dataset_rows(dataset_id, processed_at);

ALTER TABLE public.dataset_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rows of their datasets"
  ON public.dataset_rows FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.datasets d
    WHERE d.id = dataset_rows.dataset_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Users can create rows in their datasets"
  ON public.dataset_rows FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.datasets d
    WHERE d.id = dataset_rows.dataset_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Users can update rows in their datasets"
  ON public.dataset_rows FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.datasets d
    WHERE d.id = dataset_rows.dataset_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Analysts can view all dataset rows"
  ON public.dataset_rows FOR SELECT
  USING (has_role(auth.uid(), 'ANALYSTE'));

CREATE POLICY "Super admins can manage all dataset rows"
  ON public.dataset_rows FOR ALL
  USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Triggers pour updated_at
CREATE TRIGGER update_kyc_documents_updated_at
  BEFORE UPDATE ON public.kyc_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kyc_validations_updated_at
  BEFORE UPDATE ON public.kyc_validations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON public.datasets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket pour KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Storage policies pour KYC documents
CREATE POLICY "Users can upload their own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own KYC documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Analysts can view all KYC documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND has_role(auth.uid(), 'ANALYSTE'));

CREATE POLICY "Super admins can manage all KYC documents"
  ON storage.objects FOR ALL
  USING (bucket_id = 'kyc-documents' AND has_role(auth.uid(), 'SUPER_ADMIN'));

-- Storage bucket pour datasets CSV
INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false);

CREATE POLICY "Users can upload their own datasets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own datasets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own datasets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);