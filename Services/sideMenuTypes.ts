import { AppTabKey } from "./appShellTypes";

export type SideMenuItemKey = AppTabKey | "followers" | "settings" | "logout";

export type SideMenuItem = {
    key: SideMenuItemKey;
    label: string;
    description?: string;
    isDanger?: boolean;
};
