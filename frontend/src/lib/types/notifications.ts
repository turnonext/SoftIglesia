export type NotificationCategory = "church" | "formation" | "finance";

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  type: string;
  title: string;
  message: string;
  href: string;
  occurred_at: string;
  read: boolean;
};

export type NotificationsFeedResponse = {
  data: NotificationItem[];
  meta: {
    unread: number;
    total: number;
  };
};
