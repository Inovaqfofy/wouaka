-- Créer la table pour les tâches d'envoi d'email de bienvenue
CREATE TABLE public.user_welcome_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT NOT NULL,
  user_full_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les tâches en attente
CREATE INDEX idx_user_welcome_tasks_pending ON public.user_welcome_tasks(status) WHERE status = 'pending';

-- RLS
ALTER TABLE public.user_welcome_tasks ENABLE ROW LEVEL SECURITY;

-- Politique : SUPER_ADMIN peut voir les tâches
CREATE POLICY "Admins can view welcome tasks" ON public.user_welcome_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN'::app_role)
  );

-- Politique : le système peut insérer (via trigger)
CREATE POLICY "System can insert welcome tasks" ON public.user_welcome_tasks
  FOR INSERT WITH CHECK (true);

-- Politique : le système peut mettre à jour
CREATE POLICY "System can update welcome tasks" ON public.user_welcome_tasks
  FOR UPDATE USING (true);

-- Activer Realtime pour cette table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_welcome_tasks;

-- Fonction trigger simple (sans appel HTTP)
CREATE OR REPLACE FUNCTION public.create_welcome_task()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_welcome_tasks (user_id, user_email, user_full_name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger sur la création d'utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_welcome_task();