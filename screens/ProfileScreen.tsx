import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Switch,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SelectDropdown } from "../components/Inputs/SelectDropdown";
import {
    AuthSession,
    deletePost,
    deleteSeriesReview,
    deleteVenueReview,
    EventReminderSettings,
    FollowListType,
    FollowUser,
    TagItem,
    loadEventReminderSettings,
    loadFollowUsers,
    loadFollowSnapshot,
    loadInterestSetup,
    loadTags,
    ProfileActivityItem,
    ProfileRecord,
    saveEventReminderSettings,
    saveUserInterests,
    getErrorMessageFromUnknown,
    getUsernameValidationMessage,
    loadProfileByUserId,
    saveMyProfile,
    setCurrentUsername,
    toggleFollowUser,
    updatePost,
    updateSeriesReview,
    updateVenueReview,
} from "../Services";

type ProfileScreenProps = {
    authSession: AuthSession;
    profileUserId?: number | null;
    isEditing?: boolean;
    openFollowListRequest?: number;
    onOpenProfilePress?: (profileUserId: number) => void;
    onStartEditing?: () => void;
    onStopEditing?: () => void;
    onSessionUpdate?: (nextSession: AuthSession) => void;
};

type ReviewVisibilityValue = "public" | "followersOnly" | "private";

const reviewVisibilityOptions = [
    { label: "Everyone", value: "public" },
    { label: "Followers", value: "followersOnly" },
    { label: "Only me", value: "private" },
] as const;

const safeString = (value: string | null | undefined): string =>
{
    return value ?? "";
};

const formatActivityDate = (isoString: string): string =>
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

const getActivityTypeLabel = (activityType: ProfileActivityItem["type"]): string =>
{
    if (activityType === "seriesReview")
    {
        return "Event Review";
    }

    if (activityType === "venueReview")
    {
        return "Venue Review";
    }

    return "Post";
};

const VerifiedBadge = () =>
{
    return (
        <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✓</Text>
        </View>
    );
};

