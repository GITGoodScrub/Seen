import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    AuthSession,
    checkUsernameAvailability,
    getErrorMessageFromUnknown,
    getUsernameValidationMessage,
    isFirebaseConfigured,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    sendSeenPasswordResetEmail,             // line 255 - 287
} from "../Services";

WebBrowser.maybeCompleteAuthSession();

type AuthMode = "login" | "signup";

type AuthScreenProps = {
    onAuthSuccess: (session: AuthSession) => void;
    initialErrorMessage?: string | null;
};

const minPasswordLength = 6;

const normalizeField = (value: string): string =>
{
    return value.trim();
};

const isValidEmail = (value: string): boolean =>
{
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
};

const getGoogleEnvKeyForCurrentPlatform = (): string =>
{
    if (Platform.OS === "ios")
    {
        return "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID";
    }

    if (Platform.OS === "android")
    {
        return "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID";
    }

    return "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID";
};

export const AuthScreen = (
    {
        onAuthSuccess,
        initialErrorMessage = null,
    }: AuthScreenProps,
) =>
{
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetMessage, setResetMessage] = useState<string | null>(null);

    const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
    const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
    const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

    const googleClientIdForPlatform =
        googleIosClientId ||
        googleAndroidClientId ||
        googleWebClientId;

    const isGoogleConfigured = googleClientIdForPlatform.length > 0;

    const [googleRequest, googleResponse, promptGoogleAuth] = Google.useAuthRequest(
        {
            webClientId: googleWebClientId || "missing-google-web-client-id",
            androidClientId: googleAndroidClientId || googleWebClientId || "missing-google-android-client-id",
            iosClientId: googleIosClientId || googleWebClientId || "missing-google-ios-client-id",
            scopes: ["profile", "email"],
        },
    );

    const isConfigured = useMemo(
        () => isFirebaseConfigured(),
        [],
    );

    useEffect(
        () =>
        {
            setErrorMessage(initialErrorMessage);
        },
        [initialErrorMessage],
    );

    useEffect(
        () =>
        {
            const completeGoogleSignIn = async (): Promise<void> =>
            {
                if (!googleResponse)
                {
                    return;
                }

                if (googleResponse.type !== "success")
                {
                    setIsSubmitting(false);
                    return;
                }

                const googleParams = googleResponse.params as {
                    id_token?: string;
                    access_token?: string;
                };

                const idToken = googleParams.id_token ?? googleResponse.authentication?.idToken ?? null;
                const accessToken = googleParams.access_token ?? googleResponse.authentication?.accessToken ?? null;

                try
                {
                    const authSession = await signInWithGoogle(
                        {
                            idToken,
                            accessToken,
                        },
                        mode === "signup" ? "signup" : "login",
                    );

                    setErrorMessage(null);
                    onAuthSuccess(authSession);
                }
                catch (caughtError)
                {
                    setErrorMessage(getErrorMessageFromUnknown(caughtError));
                }
                finally
                {
                    setIsSubmitting(false);
                }
            };

            void completeGoogleSignIn();
        },
        [googleResponse, mode, onAuthSuccess],
    );

    const switchMode = (nextMode: AuthMode): void =>
    {
        if (nextMode === mode)
        {
            return;
        }

        setMode(nextMode);
        setErrorMessage(null);
    };

    const handleEmailAuth = async (): Promise<void> =>
    {
        const normalizedEmail = normalizeField(email).toLowerCase();
        const normalizedUsername = normalizeField(username).toLowerCase();

        if (!isConfigured)
        {
            setErrorMessage("Firebase configuration is missing. Add EXPO_PUBLIC_FIREBASE_* values to Seen/.env.");
            return;
        }

        if (!isValidEmail(normalizedEmail))
        {
            setErrorMessage("Please enter a valid email address.");
            return;
        }

        if (mode === "signup")
        {
            const usernameValidationMessage = getUsernameValidationMessage(normalizedUsername);

            if (usernameValidationMessage)
            {
                setErrorMessage(usernameValidationMessage);
                return;
            }
        }

        if (password.length < minPasswordLength)
        {
            setErrorMessage(`Password must be at least ${minPasswordLength} characters.`);
            return;
        }

        if (mode === "signup" && password !== confirmPassword)
        {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try
        {
            let authSession: AuthSession;

            if (mode === "signup")
            {
                const isUsernameAvailable = await checkUsernameAvailability(normalizedUsername);

                if (!isUsernameAvailable)
                {
                    setErrorMessage("That username is already taken. Try another one.");
                    setIsSubmitting(false);
                    return;
                }

                authSession = await signUpWithEmail(normalizedEmail, password, normalizedUsername);
            }
            else
            {
                authSession = await signInWithEmail(normalizedEmail, password);
            }

            onAuthSuccess(authSession);
        }
        catch (caughtError)
        {
            setErrorMessage(getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsSubmitting(false);
        }
    };
    const handleSendReset = async (): Promise<void> =>
    {
        const normalizedEmail = normalizeField(resetEmail).toLowerCase();

        if (!isConfigured)
        {
            setResetMessage("Firebase configuration is missing.");
            return;
        }

        if (!isValidEmail(normalizedEmail))
        {
            setResetMessage("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);
        setResetMessage(null);

        try
        {
            await sendSeenPasswordResetEmail(normalizedEmail);
            setResetMessage("Password reset email sent. Check your inbox.");
        }
        catch (caughtError)
        {
            setResetMessage(getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsSubmitting(false);
        }
    };

    const handleGoogleAuth = async (): Promise<void> =>
    {
        if (!isConfigured)
        {
            setErrorMessage("Firebase configuration is missing. Add EXPO_PUBLIC_FIREBASE_* values to Seen/.env.");
            return;
        }

        if (!isGoogleConfigured)
        {
            const requiredEnvKey = getGoogleEnvKeyForCurrentPlatform();
            setErrorMessage(`Google sign-in is not configured for this device. Add ${requiredEnvKey} to Seen/.env.`);
            return;
        }

        setErrorMessage(null);
        setIsSubmitting(true);

        try
        {
            const authResult = await promptGoogleAuth();

            if (authResult.type === "error")
            {
                const providerError = (authResult as { error?: { message?: string } }).error;
                setErrorMessage(providerError?.message ?? "Google sign-in failed.");
                setIsSubmitting(false);
            }

            if (authResult.type === "dismiss" || authResult.type === "cancel")
            {
                setIsSubmitting(false);
            }
        }
        catch (caughtError)
        {
            setIsSubmitting(false);
            setErrorMessage(getErrorMessageFromUnknown(caughtError));
        }
    };

    const actionLabel = mode === "signup"
        ? "Create Account"
        : "Log In";

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.container}>
                    <View style={styles.headerBlock}>
                        <Text style={styles.appName}>Seen</Text>
                        <Text style={styles.subtitle}>Sign in to access your feed and profile.</Text>
                    </View>

                    <View style={styles.modeSwitchRow}>
                        <Pressable
                            style={[
                                styles.modeButton,
                                mode === "login" ? styles.modeButtonActive : null,
                            ]}
                            onPress={() => switchMode("login")}
                        >
                            <Text style={[
                                styles.modeButtonLabel,
                                mode === "login" ? styles.modeButtonLabelActive : null,
                            ]}
                            >
                                Log In
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.modeButton,
                                mode === "signup" ? styles.modeButtonActive : null,
                            ]}
                            onPress={() => switchMode("signup")}
                        >
                            <Text style={[
                                styles.modeButtonLabel,
                                mode === "signup" ? styles.modeButtonLabelActive : null,
                            ]}
                            >
                                Sign Up
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.formCard}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!isSubmitting}
                        />

                        {mode === "signup" ? (
                            <TextInput
                                style={styles.input}
                                placeholder="Username (a-z, 0-9, _)"
                                autoCapitalize="none"
                                value={username}
                                onChangeText={setUsername}
                                editable={!isSubmitting}
                            />
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                            editable={!isSubmitting}
                        />

                        {mode === "login" ? (
                            <Pressable
                                onPress={() =>
                                {
                                    const normalizedEmail = normalizeField(email).toLowerCase();

                                    if (normalizedEmail.length > 0)
                                    {
                                        setResetEmail(normalizedEmail);
                                    }
                                    else
                                    {
                                        setResetEmail("");
                                    }

                                    setResetMessage(null);
                                    setIsResetOpen(true);
                                }}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.secondaryActionText}>Forgot password?</Text>
                            </Pressable>
                        ) : null}

                        {mode === "signup" ? (
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                secureTextEntry={true}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!isSubmitting}
                            />
                        ) : null}

                        {errorMessage ? (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        ) : null}

                        <Pressable
                            style={[
                                styles.primaryButton,
                                isSubmitting ? styles.disabledButton : null,
                            ]}
                            onPress={() =>
                            {
                                void handleEmailAuth();
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.primaryButtonLabel}>{actionLabel}</Text>
                            )}
                        </Pressable>

                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerLabel}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Pressable
                            style={[
                                styles.googleButton,
                                (!googleRequest || isSubmitting || !isGoogleConfigured) ? styles.disabledButton : null,
                            ]}
                            onPress={() =>
                            {
                                void handleGoogleAuth();
                            }}
                            disabled={!googleRequest || isSubmitting || !isGoogleConfigured}
                        >
                            <Text style={styles.googleButtonLabel}>Continue with Google</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
                <Modal
                    visible={isResetOpen}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsResetOpen(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Reset password</Text>
                            <Text style={styles.modalSubtitle}>
                                Enter your email address and we’ll send you a reset link.
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={resetEmail}
                                onChangeText={setResetEmail}
                                editable={!isSubmitting}
                            />

                            {resetMessage ? (
                                <Text style={styles.resetMessageText}>{resetMessage}</Text>
                            ) : null}

                            <Pressable
                                style={[
                                    styles.primaryButton,
                                    isSubmitting ? styles.disabledButton : null,
                                ]}
                                onPress={() =>
                                {
                                    void handleSendReset();
                                }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.primaryButtonLabel}>Reset password</Text>
                                )}
                            </Pressable>

                            <Pressable
                                style={styles.modalSecondaryButton}
                                onPress={() =>
                                {
                                    setIsResetOpen(false);
                                    setResetMessage(null);
                                }}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create(
{
    safeArea:
    {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    keyboardAvoidingView:
    {
        flex: 1,
    },
    container:
    {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 18,
        justifyContent: "center",
    },
    headerBlock:
    {
        marginBottom: 16,
    },
    appName:
    {
        fontSize: 34,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 6,
    },
    subtitle:
    {
        fontSize: 14,
        color: "#475569",
    },
    modeSwitchRow:
    {
        flexDirection: "row",
        backgroundColor: "#e2e8f0",
        borderRadius: 12,
        padding: 4,
        marginBottom: 14,
    },
    modeButton:
    {
        flex: 1,
        minHeight: 40,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    modeButtonActive:
    {
        backgroundColor: "#ffffff",
    },
    modeButtonLabel:
    {
        fontSize: 14,
        color: "#475569",
        fontWeight: "600",
    },
    modeButtonLabelActive:
    {
        color: "#0f172a",
    },
    formCard:
    {
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#d8e0ea",
        padding: 14,
    },
    input:
    {
        minHeight: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#d1d9e3",
        paddingHorizontal: 12,
        fontSize: 15,
        color: "#0f172a",
        marginBottom: 10,
        backgroundColor: "#f8fafc",
    },
    errorText:
    {
        fontSize: 13,
        color: "#b91c1c",
        marginBottom: 10,
    },
    primaryButton:
    {
        minHeight: 46,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f766e",
        marginBottom: 12,
    },
    primaryButtonLabel:
    {
        fontSize: 15,
        fontWeight: "700",
        color: "#ffffff",
    },
    dividerRow:
    {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    dividerLine:
    {
        flex: 1,
        height: 1,
        backgroundColor: "#d8e0ea",
    },
    dividerLabel:
    {
        fontSize: 12,
        color: "#64748b",
        paddingHorizontal: 8,
    },
    googleButton:
    {
        minHeight: 46,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
    },
    googleButtonLabel:
    {
        fontSize: 15,
        fontWeight: "600",
        color: "#0f172a",
    },
    disabledButton:
    {
        opacity: 0.6,
    },

    secondaryActionText:
{
    fontSize: 13,
    color: "#0f766e",
    marginBottom: 10,
    fontWeight: "600",
},

modalOverlay:
{
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
},

modalCard:
{
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d8e0ea",
},

modalTitle:
{
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
},

modalSubtitle:
{
    fontSize: 14,
    color: "#475569",
    marginBottom: 14,
},

resetMessageText:
{
    fontSize: 13,
    color: "#b91c1c",
    marginBottom: 10,
},

modalSecondaryButton:
{
    minHeight: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
},

modalSecondaryButtonText:
{
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
},
});
