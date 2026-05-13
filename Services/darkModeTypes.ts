export type DarkModePreference = "off" | "on";

export type ThemeColors = {
    background: string;
    surface: string;
    surfaceSecondary: string;
    text: string;
    textSecondary: string;
    border: string;
    borderLight: string;
    primary: string;
    primaryLight: string;
    accent: string;
    accentLight: string;
    error: string;
    success: string;
    warning: string;
    iconColor: string;
};

export const lightTheme: ThemeColors = {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceSecondary: "#f1f5f9",
    text: "#0f172a",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    borderLight: "#cbd5e1",
    primary: "#1d4ed8",
    primaryLight: "#dbeafe",
    accent: "#6366f1",
    accentLight: "#e0e7ff",
    error: "#b91c1c",
    success: "#047857",
    warning: "#f59e0b",
    iconColor: "#64748b",
};

export const darkTheme: ThemeColors = {
    background: "#0f172a",
    surface: "#1e293b",
    surfaceSecondary: "#334155",
    text: "#f1f5f9",
    textSecondary: "#cbd5e1",
    border: "#475569",
    borderLight: "#64748b",
    primary: "#3b82f6",
    primaryLight: "#1e40af",
    accent: "#818cf8",
    accentLight: "#4c1d95",
    error: "#ef4444",
    success: "#10b981",
    warning: "#fbbf24",
    iconColor: "#cbd5e1",
};
