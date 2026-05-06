import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PostCardProps = {
    authorName: string;
    bodyText: string;
    createdAt?: string;
    authorPhotoUrl?: string | null;
    postImageUrl?: string | null;
    onDelete?: () => void;
    onEdit?: () => void;
    likeCount?: number;
    isLikedByCurrentUser?: boolean;
    commentCount?: number;
    onLike?: () => void;
    onCommentPress?: () => void;
};

export const PostCard = (
    {
        authorName,
        bodyText,
        createdAt,
        authorPhotoUrl,
        postImageUrl,
        onDelete,
        onEdit,
        likeCount = 0,
        isLikedByCurrentUser = false,
        commentCount = 0,
        onLike,
        onCommentPress,
    }: PostCardProps,
) =>
{
    const displayDate = (() =>
    {
        if (!createdAt)
        {
            return "Unknown date";
        }

        const parsedDate = new Date(createdAt);
        if (Number.isNaN(parsedDate.getTime()))
        {
            return "Unknown date";
        }

        return parsedDate.toLocaleString(
            "en-GB",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            },
        );
    })();

    const handleMenuPress = (): void =>
    {
        const buttons: Parameters<typeof Alert.alert>[2] = [];

        if (onEdit)
        {
            buttons.push({ text: "Edit", onPress: onEdit });
        }

        if (onDelete)
        {
            buttons.push({ text: "Delete", style: "destructive", onPress: onDelete });
        }

        buttons.push({ text: "Cancel", style: "cancel" });

        Alert.alert("Post actions", undefined, buttons);
    };

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.authorInfo}>
                    {authorPhotoUrl ? (
                        <Image
                            source={{ uri: authorPhotoUrl }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder} />
                    )}
                    <View>
                        <Text style={styles.authorName}>{authorName}</Text>
                        <Text style={styles.meta}>{displayDate}</Text>
                    </View>
                </View>

                {(onDelete || onEdit) && (
                    <Pressable
                        style={styles.menuButton}
                        onPress={handleMenuPress}
                    >
                        <Ionicons name="ellipsis-horizontal" size={18} color="#64748b" />
                    </Pressable>
                )}
            </View>

            <Text style={styles.bodyText}>{bodyText}</Text>

            {postImageUrl ? (
                <View style={styles.postImageWrap}>
                    <Image
                        source={{ uri: postImageUrl }}
                        style={styles.postImage}
                        resizeMode="contain"
                    />
                </View>
            ) : null}
            <View style={styles.separator} />

            <View style={styles.actionRow}>
                <Pressable style={styles.actionButton} onPress={onLike}>
                    <Ionicons
                        name={isLikedByCurrentUser ? "heart" : "heart-outline"}
                        size={22}
                        color={isLikedByCurrentUser ? "#ef4444" : "#64748b"}
                    />
                    <Text style={styles.actionCount}>{likeCount}</Text>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={onCommentPress}>
                    <Ionicons
                        name="chatbubble-outline"
                        size={21}
                        color="#64748b"
                    />
                    <Text style={styles.actionCount}>{commentCount}</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(
{
    card:
    {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        padding: 14,
    },
    headerRow:
    {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    authorInfo:
    {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    menuButton:
    {
        paddingHorizontal: 2,
        paddingVertical: 2,
        marginTop: -2,
    },
    avatarPlaceholder:
    {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#cbd5e1",
        marginRight: 10,
    },
    avatarImage:
    {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        backgroundColor: "#cbd5e1",
    },
    authorName:
    {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
    },
    meta:
    {
        fontSize: 12,
        color: "#64748b",
    },
    bodyText:
    {
        fontSize: 14,
        lineHeight: 20,
        color: "#1f2937",
        marginBottom: 0,
    },
    postImageWrap:
    {
        height: 180,
        borderRadius: 12,
        backgroundColor: "#e2e8f0",
        marginTop: 10,
        overflow: "hidden",
    },
    postImage:
    {
        width: "100%",
        height: "100%",
    },
    separator:
    {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginTop: 10,
        marginBottom: 2,
    },
    actionRow:
    {
        flexDirection: "row",
        gap: 20,
        paddingTop: 8,
    },
    actionButton:
    {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    actionCount:
    {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "500",
    },
});