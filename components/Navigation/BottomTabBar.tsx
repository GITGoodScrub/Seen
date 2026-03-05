import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTabItem, AppTabKey } from "../../Services";

type BottomTabBarProps = {
    tabs: AppTabItem[];
    activeTabKey: AppTabKey;
    onTabPress: (tabKey: AppTabKey) => void;
};

export const BottomTabBar = (
    {
        tabs,
        activeTabKey,
        onTabPress,
    }: BottomTabBarProps,
) =>
{
    return (
        <View style={styles.container}>
            {tabs.map(
                (tab) =>
                {
                    const isActive = tab.key === activeTabKey;

                    return (
                        <Pressable
                            key={tab.key}
                            style={[
                                styles.tabButton,
                                isActive ? styles.activeTabButton : undefined,
                            ]}
                            onPress={() => onTabPress(tab.key)}
                        >
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
        borderTopColor: "#dce2ea",
        backgroundColor: "#ffffff",
    },
    tabButton:
    {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
    },
    activeTabButton:
    {
        borderTopWidth: 2,
        borderTopColor: "#2563eb",
        backgroundColor: "#f4f8ff",
    },
    tabText:
    {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    activeTabText:
    {
        color: "#1d4ed8",
    },
});
