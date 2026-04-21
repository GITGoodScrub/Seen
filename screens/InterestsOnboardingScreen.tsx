import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    ArtistSuggestion,
    InterestSetup,
    TagItem,
    saveUserInterests,
    skipInterestsOnboarding,
    toggleFollowUser,
} from "../Services";

type InterestsOnboardingScreenProps = {
    setup: InterestSetup;
    onComplete: () => void;
    onSkipComplete: () => void;
};

type StepKey = "genres" | "event-types" | "artists";

const normalizeName = (value: string): string => value.trim().toLowerCase();

const TagChip = (
    {
        tag,
        isSelected,
        onPress,
    }: {
        tag: TagItem;
        isSelected: boolean;
        onPress: () => void;
    },
) => {
    return (
        <Pressable
            style={[styles.tagChip, isSelected ? styles.tagChipSelected : null]}
            onPress={onPress}
        >
            <Text style={[styles.tagChipText, isSelected ? styles.tagChipTextSelected : null]}>
                {tag.name}
            </Text>
        </Pressable>
    );
};

export const InterestsOnboardingScreen = (
    {
        setup,
        onComplete,
        onSkipComplete,
    }: InterestsOnboardingScreenProps,
) =>
{
    const [step, setStep] = useState<StepKey>("genres");
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>(setup.selectedTagIds);
    const [recommendedArtists, setRecommendedArtists] = useState<ArtistSuggestion[]>(setup.recommendedArtists);
    const [isSaving, setIsSaving] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);

    const genreTags = useMemo(
        () =>
        {
            const sorted = [...setup.genreTags];
            sorted.sort((left, right) => normalizeName(left.name).localeCompare(normalizeName(right.name)));
            return sorted;
        },
        [setup.genreTags],
    );

    const eventTypeTags = useMemo(
        () =>
        {
            const sorted = [...setup.eventTypeTags];
            sorted.sort((left, right) => normalizeName(left.name).localeCompare(normalizeName(right.name)));
            return sorted;
        },
        [setup.eventTypeTags],
    );

    const toggleTag = (tagId: number): void =>
    {
        setSelectedTagIds(
            (current) =>
            {
                if (current.includes(tagId))
                {
                    return current.filter((entry) => entry !== tagId);
                }

                return [...current, tagId];
            },
        );
    };

    const handleSkip = async (): Promise<void> =>
    {
        if (isSkipping || isSaving)
        {
            return;
        }

        setIsSkipping(true);

        try
        {
            await skipInterestsOnboarding();
            onSkipComplete();
        }
        finally
        {
            setIsSkipping(false);
        }
    };

    const handleContinueFromEventTypes = async (): Promise<void> =>
    {
        setIsSaving(true);

        try
        {
            const saved = await saveUserInterests(selectedTagIds);
            setRecommendedArtists(saved.recommendedArtists);
            setStep("artists");
        }
        finally
        {
            setIsSaving(false);
        }
    };

    const handleToggleFollowArtist = (artist: ArtistSuggestion): void =>
    {
        setRecommendedArtists(
            (current) => current.map(
                (entry) => entry.artistId === artist.artistId
                    ? { ...entry, isFollowed: !entry.isFollowed }
                    : entry,
            ),
        );

        toggleFollowUser(artist.userId).catch(
            () =>
            {
                setRecommendedArtists(
                    (current) => current.map(
                        (entry) => entry.artistId === artist.artistId
                            ? { ...entry, isFollowed: !entry.isFollowed }
                            : entry,
                    ),
                );
            },
        );
    };

    const renderSelectionStep = (
        title: string,
        subtitle: string,
        tags: TagItem[],
        onContinue: () => void,
    ) =>
    {
        return (
            <>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                <View style={styles.tagGrid}>
                    {tags.map(
                        (tag) => (
                            <TagChip
                                key={tag.tagId}
                                tag={tag}
                                isSelected={selectedTagIds.includes(tag.tagId)}
                                onPress={() => toggleTag(tag.tagId)}
                            />
                        ),
                    )}
                </View>

                {tags.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No options found yet. Tap continue to keep going.</Text>
                    </View>
                ) : null}

                <View style={styles.actionsRow}>
                    <Pressable
                        style={[styles.secondaryButton, (isSaving || isSkipping) ? styles.disabledButton : null]}
                        disabled={isSaving || isSkipping}
                        onPress={() =>
                        {
                            void handleSkip();
                        }}
                    >
                        {isSkipping ? <ActivityIndicator size="small" color="#1d4ed8" /> : <Text style={styles.secondaryButtonText}>Skip for now</Text>}
                    </Pressable>

                    <Pressable
                        style={[styles.primaryButton, (isSaving || isSkipping) ? styles.disabledButton : null]}
                        disabled={isSaving || isSkipping}
                        onPress={onContinue}
                    >
                        {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.primaryButtonText}>Continue</Text>}
                    </Pressable>
                </View>
            </>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="always"
            >
                {step === "genres"
                    ? renderSelectionStep(
                        "What are you into?",
                        "Pick the genres you like. You can change this anytime in Settings.",
                        genreTags,
                        () => setStep("event-types"),
                    )
                    : null}

                {step === "event-types"
                    ? renderSelectionStep(
                        "Which event types do you prefer?",
                        "Select formats you want to discover first.",
                        eventTypeTags,
                        () =>
                        {
                            void handleContinueFromEventTypes();
                        },
                    )
                    : null}

                {step === "artists" ? (
                    <>
                        <Text style={styles.title}>You might want to follow</Text>
                        <Text style={styles.subtitle}>Based on your interests, here are some artists to kick things off.</Text>

                        {recommendedArtists.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyText}>No suggestions yet. We will improve suggestions as more events are tagged.</Text>
                            </View>
                        ) : (
                            <View style={styles.artistList}>
                                {recommendedArtists.map((artist) => (
                                    <View key={artist.artistId} style={styles.artistRow}>
                                        <View style={styles.artistInfo}>
                                            {artist.photo ? (
                                                <Image source={{ uri: artist.photo }} style={styles.artistPhoto} />
                                            ) : (
                                                <View style={styles.artistPhotoPlaceholder}>
                                                    <Text style={styles.artistInitials}>{artist.name.slice(0, 2).toUpperCase()}</Text>
                                                </View>
                                            )}
                                            <View>
                                                <Text style={styles.artistName}>{artist.name}</Text>
                                                <Text style={styles.artistMeta}>{artist.username ? `@${artist.username}` : "Artist"}</Text>
                                            </View>
                                        </View>

                                        <Pressable
                                            style={[styles.followButton, artist.isFollowed ? styles.followingButton : null]}
                                            onPress={() => handleToggleFollowArtist(artist)}
                                        >
                                            <Text style={styles.followButtonText}>{artist.isFollowed ? "Following" : "Follow"}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.actionsRow}>
                            <Pressable
                                style={styles.secondaryButton}
                                onPress={() => setStep("event-types")}
                            >
                                <Text style={styles.secondaryButtonText}>Back</Text>
                            </Pressable>

                            <Pressable
                                style={styles.primaryButton}
                                onPress={onComplete}
                            >
                                <Text style={styles.primaryButtonText}>Finish</Text>
                            </Pressable>
                        </View>
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 42,
        paddingBottom: 28,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#475569",
        lineHeight: 20,
        marginBottom: 16,
    },
    tagGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 18,
    },
    tagChip: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
    },
    tagChipSelected: {
        borderColor: "#1d4ed8",
        backgroundColor: "#dbeafe",
    },
    tagChipText: {
        color: "#334155",
        fontSize: 14,
        fontWeight: "600",
    },
    tagChipTextSelected: {
        color: "#1d4ed8",
    },
    actionsRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 8,
    },
    secondaryButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#bfdbfe",
        backgroundColor: "#eff6ff",
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButtonText: {
        color: "#1d4ed8",
        fontSize: 14,
        fontWeight: "700",
    },
    primaryButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 10,
        backgroundColor: "#1d4ed8",
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
    },
    disabledButton: {
        opacity: 0.7,
    },
    artistList: {
        gap: 10,
        marginBottom: 8,
    },
    artistRow: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        backgroundColor: "#ffffff",
        padding: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    artistInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    artistPhoto: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#e2e8f0",
    },
    artistPhotoPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#cbd5e1",
        alignItems: "center",
        justifyContent: "center",
    },
    artistInitials: {
        color: "#334155",
        fontWeight: "700",
        fontSize: 13,
    },
    artistName: {
        color: "#0f172a",
        fontSize: 14,
        fontWeight: "700",
    },
    artistMeta: {
        color: "#64748b",
        fontSize: 12,
        marginTop: 2,
    },
    followButton: {
        minWidth: 84,
        minHeight: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1d4ed8",
        paddingHorizontal: 12,
    },
    followingButton: {
        backgroundColor: "#334155",
    },
    followButtonText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "700",
    },
    emptyBox: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        backgroundColor: "#ffffff",
        padding: 12,
        marginBottom: 8,
    },
    emptyText: {
        color: "#475569",
        fontSize: 13,
        lineHeight: 18,
    },
});
