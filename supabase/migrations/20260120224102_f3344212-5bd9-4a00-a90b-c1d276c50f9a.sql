-- Créer la table logs
CREATE TABLE public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  level TEXT NOT NULL DEFAULT 'info',
  source TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  ip_address TEXT,
  duration_ms INTEGER
);

CREATE INDEX idx_logs_created_at ON public.logs(created_at DESC);
CREATE INDEX idx_logs_source ON public.logs(source);

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert" ON public.logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select" ON public.logs FOR SELECT USING (auth.uid() IS NOT NULL);