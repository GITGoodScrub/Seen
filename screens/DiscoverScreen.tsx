import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { EventCard, FeedSearchBar } from "../components";
import { ToastBanner } from "../components/Feedback";
import {
    EventSeriesItem,
    getErrorMessageFromUnknown,
    loadEventSeries,
    loadSavedEvents,
    saveEvent,
    unsaveEvent,
} from "../Services";

type DiscoverScreenProps = {
    onSearchPress?: () => void;
    onEventPress?: (eventId: number) => void;
    refreshKey?: number;
    onSavedEventsChanged?: () => void;
};

export const DiscoverScreen = (
    {
        onSearchPress,
        onEventPress,
        refreshKey = 0,
        onSavedEventsChanged,
    }: DiscoverScreenProps,
) =>
{
    const [events, setEvents] = useState<EventSeriesItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [savedEventIds, setSavedEventIds] = useState<number[]>([]);
    const [busyEventIds, setBusyEventIds] = useState<number[]>([]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const loadEvents = useCallback(
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
                const [series, savedEvents] = await Promise.all([
                    loadEventSeries(),
                    loadSavedEvents(),
                ]);

                setEvents(series);
                setSavedEventIds(savedEvents.map((savedEvent) => savedEvent.eventId));
            }
            catch (caughtError)
            {
                setEvents([]);
                setSavedEventIds([]);
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
            void loadEvents();
        },
        [loadEvents, refreshKey],
    );

    const handleToggleSave = useCallback(
        async (eventId: number) =>
        {
            const isAlreadySaved = savedEventIds.includes(eventId);
            setBusyEventIds((current) => current.includes(eventId) ? current : [...current, eventId]);

            try
            {
                if (isAlreadySaved)
                {
                    await unsaveEvent(eventId);
                    setSavedEventIds((current) => current.filter((id) => id !== eventId));
                    setToastMessage("Removed from saved");
                }
                else
                {
                    await saveEvent(eventId);
                    setSavedEventIds((current) => current.includes(eventId) ? current : [...current, eventId]);
                    setToastMessage("Saved event");
                }

                onSavedEventsChanged?.();
            }
            catch (caughtError)
            {
                Alert.alert("Save failed", getErrorMessageFromUnknown(caughtError));
            }
            finally
            {
                setBusyEventIds((current) => current.filter((id) => id !== eventId));
            }
        },
        [onSavedEventsChanged, savedEventIds],
    );

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

    return (
        <View style={styles.container}>
            <FeedSearchBar
                placeholderText="Search events, venues, and artists"
                onPress={onSearchPress}
            />

            {isLoading ? (
                <View style={styles.centred}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            ) : errorMessage !== null ? (
                <View style={styles.centred}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            ) : events.length === 0 ? (
                <View style={styles.centred}>
                    <Text style={styles.emptyText}>No events found.</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => { void loadEvents(true); }}
                        />
                    }
                >
                    {events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onPress={() => onEventPress?.(event.id)}
                            isSaved={event.nextOccurrenceId !== null && savedEventIds.includes(event.nextOccurrenceId)}
                            isSaveDisabled={event.nextOccurrenceId === null || (event.nextOccurrenceId !== null && busyEventIds.includes(event.nextOccurrenceId))}
                            onSavePress={() =>
                            {
                                if (event.nextOccurrenceId !== null)
                                {
                                    void handleToggleSave(event.nextOccurrenceId);
                                }
                            }}
                        />
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
    centred:
    {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 60,
    },
    list:
    {
        paddingTop: 12,
        paddingBottom: 24,
    },
    emptyText:
    {
        fontSize: 15,
        color: "#64748b",
    },
    errorText:
    {
        fontSize: 14,
        color: "#ef4444",
        textAlign: "center",
    },
});