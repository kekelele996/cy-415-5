export enum NotificationType {
  REQUEST_RECEIVED = 'request_received',
  REQUEST_ACCEPTED = 'request_accepted',
  REQUEST_REJECTED = 'request_rejected',
  EXCHANGE_COMPLETED = 'exchange_completed',
}

export interface Notification {
  id: string;
  type: NotificationType;
  exchange_id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}
