import { SideMenuItem } from "./sideMenuTypes";

const sideMenuItems: SideMenuItem[] = [
    {
        key: "home",
        label: "Home",
        description: "Main feed and updates",
    },
    {
        key: "discover",
        label: "Discover",
        description: "Find people, venues, and events",
    },
    {
        key: "saved",
        label: "Saved Events",
        description: "Your bookmarked events",
    },
    {
        key: "notifications",
        label: "Notifications",
        description: "Recent activity and reminders",
    },
    {
        key: "profile",
        label: "Profile",
        description: "Your account and preferences",
    },
    {
        key: "settings",
        label: "Settings",
        description: "App settings (placeholder)",
    },
    {
        key: "help",
        label: "Help",
        description: "Support and documentation (placeholder)",
    },
];

export const getSideMenuItems = (): SideMenuItem[] =>
{
    return sideMenuItems;
};
