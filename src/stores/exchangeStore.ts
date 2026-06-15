import { defineStore } from 'pinia';

import { exchangeApi } from '@/api/exchangeApi';
import { ExchangeStatus } from '@/constants/exchange';
import type { Exchange, ExchangeDraft } from '@/models/exchange';
import { NotificationType } from '@/models/notification';
import { useNotificationStore } from '@/stores/notificationStore';
import { message } from '@/utils/message';

export const useExchangeStore = defineStore('exchanges', {
  state: () => ({
    exchanges: [] as Exchange[],
    statusFilter: 'all' as ExchangeStatus | 'all',
    loading: false,
  }),
  getters: {
    sent: (state) => (userId: string) => state.exchanges.filter((item) => item.from_user_id === userId),
    received: (state) => (userId: string) => state.exchanges.filter((item) => item.to_user_id === userId),
    filtered: (state) => {
      if (state.statusFilter === 'all') return state.exchanges;
      return state.exchanges.filter((item) => item.status === state.statusFilter);
    },
  },
  actions: {
    async hydrate() {
      this.loading = true;
      try {
        this.exchanges = await exchangeApi.list();
      } finally {
        this.loading = false;
      }
    },
    async create(draft: ExchangeDraft) {
      const exchange = await exchangeApi.create({ ...draft, status: ExchangeStatus.PENDING });
      this.exchanges = await exchangeApi.list();
      const notifStore = useNotificationStore();
      await notifStore.push(
        draft.to_user_id,
        NotificationType.REQUEST_RECEIVED,
        exchange.id,
        '收到交换请求',
        '有人想和你交换物品，快去看看吧',
      );
      message('交换请求已发出', 'success');
      return exchange;
    },
    async accept(id: string) {
      const current = this.exchanges.find((e) => e.id === id);
      await exchangeApi.transition(id, ExchangeStatus.ACCEPTED);
      this.exchanges = await exchangeApi.list();
      if (current) {
        const notifStore = useNotificationStore();
        await notifStore.push(
          current.from_user_id,
          NotificationType.REQUEST_ACCEPTED,
          id,
          '交换请求已同意',
          '对方同意了你的交换请求',
        );
      }
      message('已同意交换', 'success');
    },
    async reject(id: string) {
      const current = this.exchanges.find((e) => e.id === id);
      await exchangeApi.transition(id, ExchangeStatus.REJECTED);
      this.exchanges = await exchangeApi.list();
      if (current) {
        const notifStore = useNotificationStore();
        await notifStore.push(
          current.from_user_id,
          NotificationType.REQUEST_REJECTED,
          id,
          '交换请求已拒绝',
          '对方拒绝了你的交换请求',
        );
      }
      message('已拒绝交换', 'success');
    },
    async complete(id: string) {
      const current = this.exchanges.find((e) => e.id === id);
      await exchangeApi.transition(id, ExchangeStatus.COMPLETED);
      this.exchanges = await exchangeApi.list();
      if (current) {
        const notifStore = useNotificationStore();
        await notifStore.push(
          current.from_user_id,
          NotificationType.EXCHANGE_COMPLETED,
          id,
          '交换已完成',
          '交换流程已完成，双方物品状态已更新',
        );
        await notifStore.push(
          current.to_user_id,
          NotificationType.EXCHANGE_COMPLETED,
          id,
          '交换已完成',
          '交换流程已完成，双方物品状态已更新',
        );
      }
      message('交换已完成，双方物品状态已更新', 'success');
    },
  },
});
