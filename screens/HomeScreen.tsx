import { StyleSheet, Text, View } from "react-native";

export const HomeScreen = () =>
{
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Seen</Text>
            <Text style={styles.subtitle}>
                This tab is the base Home shell. We can wire event feeds and featured cards here next.
            </Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Upcoming Work</Text>
                <Text style={styles.cardText}>- Event feed section</Text>
                <Text style={styles.cardText}>- Nearby venues module</Text>
                <Text style={styles.cardText}>- Featured artists highlights</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        backgroundColor: "#f8fafc",
    },
    title:
    {
        fontSize: 24,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 8,
    },
    subtitle:
    {
        fontSize: 14,
        lineHeight: 20,
        color: "#475569",
        marginBottom: 16,
    },
    card:
    {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    cardTitle:
    {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 10,
    },
    cardText:
    {
        fontSize: 14,
        color: "#334155",
        marginBottom: 6,
    },
});
