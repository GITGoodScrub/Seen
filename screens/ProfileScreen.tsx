import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
    AuthSession,
    FollowListType,
    FollowUser,
    loadFollowUsers,
    loadFollowSnapshot,
    ProfileActivityItem,
    ProfileRecord,
    getErrorMessageFromUnknown,
    getUsernameValidationMessage,
    loadProfileByUserId,
    saveMyProfile,
    setCurrentUsername,
    toggleFollowUser,
} from "../Services";

type ProfileScreenProps = {
    authSession: AuthSession;
    profileUserId?: number | null;
    isEditing?: boolean;
    onOpenProfilePress?: (profileUserId: number) => void;
    onStartEditing?: () => void;
    onStopEditing?: () => void;
    onSessionUpdate?: (nextSession: AuthSession) => void;
};

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
    const [isFollowListLoading, setIsFollowListLoading] = useState(false);
    const [followListErrorMessage, setFollowListErrorMessage] = useState<string | null>(null);
    const [followListUsers, setFollowListUsers] = useState<FollowUser[]>([]);
    const [profileActivity, setProfileActivity] = useState<ProfileActivityItem[]>([]);
    const [followListTabRowWidth, setFollowListTabRowWidth] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [followErrorMessage, setFollowErrorMessage] = useState<string | null>(null);
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

            <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Posts & Reviews</Text>
                {profileActivity.length === 0 ? (
                    <Text style={styles.readOnlyValue}>No activity yet.</Text>
                ) : (
                    profileActivity.map((activityItem) => (
                        <View key={activityItem.id} style={styles.activityRow}>
                            <Text style={styles.activityMetaText}>
                                {getActivityTypeLabel(activityItem.type)}
                                {" · "}
                                {formatActivityDate(activityItem.createdAt)}
                            </Text>
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
            </ScrollView>

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
    activityMetaText:
    {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 4,
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
});
