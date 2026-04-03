import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    AuthSession,
    createSeriesReview,
    deleteEventSeries,
    EventOccurrenceDetail,
    EventSeriesReviewItem,
    EventSeriesDetail,
    getErrorMessageFromUnknown,
    loadEventSeriesDetail,
} from "../Services";

type EventDetailScreenProps = {
    authSession: AuthSession;
    eventSeriesId: number;
    onOpenVenuePress?: (venueId: number) => void;
    onEditPress?: (eventSeriesId: number) => void;
    onEventDeleted?: () => void;
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

const formatReviewDate = (isoString: string): string =>
{
    const date = new Date(isoString);
    return date.toLocaleDateString("en-GB", {
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

export const EventDetailScreen = (
    {
        eventSeriesId,
        authSession,
        onOpenVenuePress,
        onEditPress,
        onEventDeleted,
    }: EventDetailScreenProps,
) =>
{
    const [eventDetail, setEventDetail] = useState<EventSeriesDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isDeletingEvent, setIsDeletingEvent] = useState(false);

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

    const handleSubmitReview = async (): Promise<void> =>
    {
        if (reviewRating < 1 || reviewRating > 5)
        {
            Alert.alert("Invalid rating", "Rating must be a number from 1 to 5.");
            return;
        }

        if (reviewText.trim().length === 0)
        {
            Alert.alert("Missing review", "Please write a short review before submitting.");
            return;
        }

        setIsSubmittingReview(true);

        try
        {
            await createSeriesReview(
                {
                    seriesId: eventSeriesId,
                    rating: reviewRating,
                    text: reviewText.trim(),
                    visibility: "public",
                },
            );

            setReviewText("");
            setReviewRating(5);
            await loadDetail(true);
            Alert.alert("Thanks!", "Your review was submitted.");
        }
        catch (caughtError)
        {
            Alert.alert("Review failed", getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsSubmittingReview(false);
        }
    };

    const canManageEvent = useMemo(
        () =>
        {
            if (!eventDetail)
            {
                return false;
            }

            return (
                authSession.user.type === "venueAdmin"
                && authSession.user.username !== null
                && eventDetail.createdByUsername === authSession.user.username
            );
        },
        [authSession.user.type, authSession.user.username, eventDetail],
    );

    const handleDeleteEvent = (): void =>
    {
        if (!canManageEvent || isDeletingEvent)
        {
            return;
        }

        Alert.alert(
            "Delete event",
            "Are you sure you want to delete this event? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () =>
                    {
                        void (async () =>
                        {
                            setIsDeletingEvent(true);

                            try
                            {
                                await deleteEventSeries(eventSeriesId);
                                Alert.alert("Deleted", "Event deleted successfully.");
                                onEventDeleted?.();
                            }
                            catch (caughtError)
                            {
                                Alert.alert("Delete failed", getErrorMessageFromUnknown(caughtError));
                            }
                            finally
                            {
                                setIsDeletingEvent(false);
                            }
                        })();
                    },
                },
            ],
        );
    };

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
                <Pressable
                    onPress={() => onOpenVenuePress?.(eventDetail.venueId)}
                    style={styles.venueButton}
                >
                    <Text style={styles.venueText}>{eventDetail.venueName}</Text>
                </Pressable>
                <Text style={styles.metaText}>Status: {eventDetail.status}</Text>
                {eventDetail.ageLimit !== null ? (
                    <Text style={styles.metaText}>Age limit: {eventDetail.ageLimit}+</Text>
                ) : null}
                <Text style={styles.description}>{eventDetail.description}</Text>

                {canManageEvent ? (
                    <View style={styles.manageActionsRow}>
                        <Pressable
                            style={styles.manageEditButton}
                            onPress={() => onEditPress?.(eventSeriesId)}
                        >
                            <Text style={styles.manageButtonText}>Edit Event</Text>
                        </Pressable>
                        <Pressable
                            style={styles.manageDeleteButton}
                            disabled={isDeletingEvent}
                            onPress={handleDeleteEvent}
                        >
                            <Text style={styles.manageDeleteButtonText}>
                                {isDeletingEvent ? "Deleting..." : "Delete Event"}
                            </Text>
                        </Pressable>
                    </View>
                ) : null}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Artists</Text>
                <Text style={styles.bodyText}>{artistSummary}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Series Rating</Text>
                {eventDetail.averageRating === null ? (
                    <Text style={styles.bodyText}>No ratings yet.</Text>
                ) : (
                    <>
                        <Text style={styles.ratingText}>
                            {eventDetail.averageRating.toFixed(2)} / 5 ({eventDetail.reviewCount} reviews)
                        </Text>
                        <Text style={styles.ratingStars}>{getStars(eventDetail.averageRating)}</Text>
                    </>
                )}

                <View style={styles.reviewComposer}>
                    <Text style={styles.reviewComposerTitle}>Leave a review</Text>
                    <View style={styles.starPickerRow}>
                        {[1, 2, 3, 4, 5].map((value) => (
                            <Pressable
                                key={value}
                                disabled={isSubmittingReview}
                                onPress={() => setReviewRating(value)}
                                style={styles.starPickerButton}
                            >
                                <Text
                                    style={[
                                        styles.starPickerIcon,
                                        value <= reviewRating ? styles.starPickerIconActive : null,
                                    ]}
                                >
                                    ★
                                </Text>
                            </Pressable>
                        ))}
                        <Text style={styles.starPickerLabel}>{reviewRating}/5</Text>
                    </View>
                    <TextInput
                        value={reviewText}
                        onChangeText={setReviewText}
                        editable={!isSubmittingReview}
                        placeholder="Write your review"
                        multiline={true}
                        style={styles.reviewInput}
                    />
                    <Pressable
                        style={styles.submitReviewButton}
                        disabled={isSubmittingReview}
                        onPress={() => { void handleSubmitReview(); }}
                    >
                        <Text style={styles.submitReviewButtonText}>
                            {isSubmittingReview ? "Submitting..." : "Submit review"}
                        </Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                {eventDetail.reviews.length === 0 ? (
                    <Text style={styles.bodyText}>No reviews yet.</Text>
                ) : (
                    eventDetail.reviews.map((review) => (
                        <View key={review.reviewId} style={styles.occurrenceRow}>
                            <Text style={styles.reviewTopLine}>
                                {(review.username ? `@${review.username}` : "Unknown user")}
                                {" · "}
                                {review.rating}/5
                                {" · "}
                                {formatReviewDate(review.createdAt)}
                            </Text>
                            <Text style={styles.reviewStars}>{getStars(review.rating)}</Text>
                            <Text style={styles.bodyText}>{review.text}</Text>
                        </View>
                    ))
                )}
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
    venueButton: {
        alignSelf: "flex-start",
        paddingVertical: 2,
        marginBottom: 2,
    },
    venueText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1d4ed8",
        textDecorationLine: "underline",
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
    manageActionsRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
    },
    manageEditButton: {
        alignSelf: "flex-start",
        borderRadius: 8,
        backgroundColor: "#1d4ed8",
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    manageDeleteButton: {
        alignSelf: "flex-start",
        borderRadius: 8,
        backgroundColor: "#dc2626",
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    manageButtonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 13,
    },
    manageDeleteButtonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 13,
    },
    bodyText: {
        fontSize: 14,
        color: "#475569",
    },
    ratingText: {
        fontSize: 14,
        color: "#334155",
    },
    ratingStars: {
        marginTop: 2,
        marginBottom: 8,
        fontSize: 14,
        color: "#f59e0b",
    },
    reviewComposer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#eef2f7",
    },
    reviewComposerTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 8,
    },
    starPickerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 2,
    },
    starPickerButton: {
        paddingVertical: 2,
        paddingHorizontal: 1,
    },
    starPickerIcon: {
        fontSize: 24,
        color: "#cbd5e1",
    },
    starPickerIconActive: {
        color: "#f59e0b",
    },
    starPickerLabel: {
        marginLeft: 8,
        fontSize: 13,
        fontWeight: "700",
        color: "#334155",
    },
    reviewInput: {
        minHeight: 80,
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingTop: 8,
        marginBottom: 8,
        textAlignVertical: "top",
        color: "#0f172a",
        backgroundColor: "#ffffff",
    },
    submitReviewButton: {
        alignSelf: "flex-start",
        borderRadius: 8,
        backgroundColor: "#1d4ed8",
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    submitReviewButtonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 13,
    },
    reviewTopLine: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 4,
    },
    reviewStars: {
        fontSize: 13,
        color: "#f59e0b",
        marginBottom: 4,
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
