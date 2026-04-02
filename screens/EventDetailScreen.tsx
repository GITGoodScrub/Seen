import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    EventOccurrenceDetail,
    EventSeriesDetail,
    getErrorMessageFromUnknown,
    loadEventSeriesDetail,
} from "../Services";

type EventDetailScreenProps = {
    eventSeriesId: number;
};

const formatDateTime = (isoString: string): string =>
{
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const renderOccurrenceTitle = (occurrence: EventOccurrenceDetail, fallback: string): string =>
{
    if (occurrence.title && occurrence.title.trim().length > 0)
    {
        return occurrence.title;
    }

    return fallback;
};

export const EventDetailScreen = ({ eventSeriesId }: EventDetailScreenProps) =>
{
    const [eventDetail, setEventDetail] = useState<EventSeriesDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadDetail = useCallback(
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
                const detail = await loadEventSeriesDetail(eventSeriesId);
                setEventDetail(detail);
            }
            catch (caughtError)
            {
                setEventDetail(null);
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
        [eventSeriesId],
    );

    useEffect(
        () =>
        {
            void loadDetail();
        },
        [loadDetail],
    );

    const artistSummary = useMemo(
        () =>
        {
            if (!eventDetail)
            {
                return "";
            }

            const artistNames = Array.from(
                new Set(
                    eventDetail.occurrences.flatMap((occurrence) =>
                        occurrence.artists.map((artist) => artist.name),
                    ),
                ),
            );

            if (artistNames.length === 0)
            {
                return "No artists attached yet";
            }

            return artistNames.join(", ");
        },
        [eventDetail],
    );

    if (isLoading)
    {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    if (errorMessage !== null)
    {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
        );
    }

    if (!eventDetail)
    {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Event details unavailable.</Text>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => { void loadDetail(true); }}
                />
            }
        >
            <View style={styles.card}>
                <Text style={styles.title}>{eventDetail.title}</Text>
                <Text style={styles.metaText}>{eventDetail.venueName}</Text>
                <Text style={styles.metaText}>Status: {eventDetail.status}</Text>
                {eventDetail.ageLimit !== null ? (
                    <Text style={styles.metaText}>Age limit: {eventDetail.ageLimit}+</Text>
                ) : null}
                <Text style={styles.description}>{eventDetail.description}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Artists</Text>
                <Text style={styles.bodyText}>{artistSummary}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Occurrences</Text>
                {eventDetail.occurrences.length === 0 ? (
                    <Text style={styles.bodyText}>No occurrences yet.</Text>
                ) : (
                    eventDetail.occurrences.map((occurrence) => (
                        <View key={occurrence.id} style={styles.occurrenceRow}>
                            <Text style={styles.occurrenceTitle}>
                                {renderOccurrenceTitle(occurrence, eventDetail.title)}
                            </Text>
                            <Text style={styles.metaText}>{formatDateTime(occurrence.startTime)}</Text>
                            {occurrence.durationMinutes !== null ? (
                                <Text style={styles.metaText}>Duration: {occurrence.durationMinutes} min</Text>
                            ) : null}
                            <Text style={styles.metaText}>Status: {occurrence.status}</Text>
                            {occurrence.artists.length > 0 ? (
                                <Text style={styles.metaText}>
                                    Lineup: {occurrence.artists.map((artist) => artist.name).join(", ")}
                                </Text>
                            ) : null}
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 24,
        gap: 12,
        backgroundColor: "#f8fafc",
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        backgroundColor: "#f8fafc",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        padding: 14,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        color: "#334155",
        marginTop: 8,
    },
    bodyText: {
        fontSize: 14,
        color: "#475569",
    },
    metaText: {
        fontSize: 13,
        color: "#64748b",
        marginBottom: 2,
    },
    occurrenceRow: {
        borderTopWidth: 1,
        borderTopColor: "#eef2f7",
        paddingTop: 10,
        marginTop: 10,
    },
    occurrenceTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
    },
    errorText: {
        fontSize: 14,
        color: "#ef4444",
        textAlign: "center",
    },
});
