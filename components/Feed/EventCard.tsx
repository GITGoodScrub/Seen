import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EventSeriesItem } from "../../Services/eventTypes";

type EventCardProps = {
    event: EventSeriesItem;
    onPress?: () => void;
    isSaved?: boolean;
    isSaveDisabled?: boolean;
    onSavePress?: () => void;
};

const formatDate = (isoString: string | null): string =>
{
    if (!isoString)
    {
        return "No upcoming dates";
    }

    const date = new Date(isoString);
    return date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const getStars = (rating: number): string =>
{
    const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
    return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
};

export const EventCard = (
    {
        event,
        onPress,
        isSaved = false,
        isSaveDisabled = false,
        onSavePress,
    }: EventCardProps,
) =>
{
    const isActive = event.status === "active";

    return (
        <Pressable style={styles.card} onPress={onPress}>
            {event.posterURL ? (
                <Image
                    source={{ uri: event.posterURL }}
                    style={styles.poster}
                />
            ) : (
                <View style={styles.posterPlaceholder}>
                    <Ionicons name="musical-notes" size={36} color="#94a3b8" />
                </View>
            )}

            <View style={styles.body}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={2}>
                        {event.title}
                    </Text>
                    <View style={styles.titleActions}>
                        {!isActive && (
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{event.status}</Text>
                            </View>
                        )}

                        <Pressable
                            style={styles.saveButton}
                            disabled={isSaveDisabled}
                            onPress={onSavePress}
                        >
                            <Ionicons
                                name={isSaved ? "bookmark" : "bookmark-outline"}
                                size={18}
                                color={isSaved ? "#0ea5e9" : "#64748b"}
                            />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color="#64748b" />
                    <Text style={styles.metaText} numberOfLines={1}>
                        {event.venueName}
                    </Text>
                </View>

                <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <Text style={styles.metaText}>
                        {formatDate(event.nextOccurrenceAt)}
                    </Text>
                </View>

                <View style={styles.metaRow}>
                    <Ionicons name="star-outline" size={14} color="#64748b" />
                    <Text style={styles.metaText}>
                        {event.averageRating === null
                            ? "No ratings yet"
                            : `${event.averageRating.toFixed(2)} / 5 (${event.reviewCount}) ${getStars(event.averageRating)}`}
                    </Text>
                </View>

                {event.ageLimit !== null && (
                    <View style={styles.ageBadge}>
                        <Text style={styles.ageText}>{event.ageLimit}+</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        overflow: "hidden",
        marginBottom: 12,
    },
    poster: {
        width: "100%",
        height: 160,
        backgroundColor: "#e2e8f0",
    },
    posterPlaceholder: {
        width: "100%",
        height: 160,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    body: {
        padding: 12,
        gap: 6,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
    },
    titleActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
    },
    statusBadge: {
        backgroundColor: "#f1f5f9",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#64748b",
        textTransform: "capitalize",
    },
    saveButton: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: "#f8fafc",
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        color: "#64748b",
    },
    ageBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#fee2e2",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 2,
    },
    ageText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#ef4444",
    },
});
