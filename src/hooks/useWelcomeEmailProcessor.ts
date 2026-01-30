/**
 * Hook pour traiter les tâches d'envoi d'email de bienvenue via Realtime
 * Surveille la table user_welcome_tasks et déclenche l'envoi via l'Edge Function
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WelcomeTask {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  status: string;
  created_at: string;
}

export const useWelcomeEmailProcessor = (enabled: boolean = false) => {
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    console.log('[WelcomeEmailProcessor] Démarrage de la surveillance Realtime...');

    // S'abonner aux nouvelles tâches en temps réel
    const channel = supabase
      .channel('welcome-tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_welcome_tasks',
          filter: 'status=eq.pending',
        },
        async (payload) => {
          const task = payload.new as WelcomeTask;
          console.log('[WelcomeEmailProcessor] Nouvelle tâche détectée:', task.id);
          await processTask(task);
        }
      )
      .subscribe((status) => {
        console.log('[WelcomeEmailProcessor] Status Realtime:', status);
      });

    // Traiter les tâches en attente existantes au démarrage
    processPendingTasks();

    return () => {
      console.log('[WelcomeEmailProcessor] Arrêt de la surveillance');
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  const processPendingTasks = async () => {
    try {
      // Utiliser une requête RPC ou directe selon les permissions
      const { data: tasks, error } = await supabase
        .from('user_welcome_tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        console.log('[WelcomeEmailProcessor] Pas de tâches en attente ou accès restreint');
        return;
      }

      if (tasks && tasks.length > 0) {
        console.log(`[WelcomeEmailProcessor] ${tasks.length} tâche(s) en attente trouvée(s)`);
        for (const task of tasks) {
          await processTask(task as unknown as WelcomeTask);
        }
      }
    } catch (err) {
      console.error('[WelcomeEmailProcessor] Erreur récupération tâches:', err);
    }
  };

  const processTask = async (task: WelcomeTask) => {
    // Éviter le traitement en double
    if (processingRef.current.has(task.id)) {
      console.log('[WelcomeEmailProcessor] Tâche déjà en cours de traitement:', task.id);
      return;
    }

    processingRef.current.add(task.id);

    try {
      console.log('[WelcomeEmailProcessor] Envoi email pour:', task.user_email);

      // Appeler l'Edge Function pour envoyer l'email
      const { data, error } = await supabase.functions.invoke('send-automated-email', {
        body: {
          template: 'welcome',
          to: task.user_email,
          data: {
            fullName: task.user_full_name || task.user_email,
            email: task.user_email,
          },
          trigger_source: 'realtime_processor',
          user_id: task.user_id,
        },
      });

      if (error) {
        console.error('[WelcomeEmailProcessor] Erreur envoi email:', error);
        // Marquer comme échoué
        await updateTaskStatus(task.id, 'failed', error.message);
      } else {
        console.log('[WelcomeEmailProcessor] Email envoyé avec succès:', data);
        // Marquer comme traité
        await updateTaskStatus(task.id, 'sent');
      }
    } catch (err) {
      console.error('[WelcomeEmailProcessor] Erreur traitement:', err);
      await updateTaskStatus(task.id, 'failed', String(err));
    } finally {
      processingRef.current.delete(task.id);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string, errorMessage?: string) => {
    try {
      await supabase
        .from('user_welcome_tasks')
        .update({
          status,
          error_message: errorMessage || null,
          processed_at: new Date().toISOString(),
        })
        .eq('id', taskId);
    } catch (err) {
      console.error('[WelcomeEmailProcessor] Erreur mise à jour statut:', err);
    }
  };
};

/**
 * Fonction utilitaire pour déclencher manuellement l'envoi d'un email de bienvenue
 * Peut être appelée directement après l'inscription si le Realtime n'est pas actif
 */
export const sendWelcomeEmailDirect = async (
  email: string,
  fullName: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[sendWelcomeEmailDirect] Envoi email pour:', email);

    const { data, error } = await supabase.functions.invoke('send-automated-email', {
      body: {
        template: 'welcome',
        to: email,
        data: {
          fullName: fullName || email,
          email: email,
        },
        trigger_source: 'direct_call',
        user_id: userId,
      },
    });

    if (error) {
      console.error('[sendWelcomeEmailDirect] Erreur:', error);
      return { success: false, error: error.message };
    }

    console.log('[sendWelcomeEmailDirect] Succès:', data);
    return { success: true };
  } catch (err) {
    console.error('[sendWelcomeEmailDirect] Exception:', err);
    return { success: false, error: String(err) };
  }
};
