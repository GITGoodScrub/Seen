import { Pressable, StyleSheet, Text, View } from "react-native";

type RequestErrorStateProps = {
    message: string;
    onRetryPress: () => void;
};

export const RequestErrorState = (
    {
        message,
        onRetryPress,
    }: RequestErrorStateProps,
) =>
{
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Could not load data</Text>
            <Text style={styles.message}>{message}</Text>

            <Pressable
                style={styles.retryButton}
                onPress={onRetryPress}
            >
                <Text style={styles.retryLabel}>Try Again</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        marginTop: 10,
        backgroundColor: "#fff5f5",
        borderWidth: 1,
        borderColor: "#fecaca",
        borderRadius: 12,
        padding: 14,
    },
    title:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#7f1d1d",
        marginBottom: 6,
    },
    message:
    {
        fontSize: 13,
        lineHeight: 18,
        color: "#991b1b",
        marginBottom: 12,
    },
    retryButton:
    {
        alignSelf: "flex-start",
        backgroundColor: "#b91c1c",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    retryLabel:
    {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 13,
    },
});
