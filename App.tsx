import { AppShellScreen } from "./screens";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App()
{
    return (
        <SafeAreaProvider>
            <AppShellScreen />
        </SafeAreaProvider>
    );
}
