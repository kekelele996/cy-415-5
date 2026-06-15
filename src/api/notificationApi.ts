import type { Notification } from '@/models/notification';
import { storage, STORAGE_KEYS } from '@/utils/storage';

export const notificationApi = {
  async list(): Promise<Notification[]> {
    return storage.get<Notification[]>(STORAGE_KEYS.notifications, []);
  },

  async create(notification: Notification): Promise<Notification> {
    const notifications = await this.list();
    await storage.set(STORAGE_KEYS.notifications, [notification, ...notifications]);
    return notification;
  },

  async markRead(id: string): Promise<void> {
    const notifications = await this.list();
    await storage.set(
      STORAGE_KEYS.notifications,
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  },

  async markAllRead(userId: string): Promise<void> {
    const notifications = await this.list();
    await storage.set(
      STORAGE_KEYS.notifications,
      notifications.map((n) => (n.user_id === userId ? { ...n, read: true } : n)),
    );
  },
};
