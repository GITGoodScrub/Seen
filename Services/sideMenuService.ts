import { SideMenuItem } from "./sideMenuTypes";

const sideMenuItems: SideMenuItem[] = [
    {
        key: "discover",
        label: "Events",
        description: "Discover events happening near you",
    },
    {
        key: "saved",
        label: "Saved",
        description: "Your bookmarked events",
    },
    {
        key: "followers",
        label: "Friends",
        description: "Your followers & following",
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
        description: "Preferences and account options",
    },
    {
        key: "logout",
        label: "Log Out",
        isDanger: true,
    },
];

export const getSideMenuItems = (): SideMenuItem[] =>
{
    return sideMenuItems;
};
