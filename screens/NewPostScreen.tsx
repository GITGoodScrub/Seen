import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type NewPostScreenProps = {
    onClose: () => void;
};

export const NewPostScreen = (
    { onClose }: NewPostScreenProps,
) =>
{
    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <Pressable
                    style={styles.cancelButton}
                    onPress={onClose}
                >
                    <Text style={styles.cancelLabel}>Cancel</Text>
                </Pressable>

                <Text style={styles.title}>New Post</Text>

                <View style={styles.postButtonPlaceholder}>
                    <Text style={styles.postLabel}>Post</Text>
                </View>
            </View>

            <View style={styles.composerCard}>
                <View style={styles.authorRow}>
                    <View style={styles.avatarPlaceholder} />
                    <View>
                        <Text style={styles.authorName}>You</Text>
                        <Text style={styles.authorMeta}>Posting is disabled until auth is connected.</Text>
                    </View>
                </View>

                <TextInput
                    editable={false}
                    multiline={true}
                    placeholder="Write something..."
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                />

                <View style={styles.mediaPlaceholder}>
                    <Text style={styles.mediaPlaceholderLabel}>Media picker placeholder</Text>
                </View>
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
    postButtonPlaceholder:
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
    mediaPlaceholder:
    {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#d0d7e2",
        height: 100,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f1f5f9",
    },
    mediaPlaceholderLabel:
    {
        fontSize: 13,
        color: "#64748b",
    },
});