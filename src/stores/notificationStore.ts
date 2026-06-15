import { defineStore } from 'pinia';

import { notificationApi } from '@/api/notificationApi';
import type { Notification, NotificationType } from '@/models/notification';
import { storage, STORAGE_KEYS } from '@/utils/storage';

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    loading: false,
  }),
  getters: {
    unread: (state) => (userId: string) =>
      state.notifications.filter((n) => n.user_id === userId && !n.read),
    read: (state) => (userId: string) =>
      state.notifications.filter((n) => n.user_id === userId && n.read),
    unreadCount: (state) => (userId: string) =>
      state.notifications.filter((n) => n.user_id === userId && !n.read).length,
  },
  actions: {
    async hydrate() {
      this.loading = true;
      try {
        this.notifications = await notificationApi.list();
      } finally {
        this.loading = false;
      }
    },
    async push(userId: string, type: NotificationType, exchangeId: string, title: string, body: string) {
      const notification: Notification = {
        id: storage.createId('notif'),
        type,
        exchange_id: exchangeId,
        user_id: userId,
        title,
        body,
        read: false,
        created_at: new Date().toISOString(),
      };
      await notificationApi.create(notification);
      this.notifications = await notificationApi.list();
    },
    async markRead(id: string) {
      await notificationApi.markRead(id);
      this.notifications = this.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
    },
    async markAllRead(userId: string) {
      await notificationApi.markAllRead(userId);
      this.notifications = this.notifications.map((n) =>
        n.user_id === userId ? { ...n, read: true } : n,
      );
    },
  },
});
