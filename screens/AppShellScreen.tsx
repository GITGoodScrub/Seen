import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader, BottomTabBar, SideMenuDrawer } from "../components";
import { higLayout } from "../constants";
import {
    AuthSession,
    AppTabKey,
    SideMenuItem,
    buildUpdatedRecentSearches,
    getAppTabs,
    getDefaultTabKey,
    getDefaultRecentSearches,
    getSideMenuItems,
} from "../Services";
import { DiscoverScreen } from "./DiscoverScreen";
import { EventCreationScreen } from "./EventCreationScreen";
import { EventDetailScreen } from "./EventDetailScreen";
import { HomeScreen } from "./HomeScreen";
import { NewPostScreen } from "./NewPostScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import { ProfileScreen } from "./ProfileScreen";
import { SavedEventsScreen } from "./SavedEventsScreen";
import { SearchScreen } from "./SearchScreen";
import { VenueDetailScreen } from "./VenueDetailScreen";

type AppShellScreenProps = {
    authSession: AuthSession;
    onSessionUpdate?: (nextSession: AuthSession) => void;
    onLogout?: () => void;
};

const appTabKeys: AppTabKey[] = [
    "home",
    "discover",
    "saved",
    "notifications",
    "profile",
];

const isAppTabKey = (value: string): value is AppTabKey =>
{
    return appTabKeys.includes(value as AppTabKey);
};

const renderActiveScreen = (
    activeTabKey: AppTabKey,
    onSearchPress: () => void,
    discoverRefreshKey: number,
    onOpenEventPress: (eventId: number) => void,
    authSession: AuthSession,
    selectedProfileUserId: number | null,
    isProfileEditing: boolean,
    onOpenProfilePress: (profileUserId: number) => void,
    onStartProfileEditing: () => void,
    onStopProfileEditing: () => void,
    feedRefreshKey: number,
    onSessionUpdate?: (nextSession: AuthSession) => void,
) =>
{
    if (activeTabKey === "home")
    {
        return (
            <HomeScreen
                authSession={authSession}
                onSearchPress={onSearchPress}
                refreshKey={feedRefreshKey}
            />
        );
    }

    if (activeTabKey === "discover")
    {
        return (
            <DiscoverScreen
                onSearchPress={onSearchPress}
                refreshKey={discoverRefreshKey}
                onEventPress={onOpenEventPress}
            />
        );
    }

    if (activeTabKey === "saved")
    {
        return (
            <SavedEventsScreen
                onEventPress={onOpenEventPress}
            />
        );
    }

    if (activeTabKey === "notifications")
    {
        return <NotificationsScreen />;
    }

    if (activeTabKey === "profile")
    {
        return (
            <ProfileScreen
                authSession={authSession}
                profileUserId={selectedProfileUserId}
                isEditing={isProfileEditing}
                onOpenProfilePress={onOpenProfilePress}
                onStartEditing={onStartProfileEditing}
                onStopEditing={onStopProfileEditing}
                onSessionUpdate={onSessionUpdate}
            />
        );
    }

    return (
        <HomeScreen
            authSession={authSession}
            onSearchPress={onSearchPress}
            refreshKey={feedRefreshKey}
        />
    );
};

