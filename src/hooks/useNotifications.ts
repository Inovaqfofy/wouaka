import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationStore, type Notification } from '@/stores/useNotificationStore';
import { useAuth } from '@/hooks/useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    setLoading,
  } = useNotificationStore();

  // Fetch notifications on mount
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setNotifications((data as unknown as Notification[]) || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, setNotifications, setLoading]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          addNotification(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);

  // Mark single notification as read
  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      markAsRead(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [markAsRead]);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      markAllAsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user, markAllAsRead]);

  // Delete notification
  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      removeNotification(id);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [removeNotification]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
  };
}
