export type AuthProfile = {
    displayName: string | null;
    profilePhoto: string | null;
    bio: string | null;
    locationId: number | null;
    isVerified: boolean;
};

export type AuthUser = {
    id: number;
    firebaseUid: string | null;
    email: string | null;
    username: string | null;
    type: string;
    createdAt: string;
    profile?: AuthProfile | null;
};

export type VerifyAuthResponse = {
    ok: boolean;
    user: AuthUser;
};

export type AuthSession = {
    idToken: string;
    user: AuthUser;
};

export type GoogleTokenSet = {
    idToken?: string | null;
    accessToken?: string | null;
};
