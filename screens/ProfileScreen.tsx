import { StyleSheet, Text, View } from "react-native";

export const ProfileScreen = () =>
{
    return (
        <View style={styles.container}>
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>SE</Text>
            </View>

            <Text style={styles.name}>Seen User</Text>
            <Text style={styles.meta}>Profile skeleton ready for account, settings, and preferences.</Text>

            <View style={styles.panel}>
                <Text style={styles.panelTitle}>Profile Modules</Text>
                <Text style={styles.panelItem}>- Account settings</Text>
                <Text style={styles.panelItem}>- Notification preferences</Text>
                <Text style={styles.panelItem}>- Saved events</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        alignItems: "center",
        paddingTop: 28,
        paddingHorizontal: 20,
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
    name:
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
    panelTitle:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 10,
    },
    panelItem:
    {
        fontSize: 14,
        color: "#334155",
        marginBottom: 6,
    },
});
