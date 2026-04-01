import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    PostComment,
    createPostComment,
    getErrorMessageFromUnknown,
    loadPostComments,
} from "../../Services";

type CommentsSheetProps = {
    postId: number | null;
    onClose: () => void;
    onCommentAdded?: (postId: number) => void;
};

export const CommentsSheet = (
    {
        postId,
        onClose,
        onCommentAdded,
    }: CommentsSheetProps,
) =>
{
    const [comments, setComments] = useState<PostComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(
        () =>
        {
            if (postId === null)
            {
                return;
            }

            setComments([]);
            setErrorMessage(null);
            setIsLoading(true);

            loadPostComments(postId)
                .then(setComments)
                .catch((e: unknown) =>
                {
                    setErrorMessage(getErrorMessageFromUnknown(e));
                })
                .finally(() =>
                {
                    setIsLoading(false);
                });
        },
        [postId],
    );

    const handleSubmit = useCallback(
        async (): Promise<void> =>
        {
            if (postId === null || inputText.trim() === "" || isSubmitting)
            {
                return;
            }

            setIsSubmitting(true);
            setErrorMessage(null);

            try
            {
                const newComment = await createPostComment(postId, inputText.trim());
                setComments((prev) => [...prev, newComment]);
                setInputText("");
                onCommentAdded?.(postId);
            }
            catch (caughtError)
            {
                setErrorMessage(getErrorMessageFromUnknown(caughtError));
            }
            finally
            {
                setIsSubmitting(false);
            }
        },
        [postId, inputText, isSubmitting, onCommentAdded],
    );

    const isSendDisabled = inputText.trim() === "" || isSubmitting;

    return (
        <Modal
            visible={postId !== null}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={styles.sheet}>
                        <View style={styles.handle} />

                        <View style={styles.header}>
                            <Text style={styles.title}>Comments</Text>
                            <Pressable style={styles.closeButton} onPress={onClose}>
                                <Text style={styles.closeLabel}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.list}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#1d4ed8" style={styles.loader} />
                            ) : comments.length === 0 ? (
                                <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                            ) : (
                                comments.map(
                                    (comment) => (
                                        <View key={comment.id} style={styles.commentItem}>
                                            <Text style={styles.commentAuthor}>
                                                {comment.authorUsername ? `@${comment.authorUsername}` : "Someone"}
                                            </Text>
                                            <Text style={styles.commentText}>{comment.text}</Text>
                                        </View>
                                    ),
                                )
                            )}
                        </ScrollView>

                        {errorMessage ? (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        ) : null}

                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.textInput}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Add a comment..."
                                placeholderTextColor="#94a3b8"
                                editable={!isSubmitting}
                                returnKeyType="send"
                                onSubmitEditing={() =>
                                {
                                    void handleSubmit();
                                }}
                            />

                            <Pressable
                                style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
                                disabled={isSendDisabled}
                                onPress={() =>
                                {
                                    void handleSubmit();
                                }}
                            >
                                {isSubmitting
                                    ? <ActivityIndicator size="small" color="#ffffff" />
                                    : <Text style={styles.sendLabel}>Post</Text>
                                }
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create(
{
    overlay:
    {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    backdrop:
    {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    sheet:
    {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
        maxHeight: "80%",
    },
    handle:
    {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#cbd5e1",
        alignSelf: "center",
        marginTop: 10,
        marginBottom: 4,
    },
    header:
    {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    title:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
    },
    closeButton:
    {
        padding: 4,
    },
    closeLabel:
    {
        fontSize: 16,
        color: "#64748b",
    },
    list:
    {
        flexShrink: 1,
    },
    listContent:
    {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
        minHeight: 80,
    },
    loader:
    {
        marginTop: 16,
    },
    emptyText:
    {
        textAlign: "center",
        color: "#64748b",
        fontSize: 14,
        marginTop: 20,
    },
    commentItem:
    {
        marginBottom: 14,
    },
    commentAuthor:
    {
        fontSize: 13,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 2,
    },
    commentText:
    {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
    },
    errorText:
    {
        fontSize: 13,
        color: "#ef4444",
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    inputRow:
    {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        gap: 8,
    },
    textInput:
    {
        flex: 1,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#d9dee5",
        paddingHorizontal: 14,
        fontSize: 14,
        color: "#0f172a",
        backgroundColor: "#f8fafc",
    },
    sendButton:
    {
        height: 40,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#1d4ed8",
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonDisabled:
    {
        backgroundColor: "#bfdbfe",
    },
    sendLabel:
    {
        fontSize: 14,
        fontWeight: "600",
        color: "#ffffff",
    },
});
