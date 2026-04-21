export type NotificationItem = {
    notificationId: number;
    type: string;
    entityType: string;
    entityId: number;
    isRead: boolean;
    createdAt: string;
    actorUserId: number | null;
    actorUsername: string | null;
    actorProfilePhoto: string | null;
    title: string;
    body: string;
};

export type NotificationsResponse = {
    notifications?: NotificationItem[];
    error?: string;
};

export type MarkNotificationReadResponse = {
    notificationId?: number;
    error?: string;
};
