import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ToastBanner } from "../components/Feedback";
import {
    SavedEventItem,
    getErrorMessageFromUnknown,
    loadSavedEvents,
    unsaveEvent,
} from "../Services";

type SavedEventsScreenProps = {
    onSavedEventsChanged?: () => void;
    onEventPress?: (eventSeriesId: number) => void;
};

export const SavedEventsScreen = (
    {
        onSavedEventsChanged,
        onEventPress,
    }: SavedEventsScreenProps,
) =>
{
    const [savedEvents, setSavedEvents] = useState<SavedEventItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const loadItems = useCallback(
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
                const items = await loadSavedEvents();
                setSavedEvents(items);
            }
            catch (caughtError)
            {
                setSavedEvents([]);
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
            void loadItems();
        },
        [loadItems],
    );

    const handleUnsave = async (eventId: number): Promise<void> =>
    {
        try
        {
            await unsaveEvent(eventId);
            setSavedEvents((current) => current.filter((item) => item.eventId !== eventId));
            setToastMessage("Removed from saved");
            onSavedEventsChanged?.();
        }
        catch (caughtError)
        {
            Alert.alert("Unsave failed", getErrorMessageFromUnknown(caughtError));
        }
    };

    useEffect(
        () =>
        {
            if (!toastMessage)
            {
                return;
            }

            const timeoutId = setTimeout(
                () =>
                {
                    setToastMessage(null);
                },
                1600,
            );

            return () => clearTimeout(timeoutId);
        },
        [toastMessage],
    );

    if (isLoading)
    {
        return (
            <View style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {errorMessage !== null ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            ) : savedEvents.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.bodyText}>You have no saved events yet.</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => { void loadItems(true); }}
                        />
                    }
                >
                    {savedEvents.map((item) => (
                        <View key={`${item.userId}-${item.eventId}`} style={styles.card}>
                            <Pressable
                                style={styles.cardPressArea}
                                onPress={() => onEventPress?.(item.seriesId)}
                            >
                                <Text style={styles.title}>{item.seriesTitle}</Text>
                                <Text style={styles.meta}>{item.venueName}</Text>
                                <Text style={styles.meta}>
                                    {new Date(item.eventStartTime).toLocaleString()}
                                </Text>
                            </Pressable>

                            <Pressable
                                style={styles.unsaveButton}
                                onPress={() =>
                                {
                                    void handleUnsave(item.eventId);
                                }}
                            >
                                <Text style={styles.unsaveLabel}>Remove</Text>
                            </Pressable>
                        </View>
                    ))}
                </ScrollView>
            )}

            {toastMessage ? <ToastBanner message={toastMessage} /> : null}
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 14,
        backgroundColor: "#f8fafc",
    },
    centered:
    {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 60,
    },
    list:
    {
        paddingBottom: 24,
        gap: 10,
    },
    card:
    {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        padding: 14,
        marginBottom: 10,
    },
    cardPressArea:
    {
        paddingBottom: 4,
    },
    title:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 6,
    },
    bodyText:
    {
        fontSize: 14,
        color: "#475569",
    },
    meta:
    {
        fontSize: 13,
        color: "#64748b",
        marginBottom: 2,
    },
    errorText:
    {
        fontSize: 14,
        color: "#ef4444",
        textAlign: "center",
    },
    unsaveButton:
    {
        marginTop: 10,
        alignSelf: "flex-start",
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    unsaveLabel:
    {
        fontSize: 13,
        fontWeight: "600",
        color: "#334155",
    },
});