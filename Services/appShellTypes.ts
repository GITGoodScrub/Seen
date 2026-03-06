export type AppTabKey = "home" | "discover" | "saved" | "notifications" | "profile";

export type AppTabItem = {
    key: AppTabKey;
    label: string;
    title: string;
    iconLabel: string;
};
