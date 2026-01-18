import { create } from 'zustand';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  action_url?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  
  setNotifications: (notifications) => set({ 
    notifications,
    unreadCount: notifications.filter(n => !n.is_read).length
  }),
  
  addNotification: (notification) => {
    const { notifications } = get();
    set({
      notifications: [notification, ...notifications],
      unreadCount: get().unreadCount + (notification.is_read ? 0 : 1)
    });
  },
  
  markAsRead: (id) => {
    const { notifications } = get();
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.is_read) {
      set({
        notifications: notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, get().unreadCount - 1)
      });
    }
  },
  
  markAllAsRead: () => {
    const { notifications } = get();
    set({
      notifications: notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0
    });
  },
  
  removeNotification: (id) => {
    const { notifications } = get();
    const notification = notifications.find(n => n.id === id);
    set({
      notifications: notifications.filter(n => n.id !== id),
      unreadCount: notification && !notification.is_read 
        ? Math.max(0, get().unreadCount - 1) 
        : get().unreadCount
    });
  },
  
  setLoading: (isLoading) => set({ isLoading }),
}));
