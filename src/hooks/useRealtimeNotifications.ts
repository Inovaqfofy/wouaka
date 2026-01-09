import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore, type Notification } from '@/stores/useNotificationStore';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const { addNotification } = useNotificationStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Subscribe to new notifications
    const notificationsChannel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          addNotification(notification);
          
          // Show toast for new notification
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default',
          });
        }
      )
      .subscribe();

    // Subscribe to scoring request status changes
    const scoringChannel = supabase
      .channel('scoring-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scoring_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldRecord = payload.old as { status?: string };
          const newRecord = payload.new as { status?: string; score?: number; full_name?: string };
          
          // Only notify on status changes
          if (oldRecord.status !== newRecord.status) {
            if (newRecord.status === 'completed') {
              toast({
                title: 'Score calculé',
                description: `Le score pour ${newRecord.full_name || 'votre demande'} est prêt: ${newRecord.score || 'N/A'}`,
              });
            } else if (newRecord.status === 'failed') {
              toast({
                title: 'Échec du calcul',
                description: `Le calcul du score pour ${newRecord.full_name || 'votre demande'} a échoué.`,
                variant: 'destructive',
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to KYC validation status changes
    const kycChannel = supabase
      .channel('kyc-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kyc_validations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldRecord = payload.old as { status?: string };
          const newRecord = payload.new as { status?: string };
          
          // Only notify on status changes
          if (oldRecord.status !== newRecord.status) {
            let title = '';
            let description = '';
            let variant: 'default' | 'destructive' = 'default';
            
            switch (newRecord.status) {
              case 'approved':
                title = 'KYC Approuvé';
                description = 'Votre vérification KYC a été approuvée avec succès.';
                break;
              case 'rejected':
                title = 'KYC Rejeté';
                description = 'Votre vérification KYC a été rejetée. Veuillez vérifier vos documents.';
                variant = 'destructive';
                break;
              case 'pending_review':
                title = 'KYC en révision';
                description = 'Votre dossier KYC est en cours de révision par un analyste.';
                break;
              default:
                return;
            }
            
            toast({ title, description, variant });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(scoringChannel);
      supabase.removeChannel(kycChannel);
    };
  }, [user, addNotification, toast]);
}
