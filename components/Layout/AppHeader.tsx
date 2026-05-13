import { Image, Pressable, StyleSheet, View } from "react-native";
import { higLayout } from "../../constants";
import { useDarkMode } from "../../Services";

const logoLight = require("../../assets/seen_logo_inverted.png");
const logoDark = require("../../assets/seen_logo.png");
const settingsIconLight = require("../../assets/settings_icon.png");
const settingsIconDark = require("../../assets/settings_icon_inverted.png");

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
    const { isDarkMode, theme } = useDarkMode();

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

            <Image
                source={isDarkMode ? logoDark : logoLight}
                style={styles.headerLogo}
                resizeMode="contain"
            />

            <Pressable
                style={styles.iconButton}
                onPress={onRightActionPress}
                disabled={rightActionIcon === "none"}
            >
                {rightActionIcon === "none" ? null : rightActionIcon === "settings" ? (
                    <Image
                        source={isDarkMode ? settingsIconDark : settingsIconLight}
                        style={styles.headerActionIcon}
                        resizeMode="contain"
                    />
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
    headerLogo:
    {
        height: 36,
        width: 120,
    },
    headerActionIcon:
    {
        width: 22,
        height: 22,
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
});
