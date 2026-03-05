import { AppTabItem, AppTabKey } from "./appShellTypes";

const appTabs: AppTabItem[] = [
    {
        key: "home",
        label: "Home",
        title: "Home",
    },
    {
        key: "people",
        label: "People",
        title: "People",
    },
    {
        key: "profile",
        label: "Profile",
        title: "Profile",
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
