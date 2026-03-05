import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppHeader, BottomTabBar } from "../components";
import {
    AppTabKey,
    getAppTabs,
    getDefaultTabKey,
    getTabByKey,
} from "../Services";
import { HomeScreen } from "./HomeScreen";
import { ProfileScreen } from "./ProfileScreen";
import { UsersScreen } from "./UsersScreen";

const renderActiveScreen = (activeTabKey: AppTabKey) =>
{
    if (activeTabKey === "home")
    {
        return <HomeScreen />;
    }

    if (activeTabKey === "profile")
    {
        return <ProfileScreen />;
    }

    return <UsersScreen />;
};

export const AppShellScreen = () =>
{
    const tabs = useMemo(
        () => getAppTabs(),
        [],
    );
    const [activeTabKey, setActiveTabKey] = useState<AppTabKey>(
        getDefaultTabKey(),
    );
    const activeTab = getTabByKey(activeTabKey);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <AppHeader title={activeTab.title} />

            <View style={styles.screenContainer}>
                {renderActiveScreen(activeTabKey)}
            </View>

            <BottomTabBar
                tabs={tabs}
                activeTabKey={activeTabKey}
                onTabPress={setActiveTabKey}
            />
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    screenContainer:
    {
        flex: 1,
    },
});
