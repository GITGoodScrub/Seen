import { AppTabItem, AppTabKey } from "./appShellTypes";

const appTabs: AppTabItem[] = [
    {
        key: "home",
        label: "Home",
        title: "Home",
        iconLabel: "H",
    },
    {
        key: "discover",
        label: "Discover",
        title: "Discover",
        iconLabel: "D",
    },
    {
        key: "friends",
        label: "Friends",
        title: "Friends",
        iconLabel: "F",
    },
    {
        key: "notifications",
        label: "Notifications",
        title: "Notifications",
        iconLabel: "N",
    },
    {
        key: "profile",
        label: "Profile",
        title: "Profile",
        iconLabel: "P",
    },
];

export const getAppTabs = (): AppTabItem[] =>
{
    return appTabs;
};

export const getDefaultTabKey = (): AppTabKey =>
{
    return appTabs[0].key;
};

export const getTabByKey = (tabKey: AppTabKey): AppTabItem =>
{
    const matchedTab = appTabs.find(
        (tab) => tab.key === tabKey,
    );

    if (!matchedTab)
    {
        return appTabs[0];
    }

    return matchedTab;
};
