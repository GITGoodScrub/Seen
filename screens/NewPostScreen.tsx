import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
    AuthSession,
    createPost,
    getErrorMessageFromUnknown,
} from "../Services";

type NewPostScreenProps = {
    authSession: AuthSession;
    onClose: () => void;
    onPostCreated?: () => void;
};

export const NewPostScreen = (
    {
        authSession,
        onClose,
        onPostCreated,
    }: NewPostScreenProps,
) =>
{
    const [postText, setPostText] = useState("");
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const displayName = useMemo(
        () =>
        {
            if (authSession.user.username)
            {
                return `@${authSession.user.username}`;
            }

            if (authSession.user.profile?.displayName)
            {
                return authSession.user.profile.displayName;
            }

            if (authSession.user.email)
            {
                return authSession.user.email;
            }

            return "You";
        },
        [authSession.user.email, authSession.user.profile?.displayName, authSession.user.username],
    );

    const isPostDisabled = postText.trim().length === 0 || isPosting;

    const handlePickPhoto = async (): Promise<void> =>
    {
        const permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResponse.granted)
        {
            setErrorMessage("Photo library permission is required to attach a photo.");
            return;
        }

        const pickResult = await ImagePicker.launchImageLibraryAsync(
            {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.6,
                base64: true,
            },
        );

        if (pickResult.canceled || pickResult.assets.length === 0)
        {
            return;
        }

        const selectedAsset = pickResult.assets[0];

        if (selectedAsset.base64)
        {
            const mimeType = selectedAsset.mimeType ?? "image/jpeg";
            setPhotoDataUrl(`data:${mimeType};base64,${selectedAsset.base64}`);
            setErrorMessage(null);
            return;
        }

        setPhotoDataUrl(selectedAsset.uri);
        setErrorMessage(null);
    };

    const handlePublishPost = async (): Promise<void> =>
    {
        if (isPostDisabled)
        {
            return;
        }

        setIsPosting(true);
        setErrorMessage(null);

        try
        {
            await createPost(
                {
                    text: postText,
                    photoURL: photoDataUrl ?? undefined,
                },
            );

            setPostText("");
            setPhotoDataUrl(null);
            onPostCreated?.();
            onClose();
        }
        catch (caughtError)
        {
            setErrorMessage(getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsPosting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <Pressable
                    style={styles.cancelButton}
                    disabled={isPosting}
                    onPress={onClose}
                >
                    <Text style={styles.cancelLabel}>Cancel</Text>
                </Pressable>

                <Text style={styles.title}>New Post</Text>

                <Pressable
                    style={styles.postButton}
                    disabled={isPostDisabled}
                    onPress={() =>
                    {
                        void handlePublishPost();
                    }}
                >
                    {isPosting ? <ActivityIndicator size="small" color="#1d4ed8" /> : <Text style={[styles.postLabel, isPostDisabled ? styles.postLabelDisabled : null]}>Post</Text>}
                </Pressable>
            </View>

            <View style={styles.composerCard}>
                <View style={styles.authorRow}>
                    <View style={styles.avatarPlaceholder} />
                    <View>
                        <Text style={styles.authorName}>{displayName}</Text>
                        <Text style={styles.authorMeta}>Share what you are seeing right now.</Text>
                    </View>
                </View>

                <TextInput
                    editable={!isPosting}
                    value={postText}
                    onChangeText={setPostText}
                    multiline={true}
                    placeholder="Write something..."
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                    maxLength={500}
                />

                <View style={styles.photoSection}>
                    <Pressable
                        style={styles.photoActionButton}
                        disabled={isPosting}
                        onPress={() =>
                        {
                            void handlePickPhoto();
                        }}
                    >
                        <Text style={styles.photoActionButtonLabel}>{photoDataUrl ? "Replace Photo" : "Attach Photo"}</Text>
                    </Pressable>

                    {photoDataUrl ? (
                        <View style={styles.selectedPhotoWrap}>
                            <Image
                                source={{ uri: photoDataUrl }}
                                style={styles.selectedPhoto}
                            />

                            <Pressable
                                style={styles.removePhotoButton}
                                disabled={isPosting}
                                onPress={() =>
                                {
                                    setPhotoDataUrl(null);
                                }}
                            >
                                <Text style={styles.removePhotoButtonLabel}>Remove photo</Text>
                            </Pressable>
                        </View>
                    ) : null}
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
        backgroundColor: "#f8fafc",
    },
    topRow:
    {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    cancelButton:
    {
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
    },
    cancelLabel:
    {
        fontSize: 16,
        color: "#1d4ed8",
        fontWeight: "600",
    },
    title:
    {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    postButton:
    {
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "flex-end",
    },
    postLabel:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#1d4ed8",
    },
    postLabelDisabled:
    {
        color: "#94a3b8",
    },
    composerCard:
    {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 12,
        padding: 14,
    },
    authorRow:
    {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    avatarPlaceholder:
    {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#cbd5e1",
        marginRight: 10,
    },
    authorName:
    {
        fontSize: 15,
        color: "#0f172a",
        fontWeight: "700",
        marginBottom: 2,
    },
    authorMeta:
    {
        fontSize: 12,
        color: "#64748b",
    },
    input:
    {
        minHeight: 120,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d0d7e2",
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: "#0f172a",
        textAlignVertical: "top",
        backgroundColor: "#f8fafc",
        marginBottom: 12,
    },
    photoSection:
    {
        marginTop: 4,
    },
    photoActionButton:
    {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#bfdbfe",
        backgroundColor: "#dbeafe",
        paddingHorizontal: 12,
        paddingVertical: 10,
        alignSelf: "flex-start",
    },
    photoActionButtonLabel:
    {
        fontSize: 13,
        color: "#1d4ed8",
        fontWeight: "700",
    },
    selectedPhotoWrap:
    {
        marginTop: 10,
    },
    selectedPhoto:
    {
        width: "100%",
        height: 190,
        borderRadius: 12,
        backgroundColor: "#e2e8f0",
    },
    removePhotoButton:
    {
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignSelf: "flex-start",
    },
    removePhotoButtonLabel:
    {
        fontSize: 13,
        color: "#b91c1c",
        fontWeight: "600",
    },
    errorText:
    {
        marginTop: 10,
        fontSize: 13,
        color: "#b91c1c",
    },
});