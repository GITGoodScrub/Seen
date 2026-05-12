import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { CommentsSheet, FeedSearchBar, PostCard } from "../components";
import {
    AuthSession,
    FeedPost,
    deletePost,
    getErrorMessageFromUnknown,
    loadFeedPosts,
    togglePostLike,
    updatePost,
} from "../Services";

type HomeScreenProps = {
    authSession: AuthSession;
    onSearchPress?: () => void;
    refreshKey?: number;
};

export const HomeScreen = (
    {
        authSession,
        onSearchPress,
        refreshKey = 0,
    }: HomeScreenProps,
) =>
{
    const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
    const [isLoading, setIsLoading] = useState(refreshKey === 0);
    const [isRefreshing, setIsRefreshing] = useState(refreshKey > 0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [openCommentsForPostId, setOpenCommentsForPostId] = useState<number | null>(null);
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editingPostText, setEditingPostText] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const loadPosts = useCallback(
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
                const posts = await loadFeedPosts();
                setFeedPosts(posts);
            }
            catch (caughtError)
            {
                setFeedPosts([]);
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
        [],
    );

    const handleRefresh = useCallback(
        (): void =>
        {
            void loadPosts(true);
        },
        [loadPosts],
    );

    const handleLikePress = useCallback(
        (postId: number): void =>
        {
            setFeedPosts((current) =>
                current.map((p) =>
                {
                    if (p.id !== postId) return p;
                    const newLiked = !p.isLikedByCurrentUser;
                    return {
                        ...p,
                        isLikedByCurrentUser: newLiked,
                        likeCount: newLiked ? p.likeCount + 1 : p.likeCount - 1,
                    };
                }),
            );

            togglePostLike(postId).catch(
                () =>
                {
                    setFeedPosts((current) =>
                        current.map((p) =>
                        {
                            if (p.id !== postId) return p;
                            const reverted = !p.isLikedByCurrentUser;
                            return {
                                ...p,
                                isLikedByCurrentUser: reverted,
                                likeCount: reverted ? p.likeCount + 1 : p.likeCount - 1,
                            };
                        }),
                    );
                },
            );
        },
        [],
    );

    const handleCommentAdded = useCallback(
        (postId: number): void =>
        {
            setFeedPosts((current) =>
                current.map((p) =>
                    p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
                ),
            );
        },
        [],
    );

    useEffect(
        () =>
        {
            void loadPosts();
        },
        [loadPosts],
    );

    const handleSaveEdit = async (): Promise<void> =>
    {
        if (editingPostId === null) return;

        const trimmedText = editingPostText.trim();
        if (trimmedText.length === 0)
        {
            Alert.alert("Empty post", "Post text cannot be empty.");
            return;
        }

        setIsSavingEdit(true);

        try
        {
            await updatePost(editingPostId, trimmedText);
            setFeedPosts((current) =>
                current.map((p) =>
                    p.id === editingPostId ? { ...p, text: trimmedText } : p,
                ),
            );
            setEditingPostId(null);
        }
        catch (caughtError)
        {
            Alert.alert("Error", getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsSavingEdit(false);
        }
    };

    const fallbackAuthor = authSession.user.username ? `@${authSession.user.username}` : "You";

    return (
        <View style={styles.container}>
            <FeedSearchBar
                placeholderText="Search people, venues, and posts"
                onPress={onSearchPress}
            />

            <Text style={styles.sectionTitle}>Feed</Text>

            <ScrollView
                contentContainerStyle={styles.feedList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor="#1d4ed8"
                    />
                }
            >
                {isLoading ? (
                    <View style={styles.centerStateWrap}>
                        <ActivityIndicator size="small" color="#1d4ed8" />
                        <Text style={styles.helperText}>Loading your feed...</Text>
                    </View>
                ) : errorMessage ? (
                    <View style={styles.centerStateWrap}>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                        <Pressable
                            style={styles.retryButton}
                            onPress={() =>
                            {
                                void loadPosts();
                            }}
                        >
                            <Text style={styles.retryButtonLabel}>Try again</Text>
                        </Pressable>
                    </View>
                ) : feedPosts.length === 0 ? (
                    <View style={styles.centerStateWrap}>
                        <Text style={styles.emptyTitle}>No posts in your feed yet.</Text>
                        <Text style={styles.helperText}>Follow people to see their posts. For now, we only show your posts and posts from accounts you follow.</Text>
                    </View>
                ) : (
                    feedPosts.map(
                        (post) =>
                        {
                            const isOwnPost = post.authorUserId === authSession.user.id;

                            const handleDelete = isOwnPost
                                ? (): void =>
                                {
                                    setFeedPosts((current) => current.filter((p) => p.id !== post.id));
                                    deletePost(post.id).catch(
                                        (caughtError) =>
                                        {
                                            setFeedPosts((current) => [post, ...current.filter((p) => p.id !== post.id)]);
                                            Alert.alert("Error", getErrorMessageFromUnknown(caughtError));
                                        },
                                    );
                                }
                                : undefined;

                            const handleEdit = isOwnPost
                                ? (): void =>
                                {
                                    setEditingPostId(post.id);
                                    setEditingPostText(post.text);
                                }
                                : undefined;

                            return (
                                <PostCard
                                    key={post.id}
                                    authorName={post.username ? `@${post.username}` : fallbackAuthor}
                                    bodyText={post.text}
                                    createdAt={post.createdAt}
                                    authorPhotoUrl={post.authorProfilePhoto}
                                    postImageUrl={post.photoURL}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                    likeCount={post.likeCount}
                                    isLikedByCurrentUser={post.isLikedByCurrentUser}
                                    commentCount={post.commentCount}
                                    onLike={() =>
                                    {
                                        handleLikePress(post.id);
                                    }}
                                    onCommentPress={() =>
                                    {
                                        setOpenCommentsForPostId(post.id);
                                    }}
                                />
                            );
                        },
                    )
                )}
            </ScrollView>
            <CommentsSheet
                postId={openCommentsForPostId}
                onClose={() =>
                {
                    setOpenCommentsForPostId(null);
                }}
                onCommentAdded={handleCommentAdded}
            />

            <Modal
                visible={editingPostId !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => { setEditingPostId(null); }}
            >
                <View style={styles.editModalOverlay}>
                    <View style={styles.editModalCard}>
                        <Text style={styles.editModalTitle}>Edit post</Text>
                        <TextInput
                            value={editingPostText}
                            onChangeText={setEditingPostText}
                            editable={!isSavingEdit}
                            multiline={true}
                            style={styles.editModalInput}
                            autoFocus={true}
                        />
                        <View style={styles.editModalButtons}>
                            <Pressable
                                style={[styles.editModalButton, styles.editModalCancelButton]}
                                onPress={() => { setEditingPostId(null); }}
                                disabled={isSavingEdit}
                            >
                                <Text style={styles.editModalCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.editModalButton, styles.editModalSaveButton]}
                                onPress={() => { void handleSaveEdit(); }}
                                disabled={isSavingEdit}
                            >
                                <Text style={styles.editModalSaveText}>
                                    {isSavingEdit ? "Saving..." : "Save"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 14,
        backgroundColor: "#f8fafc",
    },
    sectionTitle:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 12,
        marginTop: 2,
    },
    feedList:
    {
        paddingBottom: 20,
        gap: 10,
    },
    centerStateWrap:
    {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 18,
        alignItems: "center",
    },
    emptyTitle:
    {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 6,
        textAlign: "center",
    },
    helperText:
    {
        fontSize: 13,
        color: "#475569",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 18,
    },
    errorText:
    {
        fontSize: 13,
        color: "#b91c1c",
        textAlign: "center",
        marginBottom: 8,
    },
    retryButton:
    {
        marginTop: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#dbeafe",
    },
    retryButtonLabel:
    {
        fontSize: 13,
        fontWeight: "700",
        color: "#1d4ed8",
    },
    editModalOverlay:
    {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    editModalCard:
    {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 20,
        width: "100%",
    },
    editModalTitle:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 12,
    },
    editModalInput:
    {
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: "#0f172a",
        minHeight: 90,
        textAlignVertical: "top",
    },
    editModalButtons:
    {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    editModalButton:
    {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    editModalCancelButton:
    {
        backgroundColor: "#f1f5f9",
    },
    editModalSaveButton:
    {
        backgroundColor: "#6366f1",
    },
    editModalCancelText:
    {
        fontSize: 14,
        fontWeight: "600",
        color: "#475569",
    },
    editModalSaveText:
    {
        fontSize: 14,
        fontWeight: "600",
        color: "#ffffff",
    },
});
