export type VenueReviewItem = {
    reviewId: number;
    username: string | null;
    rating: number;
    text: string;
    visibility: string;
    createdAt: string;
};

export type UpcomingVenueEventItem = {
    seriesId: number;
    occurrenceId: number;
    title: string;
    startTime: string;
    status: string;
    posterURL: string | null;
};

export type VenueDetail = {
    id: number;
    name: string;
    photo: string | null;
    bio: string | null;
    latitude: number;
    longitude: number;
    averageRating: number | null;
    reviewCount: number;
    reviews: VenueReviewItem[];
    upcomingEvents: UpcomingVenueEventItem[];
};

export type VenueDetailResponse = {
    venue: VenueDetail;
};

export type CreateVenueReviewRequest = {
    venueId: number;
    rating: number;
    text: string;
    visibility: string;
};
