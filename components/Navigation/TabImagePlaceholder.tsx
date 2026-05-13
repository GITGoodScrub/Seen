import { Image, ImageSourcePropType, StyleSheet } from "react-native";
import { AppTabKey, useDarkMode } from "../../Services";

type TabImagePlaceholderProps = {
    tabKey: AppTabKey;
    isActive: boolean;
};

const lightIcons: Record<AppTabKey, ImageSourcePropType> = {
    home: require("../../assets/home_icon.png"),
    discover: require("../../assets/discover_icon.png"),
    saved: require("../../assets/saved_icon.png"),
    notifications: require("../../assets/notifications_icon.png"),
    profile: require("../../assets/profile_icon.png"),
};

const darkIcons: Record<AppTabKey, ImageSourcePropType> = {
    home: require("../../assets/home_icon_inverted.png"),
    discover: require("../../assets/discover_icon_inverted.png"),
    saved: require("../../assets/saved_icon_inverted.png"),
    notifications: require("../../assets/notifications_icon_inverted.png"),
    profile: require("../../assets/profile_icon_inverted.png"),
};

export const TabImagePlaceholder = (
    {
        tabKey,
        isActive,
    }: TabImagePlaceholderProps,
) =>
{
    const { isDarkMode } = useDarkMode();

    return (
        <Image
            source={isDarkMode ? darkIcons[tabKey] : lightIcons[tabKey]}
            style={[
                styles.icon,
                isActive ? styles.iconActive : undefined,
            ]}
            resizeMode="contain"
        />
    );
};

const styles = StyleSheet.create(
{
    icon:
    {
        width: 24,
        height: 24,
        marginBottom: 4,
    },
    iconActive:
    {
        opacity: 1,
    },
});