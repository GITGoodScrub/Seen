import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    AuthSession,
    ProfileRecord,
    getErrorMessageFromUnknown,
    getUsernameValidationMessage,
    loadProfileByUserId,
    saveMyProfile,
    setCurrentUsername,
} from "../Services";

type ProfileScreenProps = {
    authSession: AuthSession;
    isEditing?: boolean;
    onStartEditing?: () => void;
    onStopEditing?: () => void;
    onSessionUpdate?: (nextSession: AuthSession) => void;
};

const safeString = (value: string | null | undefined): string =>
{
    return value ?? "";
};

export const ProfileScreen = (
    {
        authSession,
        isEditing = false,
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
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(
        () =>
        {
            let isCancelled = false;

            const loadProfile = async (): Promise<void> =>
            {
                setIsLoadingProfile(true);

                try
                {
                    const profile = await loadProfileByUserId(authSession.user.id);

                    if (isCancelled)
                    {
                        return;
                    }

                    setUsername(safeString(profile.username));
                    setDisplayName(safeString(profile.displayName));
                    setBio(safeString(profile.bio));
                    setProfilePhoto(safeString(profile.profilePhoto));
                    setErrorMessage(null);
                }
                catch (caughtError)
                {
                    if (isCancelled)
                    {
                        return;
                    }

                    setErrorMessage(getErrorMessageFromUnknown(caughtError));
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
        [authSession.user.id],
    );

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
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <Text style={styles.title}>{isEditing ? "Edit Profile" : "Profile"}</Text>
            <Text style={styles.meta}>
                {isEditing ? "Update your public account details." : "Your public account details."}
            </Text>

            <View style={styles.panel}>
                {isEditing ? (
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

                        <Text style={styles.label}>Profile Photo URL</Text>
                        <TextInput
                            style={styles.input}
                            value={profilePhoto}
                            onChangeText={setProfilePhoto}
                            editable={!isSaving}
                            autoCapitalize="none"
                            placeholder="https://..."
                            placeholderTextColor="#94a3b8"
                        />

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
                            <Text style={styles.readOnlyValue}>{username || "-"}</Text>
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
                            <Text style={styles.readOnlyLabel}>Profile Photo URL</Text>
                            <Text style={styles.readOnlyValue}>{profilePhoto || "-"}</Text>
                        </View>

                        <Pressable
                            style={styles.secondaryButton}
                            onPress={onStartEditing}
                        >
                            <Text style={styles.secondaryButtonText}>Edit Profile</Text>
                        </Pressable>
                    </>
                )}
            </View>
        </ScrollView>
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
        marginBottom: 16,
    },
    panel:
    {
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
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
