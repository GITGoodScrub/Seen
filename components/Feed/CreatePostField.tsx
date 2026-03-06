import { Pressable, StyleSheet, Text, View } from "react-native";

type CreatePostFieldProps = {
    placeholderText?: string;
    onPress?: () => void;
};

export const CreatePostField = (
    {
        placeholderText = "What's on your mind?",
        onPress,
    }: CreatePostFieldProps,
) =>
{
    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.avatarPlaceholder} />

                <Pressable
                    style={styles.inputShell}
                    onPress={onPress}
                >
                    <Text style={styles.inputText}>{placeholderText}</Text>
                </Pressable>

                <View style={styles.imageButton}>
                    <View style={styles.imageButtonInner} />
                </View>
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
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    row:
    {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarPlaceholder:
    {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#cbd5e1",
        marginRight: 10,
    },
    inputShell:
    {
        flex: 1,
        height: 38,
        borderWidth: 1,
        borderColor: "#d0d7e2",
        borderRadius: 19,
        justifyContent: "center",
        paddingHorizontal: 14,
        backgroundColor: "#f8fafc",
    },
    inputText:
    {
        fontSize: 14,
        color: "#64748b",
    },
    imageButton:
    {
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#d0d7e2",
        marginLeft: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
    },
    imageButtonInner:
    {
        width: 14,
        height: 10,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: "#64748b",
    },
});
