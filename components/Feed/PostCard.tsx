import { StyleSheet, Text, View } from "react-native";

type PostCardProps = {
    authorName: string;
    bodyText: string;
};

export const PostCard = (
    {
        authorName,
        bodyText,
    }: PostCardProps,
) =>
{
    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.avatarPlaceholder} />
                <View>
                    <Text style={styles.authorName}>{authorName}</Text>
                    <Text style={styles.meta}>Just now</Text>
                </View>
            </View>

            <Text style={styles.bodyText}>{bodyText}</Text>

            <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>Placeholder image</Text>
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
        marginBottom: 10,
    },
    avatarPlaceholder:
    {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#cbd5e1",
        marginRight: 10,
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
        marginBottom: 12,
    },
    imagePlaceholder:
    {
        height: 140,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#e2e8f0",
        alignItems: "center",
        justifyContent: "center",
    },
    imagePlaceholderText:
    {
        fontSize: 13,
        color: "#475569",
    },
});