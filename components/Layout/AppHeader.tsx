import { Pressable, StyleSheet, Text, View } from "react-native";
import { higLayout } from "../../constants";

type AppHeaderProps = {
    onMenuPress?: () => void;
    onSearchPress?: () => void;
};

export const AppHeader = (
    {
        onMenuPress,
        onSearchPress,
    }: AppHeaderProps,
) =>
{
    return (
        <View style={styles.headerContainer}>
            <Pressable
                style={styles.iconButton}
                onPress={onMenuPress}
            >
                <View style={styles.burgerLine} />
                <View style={styles.burgerLine} />
                <View style={styles.burgerLine} />
            </Pressable>

            <Text style={styles.headerTitle}>Seen</Text>

            <Pressable
                style={styles.iconButton}
                onPress={onSearchPress}
            >
                <View style={styles.searchCircle} />
                <View style={styles.searchHandle} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create(
{
    headerContainer:
    {
        paddingHorizontal: higLayout.contentHorizontalPadding,
        paddingTop: higLayout.topBarVerticalPadding,
        paddingBottom: higLayout.topBarVerticalPadding,
        borderBottomWidth: 1,
        borderBottomColor: "#d9dee5",
        backgroundColor: "#ffffff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: higLayout.topBarMinHeight,
    },
    headerTitle:
    {
        fontSize: 28,
        fontWeight: "700",
        color: "#1d4ed8",
    },
    iconButton:
    {
        width: higLayout.minTouchTargetSize,
        height: higLayout.minTouchTargetSize,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: higLayout.minTouchTargetSize / 2,
    },
    burgerLine:
    {
        width: 19,
        height: 2,
        backgroundColor: "#111827",
        marginVertical: 2,
        borderRadius: 2,
    },
    searchCircle:
    {
        width: 14,
        height: 14,
        borderWidth: 2,
        borderColor: "#111827",
        borderRadius: 7,
    },
    searchHandle:
    {
        width: 8,
        height: 2,
        backgroundColor: "#111827",
        borderRadius: 2,
        transform: [{ rotate: "45deg" }],
        marginTop: 1,
        marginLeft: 10,
    },
});
