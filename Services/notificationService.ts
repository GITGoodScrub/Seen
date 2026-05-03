import { requestJsonWithFailover } from "./apiClientService";
import {
    MarkNotificationReadResponse,
    NotificationItem,
    NotificationsResponse,
} from "./notificationTypes";

const notificationsRoute = "/api/notifications";

const isNotificationItem = (value: unknown): value is NotificationItem =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.notificationId === "number"
        && typeof candidate.type === "string"
        && typeof candidate.entityType === "string"
        && typeof candidate.entityId === "number"
        && typeof candidate.isRead === "boolean"
        && typeof candidate.createdAt === "string"
        && (candidate.actorUserId === null || typeof candidate.actorUserId === "number")
        && (candidate.actorUsername === null || typeof candidate.actorUsername === "string")
        && (candidate.actorProfilePhoto === null || typeof candidate.actorProfilePhoto === "string")
        && typeof candidate.title === "string"
        && typeof candidate.body === "string"
    );
};

export const loadNotifications = async (): Promise<NotificationItem[]> =>
{
    const response = await requestJsonWithFailover<NotificationsResponse>(notificationsRoute);

    if (!Array.isArray(response.notifications))
    {
        return [];
    }

    return response.notifications.filter((entry) => isNotificationItem(entry));
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> =>
{
    const response = await requestJsonWithFailover<MarkNotificationReadResponse>(
        notificationsRoute,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    notificationId,
                },
            ),
        },
    );

    if (response.notificationId !== notificationId)
    {
        throw new Error("Failed to mark notification as read.");
    }
};
