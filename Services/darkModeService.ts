import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkModePreference } from "./darkModeTypes";

const darkModeKey = "seen_dark_mode_preference";

export const loadDarkModePreference = async (): Promise<DarkModePreference> =>
{
    try
    {
        const stored = await AsyncStorage.getItem(darkModeKey);
        if (stored === "on" || stored === "off")
        {
            return stored;
        }
    }
    catch
    {
        // Default to off if storage read fails
    }

    return "off";
};

export const saveDarkModePreference = async (preference: DarkModePreference): Promise<void> =>
{
    try
    {
        await AsyncStorage.setItem(darkModeKey, preference);
    }
    catch
    {
        // Silently fail if storage write fails
    }
};
