import { Pressable, StyleSheet, Text, View } from "react-native";
import { useDarkMode } from "../../Services";

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
    const { theme } = useDarkMode();

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable
                style={[styles.searchShell, { borderColor: theme.borderLight, backgroundColor: theme.background }]}
                onPress={onPress}
            >
                <View style={[styles.searchIconCircle, { borderColor: theme.iconColor }]} />
                <View style={[styles.searchIconHandle, { backgroundColor: theme.iconColor }]} />
                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>{placeholderText}</Text>
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