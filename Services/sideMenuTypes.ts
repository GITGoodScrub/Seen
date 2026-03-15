import { AppTabKey } from "./appShellTypes";

export type SideMenuItemKey = AppTabKey | "settings" | "help";

export type SideMenuItem = {
    key: SideMenuItemKey;
    label: string;
    description?: string;
};
