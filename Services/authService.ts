import { getApp, getApps, initializeApp } from "firebase/app";
import {
    Auth,
    GoogleAuthProvider,
    User,
    createUserWithEmailAndPassword,
    getAuth,
    getReactNativePersistence,
    initializeAuth,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { requestJsonWithFailover, setApiAuthToken } from "./apiClientService";
import { AuthSession, GoogleTokenSet, VerifyAuthResponse } from "./authTypes";
import { setCurrentUsername } from "./usernameService";

const authVerifyRoute = "/api/auth/verify";
type AuthIntent = "login" | "signup";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let cachedFirebaseAuth: Auth | null = null;

const getMissingFirebaseConfigKeys = (): string[] =>
{
    const requiredConfigEntries: Array<{
        key: string;
        value: string | undefined;
    }> = [
        {
            key: "EXPO_PUBLIC_FIREBASE_API_KEY",
            value: firebaseConfig.apiKey,
        },
        {
            key: "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
            value: firebaseConfig.authDomain,
        },
        {
            key: "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
            value: firebaseConfig.projectId,
        },
        {
            key: "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
            value: firebaseConfig.storageBucket,
        },
        {
            key: "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
            value: firebaseConfig.messagingSenderId,
        },
        {
            key: "EXPO_PUBLIC_FIREBASE_APP_ID",
            value: firebaseConfig.appId,
        },
    ];

    return requiredConfigEntries
        .filter(
            (entry) => !entry.value,
        )
        .map(
            (entry) => entry.key,
        );
};

const getFirebaseConfigError = (): string =>
{
    const missingKeys = getMissingFirebaseConfigKeys();

    if (missingKeys.length === 0)
    {
        return "Firebase configuration is missing.";
    }

    return `Missing Firebase env vars: ${missingKeys.join(", ")}`;
};

export const isFirebaseConfigured = (): boolean =>
{
    return getMissingFirebaseConfigKeys().length === 0;
};

export const getErrorMessageFromUnknown = (caughtError: unknown): string =>
{
    const errorWithCode = caughtError as {
        code?: unknown;
        message?: unknown;
    };

    if (typeof errorWithCode.code === "string")
    {
        if (errorWithCode.code === "auth/email-already-in-use")
        {
            return "An account with that email already exists. Log in instead, or use password reset if needed.";
        }

        if (errorWithCode.code === "auth/invalid-credential" || errorWithCode.code === "auth/wrong-password")
        {
            return "Incorrect email or password.";
        }
    }

    if (caughtError instanceof Error)
    {
        return caughtError.message;
    }

    return "Unexpected authentication error.";
};

const getFirebaseAuth = (): Auth =>
{
    if (!isFirebaseConfigured())
    {
        throw new Error(getFirebaseConfigError());
    }

    if (cachedFirebaseAuth)
    {
        return cachedFirebaseAuth;
    }

    const firebaseApp = getApps().length > 0
        ? getApp()
        : initializeApp(firebaseConfig);

    if (Platform.OS === "web")
    {
        cachedFirebaseAuth = getAuth(firebaseApp);
        return cachedFirebaseAuth;
    }

    try
    {
        cachedFirebaseAuth = initializeAuth(
            firebaseApp,
            {
                persistence: getReactNativePersistence(AsyncStorage),
            },
        );
    }
    catch
    {
        // initializeAuth throws when auth is already initialized; use existing instance in that case.
        cachedFirebaseAuth = getAuth(firebaseApp);
    }

    return cachedFirebaseAuth;
};

const verifyFirebaseTokenWithBackend = async (
    idToken: string,
    intent: AuthIntent = "login",
): Promise<AuthSession> =>
{
    const responsePayload = await requestJsonWithFailover<VerifyAuthResponse>(
        `${authVerifyRoute}?intent=${intent}`,
        {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        },
    );

    if (!responsePayload || responsePayload.ok !== true || !responsePayload.user)
    {
        throw new Error("Backend auth verification failed.");
    }

    setApiAuthToken(idToken);

    return {
        idToken,
        user: responsePayload.user,
    };
};

const finalizeFirebaseUserAuth = async (
    firebaseUser: User,
    intent: AuthIntent = "login",
): Promise<AuthSession> =>
{
    const idToken = await firebaseUser.getIdToken();
    return verifyFirebaseTokenWithBackend(idToken, intent);
};

export const signUpWithEmail = async (
    email: string,
    password: string,
    username: string,
): Promise<AuthSession> =>
{
    const auth = getFirebaseAuth();

    let credential: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>;

    try
    {
        credential = await createUserWithEmailAndPassword(auth, email, password);
    }
    catch (caughtError)
    {
        const errorWithCode = caughtError as {
            code?: unknown;
        };

        // If Firebase already has this email, treat signup as a DB account recovery flow.
        if (typeof errorWithCode.code === "string" && errorWithCode.code === "auth/email-already-in-use")
        {
            const existingCredential = await signInWithEmailAndPassword(auth, email, password);
            const recoveredSession = await finalizeFirebaseUserAuth(existingCredential.user, "signup");
            await setCurrentUsername(username);

            const refreshedToken = await existingCredential.user.getIdToken(true);
            return verifyFirebaseTokenWithBackend(refreshedToken, "signup");
        }

        throw caughtError;
    }

    try
    {
        const initialSession = await finalizeFirebaseUserAuth(credential.user, "signup");
        await setCurrentUsername(username);

        const refreshedToken = await credential.user.getIdToken(true);
        return verifyFirebaseTokenWithBackend(refreshedToken, "signup");
    }
    catch (caughtError)
    {
        try
        {
            await credential.user.delete();
        }
        catch
        {
            // If deletion fails we still surface the original signup error.
        }

        setApiAuthToken(null);
        throw caughtError;
    }
};

export const signInWithEmail = async (
    email: string,
    password: string,
): Promise<AuthSession> =>
{
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return finalizeFirebaseUserAuth(credential.user);
};

export const signInWithGoogle = async (
    tokenSet: GoogleTokenSet,
    intent: AuthIntent = "login",
): Promise<AuthSession> =>
{
    const auth = getFirebaseAuth();

    const idToken = tokenSet.idToken ?? null;
    const accessToken = tokenSet.accessToken ?? null;

    if (!idToken && !accessToken)
    {
        throw new Error("Google sign-in did not return a usable token.");
    }

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth, credential);

    return finalizeFirebaseUserAuth(userCredential.user, intent);
};

export const syncSessionWithBackend = async (
    firebaseUser: User,
): Promise<AuthSession> =>
{
    return finalizeFirebaseUserAuth(firebaseUser);
};

export const observeFirebaseAuthState = (
    onUserChanged: (firebaseUser: User | null) => void,
): (() => void) =>
{
    if (!isFirebaseConfigured())
    {
        setApiAuthToken(null);
        onUserChanged(null);

        return () =>
        {
            return;
        };
    }

    const auth = getFirebaseAuth();

    return onAuthStateChanged(
        auth,
        onUserChanged,
    );
};

export const logoutFromSeen = async (): Promise<void> =>
{
    setApiAuthToken(null);

    if (!isFirebaseConfigured())
    {
        return;
    }

    const auth = getFirebaseAuth();
    await signOut(auth);
};
