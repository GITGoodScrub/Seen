import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTabItem, AppTabKey } from "../../Services";
import { higLayout } from "../../constants";
import { TabImagePlaceholder } from "./TabImagePlaceholder";

type BottomTabBarProps = {
    tabs: AppTabItem[];
    activeTabKey: AppTabKey;
    onTabPress: (tabKey: AppTabKey) => void;
    badgeCountByTab?: Partial<Record<AppTabKey, number>>;
};

export const BottomTabBar = (
    {
        tabs,
        activeTabKey,
        onTabPress,
        badgeCountByTab,
    }: BottomTabBarProps,
) =>
{
    return (
        <View style={styles.container}>
            {tabs.map(
                (tab) =>
                {
                    const isActive = tab.key === activeTabKey;
                    const badgeCount = badgeCountByTab?.[tab.key] ?? 0;

                    return (
                        <Pressable
                            key={tab.key}
                            style={[
                                styles.tabButton,
                                isActive ? styles.activeTabButton : undefined,
                            ]}
                            onPress={() => onTabPress(tab.key)}
                        >
                            <TabImagePlaceholder
                                label={tab.iconLabel}
                                isActive={isActive}
                            />

                            {badgeCount > 0 ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {badgeCount > 99 ? "99+" : badgeCount}
                                    </Text>
                                </View>
                            ) : null}

                            <Text
                                style={[
                                    styles.tabText,
                                    isActive ? styles.activeTabText : undefined,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                },
            )}
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#d9dee5",
        backgroundColor: "#ffffff",
    },
    tabButton:
    {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        paddingTop: higLayout.tabBarItemTopPadding,
        paddingBottom: higLayout.tabBarItemBottomPadding,
        minHeight: higLayout.minTouchTargetSize + 6,
    },
    activeTabButton:
    {
        backgroundColor: "#f5f8ff",
    },
    tabText:
    {
        fontSize: higLayout.tabBarLabelFontSize,
        fontWeight: "600",
        color: "#64748b",
    },
    activeTabText:
    {
        color: "#1d4ed8",
    },
    badge:
    {
        position: "absolute",
        top: 6,
        right: "26%",
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#ef4444",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    badgeText:
    {
        fontSize: 10,
        fontWeight: "700",
        color: "#ffffff",
    },
});
