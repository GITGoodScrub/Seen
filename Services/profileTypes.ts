export type ProfileRecord = {
    userId: number;
    username: string | null;
    displayName: string | null;
    profilePhoto: string | null;
    bio: string | null;
    locationId: number | null;
    isVerified: boolean;
};

export type ProfileResponse = {
    profile: ProfileRecord;
};

export type ProfileUpdateInput = {
    displayName: string;
    profilePhoto: string;
    bio: string;
};
