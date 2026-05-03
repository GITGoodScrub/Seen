import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FeedSearchBar } from "../components";
import { ToastBanner } from "../components/Feedback";
import {
    EventSeriesItem,
    getErrorMessageFromUnknown,
    loadInterestSetup,
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

type DiscoverSection = {
    tagId: number;
    name: string;
    tagType: string | null;
    isInterest: boolean;
    events: EventSeriesItem[];
};

const formatDate = (isoString: string | null): string =>
{
    if (!isoString)
    {
        return "No upcoming dates";
    }

    return new Date(isoString).toLocaleDateString(
        "en-GB",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
        },
    );
};

const buildSections = (events: EventSeriesItem[], interestedTagIds: Set<number>): DiscoverSection[] =>
{
    const sectionsMap = new Map<number, DiscoverSection>();

    events.forEach(
        (event) =>
        {
            event.tags.forEach(
                (tag) =>
                {
                    const existing = sectionsMap.get(tag.tagId);
                    const section = existing
                        ?? {
                            tagId: tag.tagId,
                            name: tag.name,
                            tagType: tag.tagType,
                            isInterest: interestedTagIds.has(tag.tagId),
                            events: [],
                        };

                    if (!section.events.some((sectionEvent) => sectionEvent.id === event.id))
                    {
                        section.events.push(event);
                    }

                    sectionsMap.set(tag.tagId, section);
                },
            );
        },
    );

    return Array.from(sectionsMap.values())
        .filter((section) => section.events.length > 0)
        .sort(
            (first, second) =>
            {
                if (first.isInterest !== second.isInterest)
                {
                    return first.isInterest ? -1 : 1;
                }

                if (first.events.length !== second.events.length)
                {
                    return second.events.length - first.events.length;
                }

                return first.name.localeCompare(second.name);
            },
        );
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
    const [sections, setSections] = useState<DiscoverSection[]>([]);
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
                const [series, savedEvents, interests] = await Promise.all([
                    loadEventSeries(),
                    loadSavedEvents(),
                    loadInterestSetup(),
                ]);

                setEvents(series);
                setSavedEventIds(savedEvents.map((savedEvent) => savedEvent.eventId));
                setSections(buildSections(series, new Set(interests.selectedTagIds)));
            }
            catch (caughtError)
            {
                setEvents([]);
                setSections([]);
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

    const interestSections = sections.filter((section) => section.isInterest);
    const otherSections = sections.filter((section) => !section.isInterest);

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
            ) : events.length === 0 || sections.length === 0 ? (
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
                            tintColor="#f8fafc"
                            colors={["#e50914"]}
                            progressBackgroundColor="#0f0f12"
                        />
                    }
                >
                    {interestSections.length > 0 ? (
                        <View style={styles.sectionGroup}>
                            <Text style={styles.groupTitle}>Your Genres & Event Types</Text>
                            {interestSections.map((section) => (
                                <View key={`interest-${section.tagId}`} style={styles.sectionWrap}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>{section.name}</Text>
                                    </View>

                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
                                        {section.events.map((event) =>
                                        {
                                            const saveTargetId = event.nextOccurrenceId;
                                            const isSaved = saveTargetId !== null && savedEventIds.includes(saveTargetId);
                                            const isSaveDisabled = saveTargetId === null || busyEventIds.includes(saveTargetId);

                                            return (
                                                <Pressable
                                                    key={`${section.tagId}-${event.id}`}
                                                    style={styles.railCard}
                                                    onPress={() => onEventPress?.(event.id)}
                                                >
                                                    {event.posterURL ? (
                                                        <Image source={{ uri: event.posterURL }} style={styles.railImage} />
                                                    ) : (
                                                        <View style={[styles.railImage, styles.railImagePlaceholder]}>
                                                            <Ionicons name="musical-notes" size={28} color="#9ca3af" />
                                                        </View>
                                                    )}

                                                    <View style={styles.railBody}>
                                                        <Text style={styles.railTitle} numberOfLines={2}>{event.title}</Text>
                                                        <Text style={styles.railMeta} numberOfLines={1}>{event.venueName}</Text>
                                                        <View style={styles.railFooter}>
                                                            <Text style={styles.railDate}>{formatDate(event.nextOccurrenceAt)}</Text>
                                                            <Pressable
                                                                style={[styles.railSaveButton, isSaved ? styles.railSaveButtonSaved : null]}
                                                                disabled={isSaveDisabled}
                                                                onPress={() =>
                                                                {
                                                                    if (saveTargetId !== null)
                                                                    {
                                                                        void handleToggleSave(saveTargetId);
                                                                    }
                                                                }}
                                                            >
                                                                <Ionicons
                                                                    name={isSaved ? "bookmark" : "bookmark-outline"}
                                                                    size={16}
                                                                    color={isSaved ? "#ffffff" : "#64748b"}
                                                                />
                                                                {isSaved ? <Text style={styles.railSaveButtonSavedLabel}>Saved</Text> : null}
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {otherSections.length > 0 ? (
                        <View style={styles.sectionGroup}>
                            <Text style={styles.groupTitle}>More to Discover</Text>
                            {otherSections.map((section) => (
                                <View key={`other-${section.tagId}`} style={styles.sectionWrap}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>{section.name}</Text>
                                    </View>

                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
                                        {section.events.map((event) =>
                                        {
                                            const saveTargetId = event.nextOccurrenceId;
                                            const isSaved = saveTargetId !== null && savedEventIds.includes(saveTargetId);
                                            const isSaveDisabled = saveTargetId === null || busyEventIds.includes(saveTargetId);

                                            return (
                                                <Pressable
                                                    key={`${section.tagId}-${event.id}`}
                                                    style={styles.railCard}
                                                    onPress={() => onEventPress?.(event.id)}
                                                >
                                                    {event.posterURL ? (
                                                        <Image source={{ uri: event.posterURL }} style={styles.railImage} />
                                                    ) : (
                                                        <View style={[styles.railImage, styles.railImagePlaceholder]}>
                                                            <Ionicons name="musical-notes" size={28} color="#9ca3af" />
                                                        </View>
                                                    )}

                                                    <View style={styles.railBody}>
                                                        <Text style={styles.railTitle} numberOfLines={2}>{event.title}</Text>
                                                        <Text style={styles.railMeta} numberOfLines={1}>{event.venueName}</Text>
                                                        <View style={styles.railFooter}>
                                                            <Text style={styles.railDate}>{formatDate(event.nextOccurrenceAt)}</Text>
                                                            <Pressable
                                                                style={[styles.railSaveButton, isSaved ? styles.railSaveButtonSaved : null]}
                                                                disabled={isSaveDisabled}
                                                                onPress={() =>
                                                                {
                                                                    if (saveTargetId !== null)
                                                                    {
                                                                        void handleToggleSave(saveTargetId);
                                                                    }
                                                                }}
                                                            >
                                                                <Ionicons
                                                                    name={isSaved ? "bookmark" : "bookmark-outline"}
                                                                    size={16}
                                                                    color={isSaved ? "#ffffff" : "#64748b"}
                                                                />
                                                                {isSaved ? <Text style={styles.railSaveButtonSavedLabel}>Saved</Text> : null}
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            ))}
                        </View>
                    ) : null}
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
        paddingTop: 14,
        paddingBottom: 28,
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
    sectionGroup:
    {
        marginBottom: 10,
    },
    groupTitle:
    {
        color: "#0f172a",
        fontSize: 20,
        fontWeight: "800",
        paddingHorizontal: 16,
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    sectionWrap:
    {
        marginBottom: 12,
    },
    sectionHeader:
    {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sectionTitle:
    {
        fontSize: 17,
        fontWeight: "700",
        color: "#1e293b",
        textTransform: "capitalize",
        maxWidth: "80%",
    },
    railContent:
    {
        paddingHorizontal: 16,
        gap: 10,
    },
    railCard:
    {
        width: 220,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#d9dee5",
        backgroundColor: "#ffffff",
    },
    railImage:
    {
        width: "100%",
        height: 132,
        backgroundColor: "#e2e8f0",
    },
    railImagePlaceholder:
    {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f1f5f9",
    },
    railBody:
    {
        paddingHorizontal: 10,
        paddingVertical: 9,
        gap: 4,
    },
    railTitle:
    {
        color: "#0f172a",
        fontSize: 14,
        fontWeight: "700",
        minHeight: 34,
    },
    railMeta:
    {
        color: "#64748b",
        fontSize: 12,
    },
    railFooter:
    {
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    railDate:
    {
        color: "#475569",
        fontSize: 12,
        fontWeight: "600",
    },
    railSaveButton:
    {
        minWidth: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#d1d5db",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 4,
        paddingHorizontal: 8,
    },
    railSaveButtonSaved:
    {
        backgroundColor: "#1d4ed8",
        borderColor: "#1d4ed8",
    },
    railSaveButtonSavedLabel:
    {
        color: "#ffffff",
        fontSize: 11,
        fontWeight: "700",
    },
});