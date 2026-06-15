<template>
  <section v-if="currentUser" class="page profile-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">个人中心</p>
        <h1>资料越完整，交换越容易达成</h1>
      </div>
    </div>

    <div class="profile-layout">
      <form class="profile-form" @submit.prevent="save">
        <label>
          本地模拟登录
          <select v-model="selectedUserId" @change="switchUser">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.nickname }} · {{ user.location }}
            </option>
          </select>
        </label>
        <AvatarUploader v-model="form.avatar" />
        <label>
          昵称
          <input v-model="form.nickname" />
        </label>
        <label>
          电话
          <input v-model="form.phone" />
        </label>
        <label>
          常用地点
          <input v-model="form.location" />
        </label>
        <button class="primary-button" type="submit">保存资料</button>
      </form>

      <div class="profile-side">
        <UserBrief :user="{ ...currentUser, ...form }" />
        <div class="stats-row">
          <span>发布 {{ myItems.length }}</span>
          <span>可交换 {{ availableCount }}</span>
          <span>信用 {{ currentUser.credit_score }}</span>
        </div>
      </div>
    </div>

    <section class="my-items">
      <h2>我发布的物品</h2>
      <div v-if="myItems.length" class="waterfall waterfall--compact">
        <ItemCard
          v-for="item in myItems"
          :key="item.id"
          :item="item"
          :owner="currentUser"
        />
      </div>
      <EmptyState v-else title="还没有发布物品" description="发布一件闲置后会出现在这里" mark="物" />
    </section>

    <section class="notif-section">
      <div class="notif-header">
        <h2>站内消息</h2>
        <button v-if="unreadNotifs.length" class="secondary-button" type="button" @click="markAllRead">
          全部已读
        </button>
      </div>

      <div v-if="unreadNotifs.length" class="notif-group">
        <p class="notif-group-label">未读</p>
        <div
          v-for="notif in unreadNotifs"
          :key="notif.id"
          class="notif-item notif-item--unread"
          @click="handleNotifClick(notif)"
        >
          <span class="notif-dot" />
          <div class="notif-content">
            <strong>{{ notif.title }}</strong>
            <p>{{ notif.body }}</p>
            <small>{{ formatDate(notif.created_at) }}</small>
          </div>
        </div>
      </div>

      <div v-if="readNotifs.length" class="notif-group">
        <p class="notif-group-label">已读</p>
        <div
          v-for="notif in readNotifs"
          :key="notif.id"
          class="notif-item"
          @click="handleNotifClick(notif)"
        >
          <div class="notif-content">
            <strong>{{ notif.title }}</strong>
            <p>{{ notif.body }}</p>
            <small>{{ formatDate(notif.created_at) }}</small>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="!unreadNotifs.length && !readNotifs.length"
        title="暂无消息"
        description="交换状态变化时会在这里收到通知"
        mark="信"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

import AvatarUploader from '@/components/common/AvatarUploader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ItemCard from '@/components/common/ItemCard.vue';
import UserBrief from '@/components/common/UserBrief.vue';
import { ItemStatus } from '@/constants/item';
import { useAuth } from '@/hooks/useAuth';
import { NotificationType } from '@/models/notification';
import type { Notification } from '@/models/notification';
import { useItemStore } from '@/stores/itemStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDate } from '@/utils/formatters';

const router = useRouter();
const { currentUser, users, login, updateProfile } = useAuth();
const itemStore = useItemStore();
const notificationStore = useNotificationStore();
const selectedUserId = ref('');

const form = reactive({
  nickname: '',
  avatar: '',
  phone: '',
  location: '',
});

watchEffect(() => {
  if (currentUser.value) {
    selectedUserId.value = currentUser.value.id;
    form.nickname = currentUser.value.nickname;
    form.avatar = currentUser.value.avatar;
    form.phone = currentUser.value.phone;
    form.location = currentUser.value.location;
  }
});

watch(
  () => users.value.length,
  () => {
    if (!selectedUserId.value && currentUser.value) {
      selectedUserId.value = currentUser.value.id;
    }
  },
);

const myItems = computed(() => (currentUser.value ? itemStore.myItems(currentUser.value.id) : []));
const availableCount = computed(() => myItems.value.filter((item) => item.status === ItemStatus.AVAILABLE).length);

const unreadNotifs = computed(() =>
  currentUser.value ? notificationStore.unread(currentUser.value.id) : [],
);
const readNotifs = computed(() =>
  currentUser.value ? notificationStore.read(currentUser.value.id) : [],
);

const markAllRead = async () => {
  if (currentUser.value) {
    await notificationStore.markAllRead(currentUser.value.id);
  }
};

const handleNotifClick = async (notif: Notification) => {
  if (!notif.read) {
    await notificationStore.markRead(notif.id);
  }
  const tab = notif.type === NotificationType.REQUEST_RECEIVED ? 'received' : 'sent';
  router.push({ name: 'exchanges', query: { tab, highlight: notif.exchange_id } });
};

const save = async () => {
  await updateProfile({ ...form });
};

const switchUser = async () => {
  if (selectedUserId.value) {
    await login(selectedUserId.value);
  }
};
</script>
