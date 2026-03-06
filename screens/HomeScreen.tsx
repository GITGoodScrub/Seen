import { StyleSheet, Text, View } from "react-native";
import { FeedSearchBar, PostCard } from "../components";

export const HomeScreen = () =>
{
    return (
        <View style={styles.container}>
            <FeedSearchBar
                placeholderText="Search people, venues, and posts"
            />

            <Text style={styles.sectionTitle}>Feed</Text>

            <PostCard
                authorName="Seen Placeholder"
                bodyText="Placeholder for actual posts in the future."
            />
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
});
