import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    createVenueReview,
    VenueDetail,
    getErrorMessageFromUnknown,
    loadVenueDetail,
} from "../Services";

type VenueDetailScreenProps = {
    venueId: number;
};

const formatDate = (isoString: string): string =>
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

export const VenueDetailScreen = ({ venueId }: VenueDetailScreenProps) =>
{
    const [venue, setVenue] = useState<VenueDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
                const detail = await loadVenueDetail(venueId);
                setVenue(detail);
            }
            catch (caughtError)
            {
                setVenue(null);
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
        [venueId],
    );

    useEffect(
        () =>
        {
            void loadDetail();
        },
        [loadDetail],
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
            await createVenueReview(
                {
                    venueId,
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

    if (isLoading)
    {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    if (errorMessage)
    {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
        );
    }

    if (!venue)
    {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Venue unavailable.</Text>
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
                {venue.photo ? (
                    <Image source={{ uri: venue.photo }} style={styles.photo} />
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <Text style={styles.photoPlaceholderText}>No image</Text>
                    </View>
                )}

                <Text style={styles.title}>{venue.name}</Text>
                <Text style={styles.ratingText}>
                    {venue.averageRating === null
                        ? "No ratings yet"
                        : `${venue.averageRating.toFixed(2)} / 5 (${venue.reviewCount} reviews)`}
                </Text>
                {venue.averageRating !== null ? (
                    <Text style={styles.starText}>{getStars(venue.averageRating)}</Text>
                ) : null}
                <Text style={styles.bioText}>{venue.bio?.trim() || "No venue description yet."}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Reviews</Text>
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

                {venue.reviews.length === 0 ? (
                    <Text style={styles.emptyText}>No reviews yet.</Text>
                ) : (
                    venue.reviews.map((review) => (
                        <View key={review.reviewId} style={styles.reviewRow}>
                            <Text style={styles.reviewTopLine}>
                                {(review.username ? `@${review.username}` : "Unknown user")}
                                {" · "}
                                {review.rating}/5
                                {" · "}
                                {formatDate(review.createdAt)}
                            </Text>
                            <Text style={styles.reviewStars}>{getStars(review.rating)}</Text>
                            <Text style={styles.reviewText}>{review.text}</Text>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                {venue.upcomingEvents.length === 0 ? (
                    <Text style={styles.emptyText}>No upcoming events at this venue.</Text>
                ) : (
                    venue.upcomingEvents.map((eventItem) => (
                        <View key={eventItem.occurrenceId} style={styles.reviewRow}>
                            <Text style={styles.occurrenceTitle}>{eventItem.title}</Text>
                            <Text style={styles.metaText}>{formatDate(eventItem.startTime)}</Text>
                            <Text style={styles.metaText}>
                                {new Date(eventItem.startTime).toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                                {" · "}
                                {eventItem.status}
                            </Text>
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
    photo: {
        width: "100%",
        height: 180,
        borderRadius: 10,
        marginBottom: 10,
        backgroundColor: "#e2e8f0",
    },
    photoPlaceholder: {
        width: "100%",
        height: 180,
        borderRadius: 10,
        marginBottom: 10,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    photoPlaceholderText: {
        color: "#94a3b8",
        fontWeight: "600",
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 6,
    },
    ratingText: {
        fontSize: 14,
        color: "#334155",
    },
    starText: {
        marginTop: 2,
        marginBottom: 8,
        fontSize: 14,
        color: "#f59e0b",
    },
    bioText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#475569",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 8,
    },
    reviewComposer: {
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eef2f7",
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
    occurrenceTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4,
    },
    metaText: {
        fontSize: 13,
        color: "#64748b",
        marginBottom: 2,
    },
    reviewRow: {
        borderTopWidth: 1,
        borderTopColor: "#eef2f7",
        paddingTop: 10,
        marginTop: 10,
    },
    reviewTopLine: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 2,
    },
    reviewStars: {
        fontSize: 13,
        color: "#f59e0b",
        marginBottom: 4,
    },
    reviewText: {
        fontSize: 14,
        color: "#334155",
        lineHeight: 20,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748b",
    },
    errorText: {
        fontSize: 14,
        color: "#ef4444",
        textAlign: "center",
    },
});
