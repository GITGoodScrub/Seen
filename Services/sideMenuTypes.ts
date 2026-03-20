import { AppTabKey } from "./appShellTypes";

export type SideMenuItemKey = AppTabKey | "settings" | "help" | "logout";

export type SideMenuItem = {
    key: SideMenuItemKey;
    label: string;
    description?: string;
};
