import { TagItem } from "./tagTypes";

export type ArtistSuggestion = {
    artistId: number;
    userId: number;
    username: string | null;
    name: string;
    photo: string | null;
    score: number;
    isFollowed: boolean;
};

export type InterestSetup = {
    selectedTags: TagItem[];
    selectedTagIds: number[];
    genreTags: TagItem[];
    eventTypeTags: TagItem[];
    recommendedArtists: ArtistSuggestion[];
    shouldShowOnboarding: boolean;
    onboardingSeen: boolean;
};

export type InterestSetupResponse = InterestSetup & {
    error?: string;
};

export type SkipInterestsOnboardingResponse = {
    ok?: boolean;
    error?: string;
};
