import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    NotificationItem,
    getErrorMessageFromUnknown,
    loadNotifications,
    markNotificationAsRead,
} from "../Services";

type NotificationsScreenProps = {
    onUnreadCountChange?: (count: number) => void;
};

export const NotificationsScreen = (
    {
        onUnreadCountChange,
    }: NotificationsScreenProps,
) =>
{
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadData = useCallback(
        async (isRefresh = false): Promise<void> =>
        {
            if (isRefresh)
            {
                setIsRefreshing(true);
            }
            else
            {
                setIsLoading(true);
            }

            setErrorMessage(null);

            try
            {
                const loadedNotifications = await loadNotifications();
                setNotifications(loadedNotifications);
                onUnreadCountChange?.(loadedNotifications.filter((entry) => !entry.isRead).length);
            }
            catch (caughtError)
            {
                setErrorMessage(getErrorMessageFromUnknown(caughtError));
            }
            finally
            {
                if (isRefresh)
                {
                    setIsRefreshing(false);
                }
                else
                {
                    setIsLoading(false);
                }
            }
        },
        [],
    );

    useEffect(
        () =>
        {
            void loadData();
        },
        [loadData],
    );

    const handlePressNotification = (item: NotificationItem): void =>
    {
        if (item.isRead)
        {
            return;
        }

        setNotifications(
            (currentNotifications) =>
            {
                const nextNotifications = currentNotifications.map(
                    (entry) => entry.notificationId === item.notificationId
                        ? { ...entry, isRead: true }
                        : entry,
                );

                onUnreadCountChange?.(nextNotifications.filter((entry) => !entry.isRead).length);
                return nextNotifications;
            },
        );

        markNotificationAsRead(item.notificationId).catch(
            () =>
            {
                setNotifications(
                    (currentNotifications) =>
                    {
                        const nextNotifications = currentNotifications.map(
                            (entry) => entry.notificationId === item.notificationId
                                ? { ...entry, isRead: false }
                                : entry,
                        );

                        onUnreadCountChange?.(nextNotifications.filter((entry) => !entry.isRead).length);
                        return nextNotifications;
                    },
                );
            },
        );
    };

    const formatRelativeDate = (isoDate: string): string =>
    {
        const date = new Date(isoDate);
        const msDiff = Date.now() - date.getTime();
        const minutes = Math.floor(msDiff / 60000);

        if (minutes < 1)
        {
            return "just now";
        }

        if (minutes < 60)
        {
            return `${minutes}m ago`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24)
        {
            return `${hours}h ago`;
        }

        const days = Math.floor(hours / 24);
        if (days < 7)
        {
            return `${days}d ago`;
        }

        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notifications</Text>

            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() =>
                        {
                            void loadData(true);
                        }}
                        tintColor="#1d4ed8"
                    />
                }
            >
                {isLoading ? (
                    <View style={styles.stateCard}>
                        <ActivityIndicator color="#1d4ed8" />
                        <Text style={styles.stateText}>Loading notifications...</Text>
                    </View>
                ) : errorMessage ? (
                    <View style={styles.stateCard}>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                        <Pressable
                            style={styles.retryButton}
                            onPress={() =>
                            {
                                void loadData();
                            }}
                        >
                            <Text style={styles.retryButtonText}>Try again</Text>
                        </Pressable>
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={styles.stateCard}>
                        <Text style={styles.stateTitle}>No notifications yet</Text>
                        <Text style={styles.stateText}>New follows, interactions, mentions, and event reminders will show up here.</Text>
                    </View>
                ) : (
                    notifications.map(
                        (notification) =>
                        {
                            return (
                                <Pressable
                                    key={notification.notificationId}
                                    style={[
                                        styles.notificationCard,
                                        !notification.isRead ? styles.unreadCard : null,
                                    ]}
                                    onPress={() =>
                                    {
                                        handlePressNotification(notification);
                                    }}
                                >
                                    <View style={styles.notificationHeader}>
                                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                                        <Text style={styles.notificationDate}>{formatRelativeDate(notification.createdAt)}</Text>
                                    </View>
                                    <Text style={styles.notificationBody}>{notification.body}</Text>

                                    {!notification.isRead ? (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadBadgeText}>New</Text>
                                        </View>
                                    ) : null}
                                </Pressable>
                            );
                        },
                    )
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 14,
        backgroundColor: "#f8fafc",
    },
    title:
    {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 10,
    },
    listContent:
    {
        paddingBottom: 18,
        gap: 10,
    },
    stateCard:
    {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        backgroundColor: "#ffffff",
        padding: 14,
        alignItems: "center",
    },
    stateTitle:
    {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4,
        textAlign: "center",
    },
    stateText:
    {
        marginTop: 8,
        fontSize: 14,
        color: "#475569",
        textAlign: "center",
        lineHeight: 20,
    },
    errorText:
    {
        fontSize: 13,
        color: "#b91c1c",
        textAlign: "center",
    },
    retryButton:
    {
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#dbeafe",
    },
    retryButtonText:
    {
        fontSize: 13,
        color: "#1d4ed8",
        fontWeight: "700",
    },
    notificationCard:
    {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        backgroundColor: "#ffffff",
        padding: 12,
    },
    unreadCard:
    {
        borderColor: "#93c5fd",
        backgroundColor: "#f8fbff",
    },
    notificationHeader:
    {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 6,
    },
    notificationTitle:
    {
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
    },
    notificationDate:
    {
        fontSize: 12,
        color: "#64748b",
    },
    notificationBody:
    {
        fontSize: 13,
        color: "#334155",
        lineHeight: 19,
    },
    unreadBadge:
    {
        marginTop: 8,
        alignSelf: "flex-start",
        backgroundColor: "#dbeafe",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    unreadBadgeText:
    {
        fontSize: 11,
        fontWeight: "700",
        color: "#1d4ed8",
    },
});