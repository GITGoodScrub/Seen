export type ProfileActivityType = "post" | "seriesReview" | "venueReview";

export type ProfileActivityItem = {
    id: string;
    type: ProfileActivityType;
    createdAt: string;
    text: string;
    rating: number | null;
    targetName: string | null;
};

export type ProfileRecord = {
    userId: number;
    username: string | null;
    displayName: string | null;
    profilePhoto: string | null;
    bio: string | null;
    locationId: number | null;
    isVerified: boolean;
    activity?: ProfileActivityItem[];
};

export type ProfileResponse = {
    profile: ProfileRecord;
};

export type ProfileUpdateInput = {
    displayName: string;
    profilePhoto: string;
    bio: string;
};