export const ProfileScreen = (
    {
        authSession,
        profileUserId,
        isEditing = false,
        openFollowListRequest = 0,
        onOpenProfilePress,
        onStartEditing,
        onStopEditing,
        onSessionUpdate,
    }: ProfileScreenProps,
) =>
{
    const [username, setUsername] = useState(safeString(authSession.user.username));
    const [displayName, setDisplayName] = useState(safeString(authSession.user.profile?.displayName));
    const [bio, setBio] = useState(safeString(authSession.user.profile?.bio));
    const [profilePhoto, setProfilePhoto] = useState(safeString(authSession.user.profile?.profilePhoto));
    const [isVerified, setIsVerified] = useState(authSession.user.profile?.isVerified ?? false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
    const [isFollowingTarget, setIsFollowingTarget] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [activeFollowListType, setActiveFollowListType] = useState<FollowListType>("followers");
    const [isFollowListVisible, setIsFollowListVisible] = useState(false);
    const prevOpenFollowListRequestRef = useRef(0);
    const [isFollowListLoading, setIsFollowListLoading] = useState(false);
    const [followListErrorMessage, setFollowListErrorMessage] = useState<string | null>(null);
    const [followListUsers, setFollowListUsers] = useState<FollowUser[]>([]);
    const [profileActivity, setProfileActivity] = useState<ProfileActivityItem[]>([]);
    const [eventReminderSettings, setEventReminderSettings] = useState<EventReminderSettings>(
        {
            remindOneWeek: true,
            remindTwentyFourHours: true,
            remindOneHour: true,
        },
    );
    const [isReminderSettingsLoading, setIsReminderSettingsLoading] = useState(true);
    const [isReminderSettingsSaving, setIsReminderSettingsSaving] = useState(false);
    const [reminderSettingsErrorMessage, setReminderSettingsErrorMessage] = useState<string | null>(null);
    const [selectedInterestTags, setSelectedInterestTags] = useState<TagItem[]>([]);
    const [availableInterestTags, setAvailableInterestTags] = useState<TagItem[]>([]);
    const [interestSearchQuery, setInterestSearchQuery] = useState("");
    const [isInterestSettingsLoading, setIsInterestSettingsLoading] = useState(true);
    const [isInterestSettingsSaving, setIsInterestSettingsSaving] = useState(false);
    const [interestSettingsErrorMessage, setInterestSettingsErrorMessage] = useState<string | null>(null);
    const [followListTabRowWidth, setFollowListTabRowWidth] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [followErrorMessage, setFollowErrorMessage] = useState<string | null>(null);
    const [editingActivity, setEditingActivity] = useState<ProfileActivityItem | null>(null);
    const [editingActivityText, setEditingActivityText] = useState("");
    const [editingActivityRating, setEditingActivityRating] = useState(5);
    const [editingActivityVisibility, setEditingActivityVisibility] = useState<ReviewVisibilityValue>("public");
    const [isSavingActivityEdit, setIsSavingActivityEdit] = useState(false);
    const selectedUserId = profileUserId ?? authSession.user.id;
    const isOwnProfile = selectedUserId === authSession.user.id;
    const isInEditMode = isOwnProfile && isEditing;
    const followListPanelProgress = useRef(new Animated.Value(0)).current;
    const followTabIndicatorProgress = useRef(
        new Animated.Value(activeFollowListType === "followers" ? 0 : 1),
    ).current;

    const followListPanelTranslateX = followListPanelProgress.interpolate(
        {
            inputRange: [0, 1],
            outputRange: [460, 0],
        },
    );

    const followListBackdropOpacity = followListPanelProgress.interpolate(
        {
            inputRange: [0, 1],
            outputRange: [0, 0.35],
        },
    );

    const followTabIndicatorTranslateX = followTabIndicatorProgress.interpolate(
        {
            inputRange: [0, 1],
            outputRange: [0, followListTabRowWidth / 2],
        },
    );

    useEffect(
        () =>
        {
            let isCancelled = false;

            const loadProfile = async (): Promise<void> =>
            {
                setIsLoadingProfile(true);
                setSuccessMessage(null);

                try
                {
                    const profile = await loadProfileByUserId(selectedUserId);
                    const followSnapshot = await loadFollowSnapshot(selectedUserId, authSession.user.id);

                    if (isCancelled)
                    {
                        return;
                    }

                    setUsername(safeString(profile.username));
                    setDisplayName(safeString(profile.displayName));
                    setBio(safeString(profile.bio));
                    setProfilePhoto(safeString(profile.profilePhoto));
                    setIsVerified(profile.isVerified);
                    setProfileActivity(profile.activity ?? []);
                    setFollowingCount(followSnapshot.followingCount);
                    setFollowersCount(followSnapshot.followersCount);
                    setIsFollowingTarget(followSnapshot.isFollowingTarget);
                    setFollowErrorMessage(null);
                    setErrorMessage(null);
                }
                catch (caughtError)
                {
                    if (isCancelled)
                    {
                        return;
                    }

                    setErrorMessage(getErrorMessageFromUnknown(caughtError));
                    setProfileActivity([]);
                }
                finally
                {
                    if (!isCancelled)
                    {
                        setIsLoadingProfile(false);
                    }
                }
            };

            void loadProfile();

            return () =>
            {
                isCancelled = true;
            };
        },
        [selectedUserId],
    );

    useEffect(
        () =>
        {
            if (!isOwnProfile)
            {
                setIsReminderSettingsLoading(false);
                return;
            }

            let isCancelled = false;
            setIsReminderSettingsLoading(true);

            loadEventReminderSettings()
                .then(
                    (settings) =>
                    {
                        if (isCancelled)
                        {
                            return;
                        }

                        setEventReminderSettings(settings);
                        setReminderSettingsErrorMessage(null);
                    },
                )
                .catch(
                    (caughtError: unknown) =>
                    {
                        if (isCancelled)
                        {
                            return;
                        }

                        setReminderSettingsErrorMessage(getErrorMessageFromUnknown(caughtError));
                    },
                )
                .finally(
                    () =>
                    {
                        if (!isCancelled)
                        {
                            setIsReminderSettingsLoading(false);
                        }
                    },
                );

            return () =>
            {
                isCancelled = true;
            };
        },
        [isOwnProfile],
    );

    useEffect(
        () =>
        {
            if (!isOwnProfile)
            {
                setIsInterestSettingsLoading(false);
                return;
            }

            let isCancelled = false;
            setIsInterestSettingsLoading(true);

            Promise.all([
                loadInterestSetup(),
                loadTags(),
            ])
                .then(
                    ([interestSetup, tags]) =>
                    {
                        if (isCancelled)
                        {
                            return;
                        }

                        setSelectedInterestTags(interestSetup.selectedTags);
                        setAvailableInterestTags(tags);
                        setInterestSettingsErrorMessage(null);
                    },
                )
                .catch(
                    (caughtError: unknown) =>
                    {
                        if (isCancelled)
                        {
                            return;
                        }

                        setInterestSettingsErrorMessage(getErrorMessageFromUnknown(caughtError));
                    },
                )
                .finally(
                    () =>
                    {
                        if (!isCancelled)
                        {
                            setIsInterestSettingsLoading(false);
                        }
                    },
                );

            return () =>
            {
                isCancelled = true;
            };
        },
        [isOwnProfile],
    );

    useEffect(
        () =>
        {
            Animated.timing(
                followTabIndicatorProgress,
                {
                    toValue: activeFollowListType === "followers" ? 0 : 1,
                    duration: 170,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                },
            ).start();
        },
        [activeFollowListType, followTabIndicatorProgress],
    );

    const handleToggleFollow = async (): Promise<void> =>
    {
        if (isOwnProfile)
        {
            return;
        }

        setIsFollowActionLoading(true);
        setFollowErrorMessage(null);

        try
        {
            const isNowFollowing = await toggleFollowUser(selectedUserId);

            setIsFollowingTarget(isNowFollowing);
            setFollowersCount(
                (currentCount) =>
                {
                    if (isNowFollowing)
                    {
                        return currentCount + 1;
                    }

                    return Math.max(0, currentCount - 1);
                },
            );
        }
        catch (caughtError)
        {
            setFollowErrorMessage(getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsFollowActionLoading(false);
        }
    };

    const loadFollowList = async (listType: FollowListType): Promise<void> =>
    {
        setActiveFollowListType(listType);
        setIsFollowListLoading(true);
        setFollowListErrorMessage(null);

        try
        {
            const users = await loadFollowUsers(selectedUserId, listType);
            setFollowListUsers(users);
        }
        catch (caughtError)
        {
            setFollowListUsers([]);
            setFollowListErrorMessage(getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsFollowListLoading(false);
        }
    };

    useEffect(
        () =>
        {
            if (openFollowListRequest > 0 && openFollowListRequest !== prevOpenFollowListRequestRef.current)
            {
                prevOpenFollowListRequestRef.current = openFollowListRequest;
                handleOpenFollowList("followers");
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [openFollowListRequest],
    );

    const handleOpenFollowList = (listType: FollowListType): void =>
    {
        if (!isFollowListVisible)
        {
            setIsFollowListVisible(true);
            Animated.timing(
                followListPanelProgress,
                {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                },
            ).start();
        }

        void loadFollowList(listType);
    };

    const handleCloseFollowList = (): void =>
    {
        Animated.timing(
            followListPanelProgress,
            {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            },
        ).start(
            () =>
            {
                setIsFollowListVisible(false);
            },
        );
    };

    const handleSwitchFollowList = (listType: FollowListType): void =>
    {
        if (listType === activeFollowListType)
        {
            return;
        }

        void loadFollowList(listType);
    };

    const handleOpenProfileFromFollowList = (userId: number): void =>
    {
        handleCloseFollowList();
        onOpenProfilePress?.(userId);
    };

    const handleToggleReminderSetting = (settingKey: keyof EventReminderSettings): void =>
    {
        if (isReminderSettingsSaving)
        {
            return;
        }

        const previousSettings = eventReminderSettings;
        const nextSettings: EventReminderSettings = {
            ...eventReminderSettings,
            [settingKey]: !eventReminderSettings[settingKey],
        };

        setEventReminderSettings(nextSettings);
        setIsReminderSettingsSaving(true);
        setReminderSettingsErrorMessage(null);

        saveEventReminderSettings(nextSettings)
            .then(
                (savedSettings) =>
                {
                    setEventReminderSettings(savedSettings);
                },
            )
            .catch(
                (caughtError: unknown) =>
                {
                    setEventReminderSettings(previousSettings);
                    setReminderSettingsErrorMessage(getErrorMessageFromUnknown(caughtError));
                },
            )
            .finally(
                () =>
                {
                    setIsReminderSettingsSaving(false);
                },
            );
    };

    const filteredInterestOptions = useMemo(
        () =>
        {
            const selectedTagIdSet = new Set(selectedInterestTags.map((entry) => entry.tagId));
            const normalizedQuery = interestSearchQuery.trim().toLowerCase();

            return availableInterestTags
                .filter((entry) => !selectedTagIdSet.has(entry.tagId))
                .filter((entry) =>
                {
                    if (normalizedQuery.length === 0)
                    {
                        return true;
                    }

                    return entry.name.toLowerCase().includes(normalizedQuery);
                })
                .slice(0, 20);
        },
        [availableInterestTags, interestSearchQuery, selectedInterestTags],
    );

    const persistInterests = (nextSelectedTags: TagItem[]): void =>
    {
        setIsInterestSettingsSaving(true);
        setInterestSettingsErrorMessage(null);

        saveUserInterests(nextSelectedTags.map((entry) => entry.tagId))
            .then(
                (updatedSetup) =>
                {
                    setSelectedInterestTags(updatedSetup.selectedTags);
                },
            )
            .catch(
                (caughtError: unknown) =>
                {
                    setInterestSettingsErrorMessage(getErrorMessageFromUnknown(caughtError));
                },
            )
            .finally(
                () =>
                {
                    setIsInterestSettingsSaving(false);
                },
            );
    };

    const handleAddInterestTag = (tag: TagItem): void =>
    {
        if (isInterestSettingsSaving)
        {
            return;
        }

        if (selectedInterestTags.some((entry) => entry.tagId === tag.tagId))
        {
            return;
        }

        const previous = selectedInterestTags;
        const next = [...selectedInterestTags, tag];

        setSelectedInterestTags(next);
        setInterestSearchQuery("");
        persistInterests(next);

        if (interestSettingsErrorMessage)
        {
            setInterestSettingsErrorMessage(null);
        }

        if (next.length === previous.length)
        {
            return;
        }
    };

    const handleRemoveInterestTag = (tagId: number): void =>
    {
        if (isInterestSettingsSaving)
        {
            return;
        }

        const next = selectedInterestTags.filter((entry) => entry.tagId !== tagId);
        setSelectedInterestTags(next);
        persistInterests(next);
    };

    const handlePickProfilePhoto = async (): Promise<void> =>
    {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.status !== "granted")
        {
            Alert.alert(
                "Permission required",
                "Please allow photo library access to choose a profile picture.",
            );
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync(
            {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                base64: true,
            },
        );

        if (pickerResult.canceled)
        {
            return;
        }

        const pickedAsset = pickerResult.assets[0];

        if (!pickedAsset)
        {
            return;
        }

        if (pickedAsset.base64)
        {
            const mimeType = pickedAsset.mimeType || "image/jpeg";
            setProfilePhoto(`data:${mimeType};base64,${pickedAsset.base64}`);
            return;
        }

        setProfilePhoto(pickedAsset.uri);
    };

    const handleRemoveProfilePhoto = (): void =>
    {
        setProfilePhoto("");
    };

    const initials = useMemo(
        () =>
        {
            const sourceName = displayName || username || authSession.user.email || "Seen User";
            const parts = sourceName
                .trim()
                .split(/\s+/)
                .filter((entry) => entry.length > 0)
                .slice(0, 2);

            const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
            return letters || "SE";
        },
        [authSession.user.email, displayName, username],
    );

    const applyProfileToSession = (profile: ProfileRecord, nextUsername: string): void =>
    {
        onSessionUpdate?.(
            {
                ...authSession,
                user: {
                    ...authSession.user,
                    username: nextUsername,
                    profile: {
                        displayName: profile.displayName,
                        profilePhoto: profile.profilePhoto,
                        bio: profile.bio,
                        locationId: profile.locationId,
                        isVerified: profile.isVerified,
                    },
                },
            },
        );
    };

    const handleSaveProfile = async (): Promise<void> =>
    {
        if (!isOwnProfile)
        {
            return;
        }

        setIsSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try
        {
            const normalizedUsername = username.trim().toLowerCase();
            const usernameValidationMessage = getUsernameValidationMessage(normalizedUsername);

            if (usernameValidationMessage)
            {
                setErrorMessage(usernameValidationMessage);
                setIsSaving(false);
                return;
            }

            const currentUsername = safeString(authSession.user.username).toLowerCase();

            if (normalizedUsername !== currentUsername)
            {
                await setCurrentUsername(normalizedUsername);
            }

            const savedProfile = await saveMyProfile(
                {
                    displayName,
                    profilePhoto,
                    bio,
                },
            );

            applyProfileToSession(savedProfile, normalizedUsername);
            setSuccessMessage("Profile updated.");
        }
        catch (caughtError)
        {
            setErrorMessage(getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsSaving(false);
        }
    };

    const getActivityNumericId = (activityItem: ProfileActivityItem): number | null =>
    {
        const parts = activityItem.id.split("-");
        const rawId = parts[parts.length - 1] ?? "";
        const parsedId = Number.parseInt(rawId, 10);
        return Number.isNaN(parsedId) ? null : parsedId;
    };

    const handleOpenActivityEdit = (activityItem: ProfileActivityItem): void =>
    {
        setEditingActivity(activityItem);
        setEditingActivityText(activityItem.text);
        setEditingActivityRating(activityItem.rating ?? 5);
        setEditingActivityVisibility("public");
    };

    const handleDeleteActivity = (activityItem: ProfileActivityItem): void =>
    {
        const entityId = getActivityNumericId(activityItem);

        if (entityId === null)
        {
            Alert.alert("Error", "Could not identify this activity item.");
            return;
        }

        Alert.alert(
            "Delete item",
            "Are you sure you want to delete this item?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () =>
                    {
                        const previousActivity = profileActivity;
                        setProfileActivity((current) => current.filter((entry) => entry.id !== activityItem.id));

                        void (async () =>
                        {
                            try
                            {
                                if (activityItem.type === "post")
                                {
                                    await deletePost(entityId);
                                }
                                else if (activityItem.type === "seriesReview")
                                {
                                    await deleteSeriesReview(entityId);
                                }
                                else
                                {
                                    await deleteVenueReview(entityId);
                                }
                            }
                            catch (caughtError)
                            {
                                setProfileActivity(previousActivity);
                                Alert.alert("Delete failed", getErrorMessageFromUnknown(caughtError));
                            }
                        })();
                    },
                },
            ],
        );
    };

    const handleActivityMenuPress = (activityItem: ProfileActivityItem): void =>
    {
        Alert.alert(
            "Activity actions",
            undefined,
            [
                {
                    text: "Edit",
                    onPress: () => handleOpenActivityEdit(activityItem),
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDeleteActivity(activityItem),
                },
                { text: "Cancel", style: "cancel" },
            ],
        );
    };

    const handleSaveActivityEdit = async (): Promise<void> =>
    {
        if (!editingActivity)
        {
            return;
        }

        const entityId = getActivityNumericId(editingActivity);
        if (entityId === null)
        {
            Alert.alert("Error", "Could not identify this activity item.");
            return;
        }

        const trimmedText = editingActivityText.trim();
        if (trimmedText.length === 0)
        {
            Alert.alert("Error", "Text cannot be empty.");
            return;
        }

        setIsSavingActivityEdit(true);

        try
        {
            if (editingActivity.type === "post")
            {
                await updatePost(entityId, trimmedText);
            }
            else if (editingActivity.type === "seriesReview")
            {
                await updateSeriesReview(
                    {
                        reviewId: entityId,
                        rating: editingActivityRating,
                        text: trimmedText,
                        visibility: editingActivityVisibility,
                    },
                );
            }
            else
            {
                await updateVenueReview(
                    {
                        reviewId: entityId,
                        rating: editingActivityRating,
                        text: trimmedText,
                        visibility: editingActivityVisibility,
                    },
                );
            }

            setProfileActivity((current) =>
                current.map(
                    (entry) =>
                    {
                        if (entry.id !== editingActivity.id)
                        {
                            return entry;
                        }

                        return {
                            ...entry,
                            text: trimmedText,
                            rating: entry.type === "post" ? null : editingActivityRating,
                        };
                    },
                ),
            );

            setEditingActivity(null);
            setEditingActivityText("");
        }
        catch (caughtError)
        {
            Alert.alert("Save failed", getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsSavingActivityEdit(false);
        }
    };

    if (isLoadingProfile)
    {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
            <View style={styles.avatarPlaceholder}>
                {profilePhoto ? (
                    <Image
                        source={{ uri: profilePhoto }}
                        style={styles.avatarImage}
                    />
                ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                )}
            </View>

            <Text style={styles.title}>{isInEditMode ? "Edit Profile" : "Profile"}</Text>
            <Text style={styles.meta}>
                {isInEditMode
                    ? "Update your public account details."
                    : (isOwnProfile ? "Your public account details." : "Public profile." )}
            </Text>

            <View style={styles.statsRow}>
                <Pressable
                    style={styles.statCard}
                    onPress={() =>
                    {
                        handleOpenFollowList("followers");
                    }}
                >
                    <Text style={styles.statCount}>{followersCount}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </Pressable>

                <Pressable
                    style={styles.statCard}
                    onPress={() =>
                    {
                        handleOpenFollowList("following");
                    }}
                >
                    <Text style={styles.statCount}>{followingCount}</Text>
                    <Text style={styles.statLabel}>Following</Text>
                </Pressable>
            </View>

            {!isOwnProfile ? (
                <>
                    <Pressable
                        style={[
                            styles.followButton,
                            isFollowingTarget ? styles.followingButton : null,
                            isFollowActionLoading ? styles.saveButtonDisabled : null,
                        ]}
                        onPress={() =>
                        {
                            void handleToggleFollow();
                        }}
                        disabled={isFollowActionLoading}
                    >
                        {isFollowActionLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.followButtonText}>
                                {isFollowingTarget ? "Unfollow" : "Follow"}
                            </Text>
                        )}
                    </Pressable>

                    {followErrorMessage ? (
                        <Text style={styles.errorText}>{followErrorMessage}</Text>
                    ) : null}
                </>
            ) : null}

            <View style={styles.panel}>
                {isInEditMode ? (
                    <>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            editable={!isSaving}
                            placeholder="username"
                            placeholderTextColor="#94a3b8"
                        />

                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
                            editable={!isSaving}
                            placeholder="Display name"
                            placeholderTextColor="#94a3b8"
                        />

                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            editable={!isSaving}
                            multiline={true}
                            placeholder="Tell people a bit about yourself"
                            placeholderTextColor="#94a3b8"
                        />

                        <Text style={styles.label}>Profile Photo</Text>
                        <View style={styles.photoActionRow}>
                            <Pressable
                                style={styles.secondaryButton}
                                disabled={isSaving}
                                onPress={() =>
                                {
                                    void handlePickProfilePhoto();
                                }}
                            >
                                <Text style={styles.secondaryButtonText}>Choose From Phone</Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.secondaryButton,
                                    (!profilePhoto || isSaving) ? styles.saveButtonDisabled : null,
                                ]}
                                disabled={!profilePhoto || isSaving}
                                onPress={handleRemoveProfilePhoto}
                            >
                                <Text style={styles.secondaryButtonText}>Remove</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.photoHint}>Selected image is saved to your profile.</Text>

                        <Text style={styles.sectionTitle}>Event Reminder Settings</Text>

                        {isReminderSettingsLoading ? (
                            <View style={styles.reminderLoadingRow}>
                                <ActivityIndicator size="small" />
                                <Text style={styles.readOnlyValue}>Loading reminder settings...</Text>
                            </View>
                        ) : (
                            <View style={styles.reminderSettingsList}>
                                <View style={styles.reminderSettingRow}>
                                    <Text style={styles.reminderSettingLabel}>1 week before event</Text>
                                    <Switch
                                        value={eventReminderSettings.remindOneWeek}
                                        onValueChange={() => handleToggleReminderSetting("remindOneWeek")}
                                        disabled={isReminderSettingsSaving}
                                    />
                                </View>

                                <View style={styles.reminderSettingRow}>
                                    <Text style={styles.reminderSettingLabel}>24 hours before event</Text>
                                    <Switch
                                        value={eventReminderSettings.remindTwentyFourHours}
                                        onValueChange={() => handleToggleReminderSetting("remindTwentyFourHours")}
                                        disabled={isReminderSettingsSaving}
                                    />
                                </View>

                                <View style={styles.reminderSettingRow}>
                                    <Text style={styles.reminderSettingLabel}>1 hour before event</Text>
                                    <Switch
                                        value={eventReminderSettings.remindOneHour}
                                        onValueChange={() => handleToggleReminderSetting("remindOneHour")}
                                        disabled={isReminderSettingsSaving}
                                    />
                                </View>
                            </View>
                        )}

                        {reminderSettingsErrorMessage ? (
                            <Text style={styles.errorText}>{reminderSettingsErrorMessage}</Text>
                        ) : null}

                        <Text style={styles.sectionTitle}>Interests</Text>

                        {isInterestSettingsLoading ? (
                            <View style={styles.reminderLoadingRow}>
                                <ActivityIndicator size="small" />
                                <Text style={styles.readOnlyValue}>Loading interests...</Text>
                            </View>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.input}
                                    value={interestSearchQuery}
                                    onChangeText={setInterestSearchQuery}
                                    editable={!isInterestSettingsSaving}
                                    placeholder="Search interests (e.g., comedy, theatre, concert)"
                                    placeholderTextColor="#94a3b8"
                                />

                                {selectedInterestTags.length > 0 ? (
                                    <View style={styles.interestTagChipRow}>
                                        {selectedInterestTags.map((tag) => (
                                            <Pressable
                                                key={`selected-interest-${tag.tagId}`}
                                                style={styles.interestTagChip}
                                                onPress={() => handleRemoveInterestTag(tag.tagId)}
                                                disabled={isInterestSettingsSaving}
                                            >
                                                <Text style={styles.interestTagChipText}>{tag.name} ×</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                ) : (
                                    <Text style={styles.photoHint}>No interests selected yet.</Text>
                                )}

                                {filteredInterestOptions.length > 0 ? (
                                    <View style={styles.interestSuggestionList}>
                                        {filteredInterestOptions.map((tag) => (
                                            <Pressable
                                                key={`interest-option-${tag.tagId}`}
                                                style={styles.interestSuggestionRow}
                                                onPress={() => handleAddInterestTag(tag)}
                                                disabled={isInterestSettingsSaving}
                                            >
                                                <Text style={styles.interestSuggestionLabel}>{tag.name}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                ) : null}
                            </>
                        )}

                        {interestSettingsErrorMessage ? (
                            <Text style={styles.errorText}>{interestSettingsErrorMessage}</Text>
                        ) : null}

                        {errorMessage ? (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        ) : null}

                        {successMessage ? (
                            <Text style={styles.successText}>{successMessage}</Text>
                        ) : null}

                        <View style={styles.actionRow}>
                            <Pressable
                                style={styles.secondaryButton}
                                disabled={isSaving}
                                onPress={onStopEditing}
                            >
                                <Text style={styles.secondaryButtonText}>Done</Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.saveButton,
                                    isSaving ? styles.saveButtonDisabled : null,
                                ]}
                                disabled={isSaving}
                                onPress={() =>
                                {
                                    void handleSaveProfile();
                                }}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Profile</Text>
                                )}
                            </Pressable>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.readOnlyRow}>
                            <Text style={styles.readOnlyLabel}>Username</Text>
                            <View style={styles.usernameValueRow}>
                                <Text style={styles.readOnlyValue}>{username || "-"}</Text>
                                {isVerified && username ? <VerifiedBadge /> : null}
                            </View>
                        </View>

                        <View style={styles.readOnlyRow}>
                            <Text style={styles.readOnlyLabel}>Display Name</Text>
                            <Text style={styles.readOnlyValue}>{displayName || "-"}</Text>
                        </View>

                        <View style={styles.readOnlyRow}>
                            <Text style={styles.readOnlyLabel}>Bio</Text>
                            <Text style={styles.readOnlyValue}>{bio || "-"}</Text>
                        </View>

                        <View style={styles.readOnlyRow}>
                            <Text style={styles.readOnlyLabel}>Profile Photo</Text>
                            <Text style={styles.readOnlyValue}>{profilePhoto ? "Set" : "-"}</Text>
                        </View>

                        {isOwnProfile ? (
                            <Pressable
                                style={styles.secondaryButton}
                                onPress={onStartEditing}
                            >
                                <Text style={styles.secondaryButtonText}>Edit Profile</Text>
                            </Pressable>
                        ) : null}
                    </>
                )}
            </View>

            {!isInEditMode ? (
                <View style={styles.panel}>
                    <Text style={styles.sectionTitle}>Posts & Reviews</Text>
                    {profileActivity.length === 0 ? (
                        <Text style={styles.readOnlyValue}>No activity yet.</Text>
                    ) : (
                        profileActivity.map((activityItem) => (
                            <View key={activityItem.id} style={styles.activityRow}>
                                <View style={styles.activityHeaderRow}>
                                    <Text style={styles.activityMetaText}>
                                        {getActivityTypeLabel(activityItem.type)}
                                        {" · "}
                                        {formatActivityDate(activityItem.createdAt)}
                                    </Text>
                                    {isOwnProfile ? (
                                        <Pressable
                                            style={styles.activityMenuButton}
                                            onPress={() => handleActivityMenuPress(activityItem)}
                                        >
                                            <Ionicons name="ellipsis-horizontal" size={18} color="#64748b" />
                                        </Pressable>
                                    ) : null}
                                </View>
                                {activityItem.targetName ? (
                                    <Text style={styles.activityTargetName}>{activityItem.targetName}</Text>
                                ) : null}
                                {activityItem.rating !== null ? (
                                    <Text style={styles.activityRatingText}>
                                        {activityItem.rating}/5 {getStars(activityItem.rating)}
                                    </Text>
                                ) : null}
                                <Text style={styles.readOnlyValue}>{activityItem.text}</Text>
                            </View>
                        ))
                    )}
                </View>
            ) : null}
            </ScrollView>

            <Modal
                visible={editingActivity !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() =>
                {
                    if (!isSavingActivityEdit)
                    {
                        setEditingActivity(null);
                    }
                }}
            >
                <View style={styles.editModalOverlay}>
                    <View style={styles.editModalCard}>
                        <Text style={styles.editModalTitle}>
                            {editingActivity?.type === "post" ? "Edit post" : "Edit review"}
                        </Text>

                        {editingActivity && editingActivity.type !== "post" ? (
                            <>
                                <View style={styles.editReviewStarsRow}>
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <Pressable
                                            key={value}
                                            style={styles.editReviewStarButton}
                                            onPress={() => setEditingActivityRating(value)}
                                            disabled={isSavingActivityEdit}
                                        >
                                            <Text
                                                style={[
                                                    styles.editReviewStar,
                                                    value <= editingActivityRating ? styles.editReviewStarActive : null,
                                                ]}
                                            >
                                                ★
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                <SelectDropdown
                                    options={[...reviewVisibilityOptions]}
                                    selectedValue={editingActivityVisibility}
                                    onValueChange={(nextValue) =>
                                    {
                                        setEditingActivityVisibility(nextValue as ReviewVisibilityValue);
                                    }}
                                />
                            </>
                        ) : null}

                        <TextInput
                            value={editingActivityText}
                            onChangeText={setEditingActivityText}
                            multiline={true}
                            editable={!isSavingActivityEdit}
                            style={styles.editModalInput}
                        />

                        <View style={styles.editModalButtonRow}>
                            <Pressable
                                style={[styles.secondaryButton, styles.editModalButtonHalf]}
                                disabled={isSavingActivityEdit}
                                onPress={() =>
                                {
                                    setEditingActivity(null);
                                }}
                            >
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.saveButton,
                                    styles.editModalButtonHalf,
                                    isSavingActivityEdit ? styles.saveButtonDisabled : null,
                                ]}
                                disabled={isSavingActivityEdit}
                                onPress={() =>
                                {
                                    void handleSaveActivityEdit();
                                }}
                            >
                                {isSavingActivityEdit ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {isFollowListVisible ? (
                <>
                    <Pressable
                        style={styles.followListDismissLayer}
                        onPress={handleCloseFollowList}
                    >
                        <Animated.View
                            style={[
                                styles.followListDismissTint,
                                {
                                    opacity: followListBackdropOpacity,
                                },
                            ]}
                        />
                    </Pressable>

                    <Animated.View
                        style={[
                            styles.followListPanel,
                            {
                                transform: [
                                    {
                                        translateX: followListPanelTranslateX,
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.followListHeaderRow}>
                            <Pressable
                                style={styles.followListBackButton}
                                onPress={handleCloseFollowList}
                            >
                                <View style={styles.backChevronWrap}>
                                    <View style={[styles.backChevronLine, styles.backChevronLineTop]} />
                                    <View style={[styles.backChevronLine, styles.backChevronLineBottom]} />
                                </View>
                            </Pressable>
                            <View style={styles.usernameValueRow}>
                                <Text style={styles.followListHeaderTitle}>
                                    {username ? `@${username}` : "@unknown"}
                                </Text>
                                {isVerified && username ? <VerifiedBadge /> : null}
                            </View>
                            <View style={styles.followListHeaderSpacer} />
                        </View>

                        <View
                            style={styles.followListTabRow}
                            onLayout={(event) => setFollowListTabRowWidth(event.nativeEvent.layout.width)}
                        >
                            <Pressable
                                style={[
                                    styles.followListTabButton,
                                    activeFollowListType === "followers" ? styles.followListTabButtonActive : null,
                                ]}
                                onPress={() => handleSwitchFollowList("followers")}
                            >
                                <Text
                                    style={[
                                        styles.followListTabText,
                                        activeFollowListType === "followers" ? styles.followListTabTextActive : null,
                                    ]}
                                >
                                    {followersCount} Followers
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.followListTabButton,
                                    activeFollowListType === "following" ? styles.followListTabButtonActive : null,
                                ]}
                                onPress={() => handleSwitchFollowList("following")}
                            >
                                <Text
                                    style={[
                                        styles.followListTabText,
                                        activeFollowListType === "following" ? styles.followListTabTextActive : null,
                                    ]}
                                >
                                    {followingCount} Following
                                </Text>
                            </Pressable>

                            {followListTabRowWidth > 0 ? (
                                <Animated.View
                                    style={[
                                        styles.followListTabIndicator,
                                        {
                                            width: followListTabRowWidth / 2,
                                            transform: [
                                                {
                                                    translateX: followTabIndicatorTranslateX,
                                                },
                                            ],
                                        },
                                    ]}
                                />
                            ) : null}
                        </View>

                        {isFollowListLoading ? (
                            <View style={styles.modalLoadingWrap}>
                                <ActivityIndicator size="small" />
                            </View>
                        ) : null}

                        {!isFollowListLoading && followListErrorMessage ? (
                            <Text style={styles.errorText}>{followListErrorMessage}</Text>
                        ) : null}

                        {!isFollowListLoading && !followListErrorMessage ? (
                            <FlatList
                                data={followListUsers}
                                keyExtractor={(entry) => `${activeFollowListType}-${entry.userId}`}
                                contentContainerStyle={styles.followListContent}
                                ListEmptyComponent={
                                    <Text style={styles.emptyListLabel}>No accounts yet.</Text>
                                }
                                renderItem={
                                    ({ item }) =>
                                    {
                                        const listInitials = item.username
                                            ? item.username.slice(0, 2).toUpperCase()
                                            : "?";
                                        return (
                                            <Pressable
                                                style={styles.followListRow}
                                                onPress={() => handleOpenProfileFromFollowList(item.userId)}
                                            >
                                                <View style={styles.followListAvatar}>
                                                    {item.profilePhoto ? (
                                                        <Image
                                                            source={{ uri: item.profilePhoto }}
                                                            style={styles.followListAvatarImage}
                                                        />
                                                    ) : (
                                                        <Text style={styles.followListAvatarInitials}>
                                                            {listInitials}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View style={styles.usernameValueRow}>
                                                    <Text style={styles.followListUsername}>
                                                        {item.username ? `@${item.username}` : "@unknown"}
                                                    </Text>
                                                    {item.isVerified && item.username ? <VerifiedBadge /> : null}
                                                </View>
                                            </Pressable>
                                        );
                                    }
                                }
                            />
                        ) : null}
                    </Animated.View>
                </>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    reminderLoadingRow:
    {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    reminderSettingsList:
    {
        gap: 10,
        marginBottom: 8,
    },
    reminderSettingRow:
    {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#ffffff",
    },
    reminderSettingLabel:
    {
        fontSize: 14,
        color: "#0f172a",
        fontWeight: "600",
    },
    interestTagChipRow:
    {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 10,
    },
    interestTagChip:
    {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#93c5fd",
        backgroundColor: "#dbeafe",
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    interestTagChipText:
    {
        fontSize: 12,
        fontWeight: "700",
        color: "#1d4ed8",
    },
    interestSuggestionList:
    {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#d9dee5",
        backgroundColor: "#ffffff",
        marginBottom: 8,
        overflow: "hidden",
    },
    interestSuggestionRow:
    {
        minHeight: 38,
        justifyContent: "center",
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eef2f7",
    },
    interestSuggestionLabel:
    {
        fontSize: 13,
        color: "#334155",
        fontWeight: "600",
    },
    content:
    {
        alignItems: "center",
        paddingTop: 28,
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    loadingContainer:
    {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
    },
    avatarPlaceholder:
    {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: "#dbeafe",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#bfdbfe",
    },
    avatarText:
    {
        fontSize: 28,
        fontWeight: "700",
        color: "#1d4ed8",
    },
    avatarImage:
    {
        width: "100%",
        height: "100%",
        borderRadius: 42,
    },
    title:
    {
        fontSize: 22,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 6,
    },
    meta:
    {
        fontSize: 14,
        color: "#475569",
        textAlign: "center",
        marginBottom: 12,
    },
    statsRow:
    {
        width: "100%",
        flexDirection: "row",
        columnGap: 10,
        marginBottom: 10,
    },
    statCard:
    {
        flex: 1,
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 10,
        backgroundColor: "#ffffff",
        alignItems: "center",
        paddingVertical: 10,
    },
    statCount:
    {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    statLabel:
    {
        marginTop: 2,
        fontSize: 12,
        color: "#64748b",
        fontWeight: "600",
    },
    followButton:
    {
        width: "100%",
        minHeight: 44,
        borderRadius: 10,
        backgroundColor: "#1d4ed8",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    followingButton:
    {
        backgroundColor: "#475569",
    },
    followButtonText:
    {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
    },
    followListDismissLayer:
    {
        ...StyleSheet.absoluteFillObject,
    },
    followListDismissTint:
    {
        flex: 1,
        backgroundColor: "#0f172a",
    },
    followListPanel:
    {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: "100%",
        backgroundColor: "#ffffff",
        paddingTop: 18,
    },
    followListHeaderRow:
    {
        paddingHorizontal: 16,
        minHeight: 40,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    followListBackButton:
    {
        width: 36,
        minHeight: 36,
        justifyContent: "center",
        alignItems: "flex-start",
    },
    backChevronWrap:
    {
        width: 14,
        height: 14,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    backChevronLine:
    {
        position: "absolute",
        width: 10,
        height: 2,
        borderRadius: 2,
        backgroundColor: "#0f172a",
        left: 1,
    },
    backChevronLineTop:
    {
        transform: [{ rotate: "-45deg" }],
        top: 3,
    },
    backChevronLineBottom:
    {
        transform: [{ rotate: "45deg" }],
        bottom: 3,
    },
    followListHeaderTitle:
    {
        fontSize: 19,
        color: "#0f172a",
        fontWeight: "700",
    },
    usernameValueRow:
    {
        flexDirection: "row",
        alignItems: "center",
        columnGap: 6,
        flexShrink: 1,
    },
    followListHeaderSpacer:
    {
        width: 36,
    },
    followListTabRow:
    {
        position: "relative",
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        marginBottom: 8,
    },
    followListTabButton:
    {
        flex: 1,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    followListTabButtonActive:
    {
        borderBottomWidth: 2,
        borderBottomColor: "#0f172a",
    },
    followListTabText:
    {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "600",
    },
    followListTabTextActive:
    {
        color: "#0f172a",
    },
    followListTabIndicator:
    {
        position: "absolute",
        bottom: -1,
        left: 0,
        height: 2,
        backgroundColor: "#0f172a",
    },
    modalLoadingWrap:
    {
        paddingVertical: 24,
        alignItems: "center",
    },
    followListContent:
    {
        paddingHorizontal: 12,
        paddingBottom: 16,
    },
    emptyListLabel:
    {
        fontSize: 13,
        color: "#64748b",
        marginTop: 6,
    },
    followListRow:
    {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    followListAvatar:
    {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#dbeafe",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        overflow: "hidden",
    },
    followListAvatarImage:
    {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    followListAvatarInitials:
    {
        fontSize: 13,
        fontWeight: "700",
        color: "#1d4ed8",
    },
    followListUsername:
    {
        fontSize: 14,
        color: "#0f172a",
        fontWeight: "600",
    },
    verifiedBadge:
    {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#1d4ed8",
        alignItems: "center",
        justifyContent: "center",
    },
    verifiedBadgeText:
    {
        color: "#ffffff",
        fontSize: 10,
        fontWeight: "700",
        lineHeight: 10,
    },
    panel:
    {
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginTop: 12,
    },
    sectionTitle:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 10,
    },
    activityRow:
    {
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        paddingTop: 10,
        marginTop: 10,
    },
    activityHeaderRow:
    {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
    },
    activityMenuButton:
    {
        width: 28,
        minHeight: 28,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 14,
    },
    activityMetaText:
    {
        fontSize: 12,
        color: "#64748b",
    },
    activityTargetName:
    {
        fontSize: 13,
        color: "#334155",
        fontWeight: "700",
        marginBottom: 4,
    },
    activityRatingText:
    {
        fontSize: 13,
        color: "#f59e0b",
        marginBottom: 4,
    },
    readOnlyRow:
    {
        marginBottom: 12,
    },
    readOnlyLabel:
    {
        fontSize: 13,
        color: "#334155",
        marginBottom: 4,
        fontWeight: "600",
    },
    readOnlyValue:
    {
        fontSize: 14,
        color: "#0f172a",
        lineHeight: 20,
    },
    label:
    {
        fontSize: 13,
        color: "#334155",
        marginBottom: 6,
        fontWeight: "600",
    },
    input:
    {
        minHeight: 44,
        borderWidth: 1,
        borderColor: "#d4dce8",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        marginBottom: 12,
        fontSize: 14,
    },
    photoActionRow:
    {
        flexDirection: "row",
        columnGap: 10,
        marginBottom: 8,
    },
    photoHint:
    {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 10,
    },
    textArea:
    {
        minHeight: 88,
        textAlignVertical: "top",
    },
    errorText:
    {
        color: "#b91c1c",
        fontSize: 13,
        marginBottom: 10,
    },
    successText:
    {
        color: "#047857",
        fontSize: 13,
        marginBottom: 10,
    },
    actionRow:
    {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        columnGap: 12,
        marginTop: 4,
    },
    secondaryButton:
    {
        minHeight: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
        backgroundColor: "#ffffff",
    },
    secondaryButtonText:
    {
        color: "#0f172a",
        fontSize: 14,
        fontWeight: "600",
    },
    saveButton:
    {
        flex: 1,
        minHeight: 44,
        borderRadius: 10,
        backgroundColor: "#0f766e",
        justifyContent: "center",
        alignItems: "center",
    },
    saveButtonDisabled:
    {
        opacity: 0.7,
    },
    saveButtonText:
    {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700",
    },
    editModalOverlay:
    {
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    editModalCard:
    {
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        padding: 16,
    },
    editModalTitle:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 10,
    },
    editModalInput:
    {
        minHeight: 110,
        borderWidth: 1,
        borderColor: "#d4dce8",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        textAlignVertical: "top",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        fontSize: 14,
        marginTop: 10,
    },
    editModalButtonRow:
    {
        flexDirection: "row",
        columnGap: 10,
        marginTop: 12,
    },
    editModalButtonHalf:
    {
        flex: 1,
    },
    editReviewStarsRow:
    {
        flexDirection: "row",
        marginBottom: 10,
    },
    editReviewStarButton:
    {
        marginRight: 6,
        minHeight: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    editReviewStar:
    {
        fontSize: 24,
        color: "#cbd5e1",
    },
    editReviewStarActive:
    {
        color: "#f59e0b",
    },
});
