import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppShellScreen, AuthScreen } from "./screens";
import {
    AuthSession,
    getErrorMessageFromUnknown,
    logoutFromSeen,
    observeFirebaseAuthState,
    syncSessionWithBackend,
} from "./Services";
import { User } from "firebase/auth";

type AuthViewState = "loading" | "signed-out" | "signed-in";

const isDevAuthBypassEnabled = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === "true";

const getDevBypassSession = (): AuthSession =>
{
    return {
        idToken: "dev-auth-bypass-token",
        user: {
            id: -1,
            firebaseUid: "dev-bypass",
            email: "dev@seen.local",
            username: "dev-user",
            type: "general",
            createdAt: new Date().toISOString(),
            profile: {
                displayName: "Dev User",
                profilePhoto: null,
                bio: "Temporary local bypass profile",
                locationId: null,
                isVerified: false,
            },
        },
    };
};

export default function App()
{
    const [authViewState, setAuthViewState] = useState<AuthViewState>("loading");
    const [authSession, setAuthSession] = useState<AuthSession | null>(null);
    const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

    const handleAuthSuccess = useCallback(
        (nextSession: AuthSession): void =>
        {
            setAuthSession(nextSession);
            setAuthErrorMessage(null);
            setAuthViewState("signed-in");
        },
        [],
    );

    const handleSessionUpdate = useCallback(
        (nextSession: AuthSession): void =>
        {
            setAuthSession(nextSession);
        },
        [],
    );

    const handleLogout = useCallback(
        async (): Promise<void> =>
        {
            await logoutFromSeen();
            setAuthSession(null);
            setAuthViewState("signed-out");
        },
        [],
    );

    useEffect(
        () =>
        {
            if (isDevAuthBypassEnabled)
            {
                setAuthErrorMessage(null);
                setAuthSession(getDevBypassSession());
                setAuthViewState("signed-in");

                return () =>
                {
                    return;
                };
            }

            const handleFirebaseUserChange = async (firebaseUser: User | null): Promise<void> =>
            {
                if (!firebaseUser)
                {
                    setAuthSession(null);
                    setAuthViewState("signed-out");
                    return;
                }

                setAuthViewState("loading");

                try
                {
                    const syncedSession = await syncSessionWithBackend(firebaseUser);
                    setAuthSession(syncedSession);
                    setAuthErrorMessage(null);
                    setAuthViewState("signed-in");
                }
                catch (caughtError)
                {
                    const message = getErrorMessageFromUnknown(caughtError);

                    setAuthErrorMessage(message);
                    await logoutFromSeen();
                    setAuthSession(null);
                    setAuthViewState("signed-out");
                }
            };

            const unsubscribe = observeFirebaseAuthState(
                (firebaseUser) =>
                {
                    void handleFirebaseUserChange(firebaseUser);
                },
            );

            return () =>
            {
                unsubscribe();
            };
        },
        [],
    );

    return (
        <SafeAreaProvider>
            {authViewState === "loading" ? (
                <SafeAreaView style={styles.loadingSafeArea} edges={["top", "bottom"]}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" />
                        <Text style={styles.loadingLabel}>Loading your Seen session...</Text>
                    </View>
                </SafeAreaView>
            ) : null}

            {authViewState === "signed-out" ? (
                <AuthScreen
                    onAuthSuccess={handleAuthSuccess}
                    initialErrorMessage={authErrorMessage}
                />
            ) : null}

            {authViewState === "signed-in" && authSession ? (
                <AppShellScreen
                    authSession={authSession}
                    onSessionUpdate={handleSessionUpdate}
                    onLogout={handleLogout}
                />
            ) : null}
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create(
{
    loadingSafeArea:
    {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    loadingContent:
    {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingLabel:
    {
        marginTop: 12,
        fontSize: 14,
        color: "#475569",
    },
});
