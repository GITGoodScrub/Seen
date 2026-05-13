import React, { createContext, useContext, useEffect, useState } from "react";
import { DarkModePreference, ThemeColors, darkTheme, lightTheme } from "./darkModeTypes";
import { loadDarkModePreference, saveDarkModePreference } from "./darkModeService";

type DarkModeContextType = {
    isDarkMode: boolean;
    preference: DarkModePreference;
    theme: ThemeColors;
    toggleDarkMode: (preference: DarkModePreference) => Promise<void>;
};

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

type DarkModeProviderProps = {
    children: React.ReactNode;
};

export const DarkModeProvider = ({ children }: DarkModeProviderProps): React.ReactElement =>
{
    const [preference, setPreference] = useState<DarkModePreference>("off");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(
        () =>
        {
            let isCancelled = false;

            const load = async (): Promise<void> =>
            {
                const loadedPreference = await loadDarkModePreference();

                if (!isCancelled)
                {
                    setPreference(loadedPreference);
                    setIsLoading(false);
                }
            };

            void load();

            return () =>
            {
                isCancelled = true;
            };
        },
        [],
    );

    const toggleDarkMode = async (nextPreference: DarkModePreference): Promise<void> =>
    {
        setPreference(nextPreference);
        await saveDarkModePreference(nextPreference);
    };

    const isDarkMode = preference === "on";
    const theme = isDarkMode ? darkTheme : lightTheme;

    if (isLoading)
    {
        // Return a minimal provider during loading
        return (
            <DarkModeContext.Provider
                value={{
                    isDarkMode: false,
                    preference: "off",
                    theme: lightTheme,
                    toggleDarkMode,
                }}
            >
                {children}
            </DarkModeContext.Provider>
        );
    }

    return (
        <DarkModeContext.Provider
            value={{
                isDarkMode,
                preference,
                theme,
                toggleDarkMode,
            }}
        >
            {children}
        </DarkModeContext.Provider>
    );
};

export const useDarkMode = (): DarkModeContextType =>
{
    const context = useContext(DarkModeContext);

    if (!context)
    {
        throw new Error("useDarkMode must be used within a DarkModeProvider");
    }

    return context;
};
