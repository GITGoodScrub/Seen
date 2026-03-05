import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader, BottomTabBar } from "../components";
import {
    AppTabKey,
    getAppTabs,
    getDefaultTabKey,
} from "../Services";
import { DiscoverScreen } from "./DiscoverScreen";
import { HomeScreen } from "./HomeScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import { ProfileScreen } from "./ProfileScreen";
import { UsersScreen } from "./UsersScreen";

const renderActiveScreen = (activeTabKey: AppTabKey) =>
{
    if (activeTabKey === "home")
    {
        return <HomeScreen />;
    }

    if (activeTabKey === "discover")
    {
        return <DiscoverScreen />;
    }

    if (activeTabKey === "friends")
    {
        return <UsersScreen />;
    }

    if (activeTabKey === "notifications")
    {
        return <NotificationsScreen />;
    }

    if (activeTabKey === "profile")
    {
        return <ProfileScreen />;
    }

    return <HomeScreen />;
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

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <SafeAreaView
                edges={["top"]}
                style={styles.headerSafeArea}
            >
                <AppHeader />
            </SafeAreaView>

            <View style={styles.screenContainer}>
                {renderActiveScreen(activeTabKey)}
            </View>

            <SafeAreaView
                edges={["bottom"]}
                style={styles.navSafeArea}
            >
                <BottomTabBar
                    tabs={tabs}
                    activeTabKey={activeTabKey}
                    onTabPress={setActiveTabKey}
                />
            </SafeAreaView>
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
    headerSafeArea:
    {
        backgroundColor: "#ffffff",
    },
    navSafeArea:
    {
        backgroundColor: "#ffffff",
    },
});
