import { StyleSheet, Text, View } from "react-native";

type ToastBannerProps = {
    message: string;
};

export const ToastBanner = ({ message }: ToastBannerProps) =>
{
    return (
        <View pointerEvents="none" style={styles.container}>
            <View style={styles.toast}>
                <Text style={styles.message}>{message}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 20,
        alignItems: "center",
        zIndex: 20,
    },
    toast: {
        backgroundColor: "#0f172a",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: "90%",
        borderWidth: 1,
        borderColor: "#1e293b",
    },
    message: {
        color: "#f8fafc",
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
    },
});
