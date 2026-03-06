import { Pressable, StyleSheet, Text, View } from "react-native";

type FeedSearchBarProps = {
    placeholderText?: string;
    onPress?: () => void;
};

export const FeedSearchBar = (
    {
        placeholderText = "Search",
        onPress,
    }: FeedSearchBarProps,
) =>
{
    return (
        <View style={styles.card}>
            <Pressable
                style={styles.searchShell}
                onPress={onPress}
            >
                <View style={styles.searchIconCircle} />
                <View style={styles.searchIconHandle} />
                <Text style={styles.placeholderText}>{placeholderText}</Text>
            </Pressable>
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
    searchShell:
    {
        height: 40,
        borderWidth: 1,
        borderColor: "#d0d7e2",
        borderRadius: 20,
        backgroundColor: "#f8fafc",
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
    },
    searchIconCircle:
    {
        width: 12,
        height: 12,
        borderWidth: 2,
        borderColor: "#64748b",
        borderRadius: 6,
        marginRight: 6,
    },
    searchIconHandle:
    {
        width: 7,
        height: 2,
        backgroundColor: "#64748b",
        borderRadius: 2,
        transform: [{ rotate: "45deg" }],
        marginRight: 10,
        marginTop: 6,
        marginLeft: -2,
    },
    placeholderText:
    {
        fontSize: 14,
        color: "#64748b",
    },
});