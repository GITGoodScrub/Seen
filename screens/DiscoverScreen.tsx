import { StyleSheet, Text, View } from "react-native";
import { FeedSearchBar } from "../components";

export const DiscoverScreen = () =>
{
    return (
        <View style={styles.container}>
            <FeedSearchBar
                placeholderText="Search people, venues, and posts"
            />

            <View style={styles.card}>
                <Text style={styles.title}>Discover</Text>
                <Text style={styles.bodyText}>Placeholder content for discover modules.</Text>
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
        paddingTop: 14,
        backgroundColor: "#f8fafc",
    },
    card:
    {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        padding: 14,
    },
    title:
    {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 8,
    },
    bodyText:
    {
        fontSize: 14,
        color: "#475569",
    },
});