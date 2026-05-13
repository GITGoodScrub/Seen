import { Pressable, StyleSheet, Text, View } from "react-native";
import { higLayout } from "../../constants";
import { useDarkMode } from "../../Services";

type AppHeaderProps = {
    onMenuPress?: () => void;
    onRightActionPress?: () => void;
    rightActionIcon?: "plus" | "settings" | "none";
};

export const AppHeader = (
    {
        onMenuPress,
        onRightActionPress,
        rightActionIcon = "plus",
    }: AppHeaderProps,
) =>
{
    const { theme } = useDarkMode();

    return (
        <View style={[styles.headerContainer, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
            <Pressable
                style={styles.iconButton}
                onPress={onMenuPress}
            >
                <View style={[styles.burgerLine, { backgroundColor: theme.text }]} />
                <View style={[styles.burgerLine, { backgroundColor: theme.text }]} />
                <View style={[styles.burgerLine, { backgroundColor: theme.text }]} />
            </Pressable>

            <Text style={[styles.headerTitle, { color: theme.primary }]}>Seen</Text>

            <Pressable
                style={styles.iconButton}
                onPress={onRightActionPress}
                disabled={rightActionIcon === "none"}
            >
                {rightActionIcon === "none" ? null : rightActionIcon === "settings" ? (
                    <View style={[styles.settingsIconOuter, { borderColor: theme.text }]}>
                        <View style={[styles.settingsTooth, styles.settingsToothTop, { backgroundColor: theme.text }]} />
                        <View style={[styles.settingsTooth, styles.settingsToothBottom, { backgroundColor: theme.text }]} />
                        <View style={[styles.settingsToothVertical, styles.settingsToothLeft, { backgroundColor: theme.text }]} />
                        <View style={[styles.settingsToothVertical, styles.settingsToothRight, { backgroundColor: theme.text }]} />
                        <View style={[styles.settingsIconInner, { backgroundColor: theme.text }]} />
                    </View>
                ) : (
                    <>
                        <View style={[styles.plusHorizontal, { backgroundColor: theme.text }]} />
                        <View style={[styles.plusVertical, { backgroundColor: theme.text }]} />
                    </>
                )}
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
    plusHorizontal:
    {
        width: 16,
        height: 2,
        backgroundColor: "#111827",
        borderRadius: 2,
    },
    plusVertical:
    {
        width: 2,
        height: 16,
        backgroundColor: "#111827",
        borderRadius: 2,
        position: "absolute",
    },
    settingsIconOuter:
    {
        width: 18,
        height: 18,
        borderWidth: 2,
        borderColor: "#111827",
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    settingsIconInner:
    {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: "#111827",
    },
    settingsTooth:
    {
        width: 4,
        height: 2,
        backgroundColor: "#111827",
        borderRadius: 1,
        position: "absolute",
    },
    settingsToothTop:
    {
        top: -3,
    },
    settingsToothBottom:
    {
        bottom: -3,
    },
    settingsToothVertical:
    {
        width: 2,
        height: 4,
        backgroundColor: "#111827",
        borderRadius: 1,
        position: "absolute",
    },
    settingsToothLeft:
    {
        left: -3,
    },
    settingsToothRight:
    {
        right: -3,
    },
});