export const AppShellScreen = (
    {
        authSession,
        onSessionUpdate,
        onLogout,
    }: AppShellScreenProps,
) =>
{
    const tabs = useMemo(
        () => getAppTabs(),
        [],
    );
    const sideMenuItems = useMemo(
        () => getSideMenuItems(),
        [],
    );
    const [activeTabKey, setActiveTabKey] = useState<AppTabKey>(
        getDefaultTabKey(),
    );
    const [selectedProfileUserId, setSelectedProfileUserId] = useState<number | null>(null);
    const [isNewPostOpen, setIsNewPostOpen] = useState(false);
    const [isEventCreationOpen, setIsEventCreationOpen] = useState(false);
    const [openEventSeriesId, setOpenEventSeriesId] = useState<number | null>(null);
    const [openVenueId, setOpenVenueId] = useState<number | null>(null);
    const [feedRefreshKey, setFeedRefreshKey] = useState(0);
    const [discoverRefreshKey, setDiscoverRefreshKey] = useState(0);
    const [isProfileEditing, setIsProfileEditing] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>(
        getDefaultRecentSearches(),
    );
    const sideMenuProgress = useRef(
        new Animated.Value(0),
    ).current;

    const openSideMenu = (): void =>
    {
        if (isSideMenuVisible)
        {
            return;
        }

        setIsSideMenuVisible(true);
        Animated.timing(
            sideMenuProgress,
            {
                toValue: 1,
                duration: higLayout.sideMenuAnimationDurationMs,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            },
        ).start();
    };

    const closeSideMenu = (): void =>
    {
        if (!isSideMenuVisible)
        {
            return;
        }

        Animated.timing(
            sideMenuProgress,
            {
                toValue: 0,
                duration: higLayout.sideMenuAnimationDurationMs,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            },
        ).start(
            () =>
            {
                setIsSideMenuVisible(false);
            },
        );
    };

    const resetSideMenu = (): void =>
    {
        sideMenuProgress.stopAnimation();
        sideMenuProgress.setValue(0);
        setIsSideMenuVisible(false);
    };

    const handleToggleSideMenu = (): void =>
    {
        if (isSideMenuVisible)
        {
            closeSideMenu();
            return;
        }

        openSideMenu();
    };

    const handleSideMenuItemPress = (menuItem: SideMenuItem): void =>
    {
        if (menuItem.key === "logout")
        {
            setIsSearchOpen(false);
            closeSideMenu();
            onLogout?.();
            return;
        }

        if (isAppTabKey(menuItem.key))
        {
            setActiveTabKey(menuItem.key);
            setIsProfileEditing(false);

            if (menuItem.key === "profile")
            {
                setSelectedProfileUserId(null);
            }
        }

        setIsSearchOpen(false);
        closeSideMenu();
    };

    const handleTabPress = (nextTabKey: AppTabKey): void =>
    {
        setActiveTabKey(nextTabKey);
        setIsProfileEditing(false);

        if (nextTabKey === "profile")
        {
            setSelectedProfileUserId(null);
        }

        if (isSideMenuVisible)
        {
            closeSideMenu();
        }
    };

    const handleOpenNewPost = (): void =>
    {
        resetSideMenu();
        setIsSearchOpen(false);
        setIsNewPostOpen(true);
    };

    const handleCloseNewPost = (): void =>
    {
        setIsNewPostOpen(false);
    };

    const handleOpenEventCreation = (): void =>
    {
        resetSideMenu();
        setIsSearchOpen(false);
        setIsEventCreationOpen(true);
    };

    const handleCloseEventCreation = (): void =>
    {
        setIsEventCreationOpen(false);
    };

    const handleOpenEventDetails = (eventSeriesId: number): void =>
    {
        setIsSearchOpen(false);
        setOpenEventSeriesId(eventSeriesId);
    };

    const handleCloseEventDetails = (): void =>
    {
        setOpenEventSeriesId(null);
    };

    const handleOpenVenueDetails = (venueId: number): void =>
    {
        setIsSearchOpen(false);
        setOpenVenueId(venueId);
    };

    const handleCloseVenueDetails = (): void =>
    {
        setOpenVenueId(null);
    };

    const handlePostCreated = (): void =>
    {
        setFeedRefreshKey((k) => k + 1);
    };

    const handleEventCreated = (): void =>
    {
        setDiscoverRefreshKey((k) => k + 1);
    };

    const handleOpenSearch = (): void =>
    {
        resetSideMenu();
        setIsSearchOpen(true);
    };

    const handleCloseSearch = (): void =>
    {
        setIsSearchOpen(false);
    };

    const handleStartProfileEditing = (): void =>
    {
        setIsProfileEditing(true);
    };

    const handleStopProfileEditing = (): void =>
    {
        setIsProfileEditing(false);
    };

    const handleHeaderActionPress = (): void =>
    {
        if (activeTabKey === "profile")
        {
            if (selectedProfileUserId !== null && selectedProfileUserId !== authSession.user.id)
            {
                return;
            }

            handleStartProfileEditing();
            return;
        }

        if (activeTabKey === "discover")
        {
            handleOpenEventCreation();
            return;
        }

        handleOpenNewPost();
    };

    const handleSearchSubmit = (searchQuery: string): void =>
    {
        setRecentSearches(
            (currentRecentSearches) => buildUpdatedRecentSearches(currentRecentSearches, searchQuery),
        );
    };

    const handleClearRecentSearches = (): void =>
    {
        setRecentSearches([]);
    };

    const handleOpenProfile = (profileUserId: number): void =>
    {
        setSelectedProfileUserId(profileUserId);
        setIsProfileEditing(false);
        setActiveTabKey("profile");
        setIsSearchOpen(false);
    };

    const isViewingOtherProfile = selectedProfileUserId !== null && selectedProfileUserId !== authSession.user.id;

    const sideMenuTranslateX = sideMenuProgress.interpolate(
        {
            inputRange: [0, 1],
            outputRange: [-higLayout.sideMenuWidth, 0],
        },
    );
    const mainContentTranslateX = sideMenuProgress.interpolate(
        {
            inputRange: [0, 1],
            outputRange: [0, higLayout.sideMenuWidth],
        },
    );
    const mainOverlayOpacity = sideMenuProgress.interpolate(
        {
            inputRange: [0, 1],
            outputRange: [0, higLayout.sideMenuOverlayOpacity],
        },
    );

    if (isNewPostOpen)
    {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />

                <SafeAreaView
                    edges={["top", "bottom"]}
                    style={styles.composeSafeArea}
                >
                    <NewPostScreen
                        authSession={authSession}
                        onClose={handleCloseNewPost}
                        onPostCreated={handlePostCreated}
                    />
                </SafeAreaView>
            </View>
        );
    }

    if (isEventCreationOpen)
    {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />

                <SafeAreaView
                    edges={["top", "bottom"]}
                    style={styles.composeSafeArea}
                >
                    <EventCreationScreen
                        authSession={authSession}
                        onClose={handleCloseEventCreation}
                        onEventCreated={handleEventCreated}
                    />
                </SafeAreaView>
            </View>
        );
    }

    if (openVenueId !== null)
    {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />

                <SafeAreaView
                    edges={["top", "bottom"]}
                    style={styles.searchSafeArea}
                >
                    <View style={styles.eventDetailTopRow}>
                        <Pressable
                            style={styles.eventDetailBackButton}
                            onPress={handleCloseVenueDetails}
                        >
                            <Animated.Text style={styles.eventDetailBackText}>Back</Animated.Text>
                        </Pressable>
                        <Animated.Text style={styles.eventDetailHeaderTitle}>Venue Details</Animated.Text>
                        <View style={styles.eventDetailSpacer} />
                    </View>

                    <VenueDetailScreen venueId={openVenueId} />
                </SafeAreaView>
            </View>
        );
    }

    if (openEventSeriesId !== null)
    {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />

                <SafeAreaView
                    edges={["top", "bottom"]}
                    style={styles.searchSafeArea}
                >
                    <View style={styles.eventDetailTopRow}>
                        <Pressable
                            style={styles.eventDetailBackButton}
                            onPress={handleCloseEventDetails}
                        >
                            <Animated.Text style={styles.eventDetailBackText}>Back</Animated.Text>
                        </Pressable>
                        <Animated.Text style={styles.eventDetailHeaderTitle}>Event Details</Animated.Text>
                        <View style={styles.eventDetailSpacer} />
                    </View>

                    <EventDetailScreen
                        eventSeriesId={openEventSeriesId}
                        onOpenVenuePress={handleOpenVenueDetails}
                    />
                </SafeAreaView>
            </View>
        );
    }

    if (isSearchOpen)
    {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />

                <SafeAreaView
                    edges={["top", "bottom"]}
                    style={styles.searchSafeArea}
                >
                    <SearchScreen
                        recentSearches={recentSearches}
                        onClose={handleCloseSearch}
                        onSearchSubmit={handleSearchSubmit}
                        onOpenProfilePress={handleOpenProfile}
                        onOpenVenuePress={handleOpenVenueDetails}
                        onOpenEventPress={handleOpenEventDetails}
                        onClearRecentSearches={handleClearRecentSearches}
                    />
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <Animated.View
                pointerEvents={isSideMenuVisible ? "auto" : "none"}
                style={[
                    styles.sideMenuLayer,
                    {
                        width: higLayout.sideMenuWidth,
                        transform: [
                            {
                                translateX: sideMenuTranslateX,
                            },
                        ],
                    },
                ]}
            >
                <SafeAreaView
                    edges={["top", "bottom"]}
                    style={styles.sideMenuSafeArea}
                >
                    <SideMenuDrawer
                        items={sideMenuItems}
                        onItemPress={handleSideMenuItemPress}
                    />
                </SafeAreaView>
            </Animated.View>

            <Animated.View
                style={[
                    styles.mainLayer,
                    {
                        transform: [
                            {
                                translateX: mainContentTranslateX,
                            },
                        ],
                    },
                ]}
            >
                <SafeAreaView
                    edges={["top"]}
                    style={styles.headerSafeArea}
                >
                    <AppHeader
                        onMenuPress={handleToggleSideMenu}
                        onRightActionPress={handleHeaderActionPress}
                        rightActionIcon={activeTabKey === "profile"
                            ? (isViewingOtherProfile ? "none" : "settings")
                            : "plus"}
                    />
                </SafeAreaView>

                <View style={styles.screenContainer}>
                    {renderActiveScreen(
                        activeTabKey,
                        handleOpenSearch,
                        discoverRefreshKey,
                        handleOpenEventDetails,
                        authSession,
                        selectedProfileUserId,
                        isProfileEditing,
                        handleOpenProfile,
                        handleStartProfileEditing,
                        handleStopProfileEditing,
                        feedRefreshKey,
                        onSessionUpdate,
                    )}
                </View>

                <SafeAreaView
                    edges={["bottom"]}
                    style={styles.navSafeArea}
                >
                    <BottomTabBar
                        tabs={tabs}
                        activeTabKey={activeTabKey}
                        onTabPress={handleTabPress}
                    />
                </SafeAreaView>

                {isSideMenuVisible ? (
                    <Pressable
                        style={styles.mainDismissLayer}
                        onPress={closeSideMenu}
                    >
                        <Animated.View
                            style={[
                                styles.mainDismissTint,
                                {
                                    opacity: mainOverlayOpacity,
                                },
                            ]}
                        />
                    </Pressable>
                ) : null}
            </Animated.View>
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
    sideMenuLayer:
    {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 2,
    },
    sideMenuSafeArea:
    {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    mainLayer:
    {
        flex: 1,
        zIndex: 3,
        backgroundColor: "#f8fafc",
        shadowColor: "#0f172a",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: {
            width: -1,
            height: 0,
        },
        elevation: 8,
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
    composeSafeArea:
    {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    searchSafeArea:
    {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    eventDetailTopRow:
    {
        minHeight: 46,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    eventDetailBackButton:
    {
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
    },
    eventDetailBackText:
    {
        fontSize: 16,
        fontWeight: "600",
        color: "#1d4ed8",
    },
    eventDetailHeaderTitle:
    {
        fontSize: 17,
        fontWeight: "700",
        color: "#0f172a",
    },
    eventDetailSpacer:
    {
        width: 44,
    },
    mainDismissLayer:
    {
        ...StyleSheet.absoluteFillObject,
    },
    mainDismissTint:
    {
        flex: 1,
        backgroundColor: "#0f172a",
    },
});
