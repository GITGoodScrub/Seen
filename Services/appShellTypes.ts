export type AppTabKey = "home" | "discover" | "friends" | "notifications" | "profile";

export type AppTabItem = {
    key: AppTabKey;
    label: string;
    title: string;
    iconLabel: string;
};
