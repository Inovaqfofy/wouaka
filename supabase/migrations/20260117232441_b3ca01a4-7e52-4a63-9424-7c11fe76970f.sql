-- Table pour enregistrer les tentatives bloquées par le Kill Switch
CREATE TABLE IF NOT EXISTS public.blocked_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  endpoint TEXT,
  method TEXT,
  ip_address TEXT,
  user_agent TEXT,
  api_key_prefix TEXT,
  user_id UUID,
  block_reason TEXT NOT NULL, -- 'full_lockdown', 'read_only_mode', 'feature_disabled'
  error_message TEXT,
  request_metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_requests ENABLE ROW LEVEL SECURITY;

-- Policy for SUPER_ADMIN only
CREATE POLICY "super_admin_view_blocked_requests" ON public.blocked_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_blocked_requests_created ON public.blocked_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_requests_feature ON public.blocked_requests(feature_name, created_at DESC);

-- Enable realtime for blocked_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_requests;