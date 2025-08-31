export interface ChatNotificationPayload {
  type: 'direct' | 'group';
  senderName?: string;
  groupName?: string;
  avatarUrl?: string | null;
  messagePreview?: string;
}

export interface ChatNotificationDetail {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: Date;
  payload?: ChatNotificationPayload;
}

export const CHAT_NOTIFICATION_EVENT = 'chat:notification';

export const dispatchChatNotificationEvent = (
  detail: Omit<ChatNotificationDetail, 'timestamp'>
) => {
  const event = new CustomEvent(CHAT_NOTIFICATION_EVENT, {
    detail: {
      ...detail,
      timestamp: new Date(),
    } as ChatNotificationDetail,
  });
  window.dispatchEvent(event);
};

export const listenForChatNotificationEvents = (
  callback: (detail: ChatNotificationDetail) => void
) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ChatNotificationDetail>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };
  window.addEventListener(CHAT_NOTIFICATION_EVENT, handler as EventListener);
  return () => window.removeEventListener(CHAT_NOTIFICATION_EVENT, handler as EventListener);
};


