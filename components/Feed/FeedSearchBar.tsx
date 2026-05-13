import { Image, StyleSheet, Pressable, Text, View } from "react-native";
import { useDarkMode } from "../../Services";

const searchIconLight = require("../../assets/search_icon.png");
const searchIconDark = require("../../assets/search_icon_inverted.png");

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
    const { isDarkMode, theme } = useDarkMode();

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable
                style={[styles.searchShell, { borderColor: theme.borderLight, backgroundColor: theme.background }]}
                onPress={onPress}
            >
                <Image
                    source={isDarkMode ? searchIconDark : searchIconLight}
                    style={styles.searchIcon}
                    resizeMode="contain"
                />
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
    searchIcon:
    {
        width: 18,
        height: 18,
        marginRight: 10,
    },
    placeholderText:
    {
        fontSize: 14,
        color: "#64748b",
    },
});