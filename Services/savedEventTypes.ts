export type SavedEventItem = {
    userId: number;
    username: string | null;
    eventId: number;
    eventTitle: string | null;
    eventStartTime: string;
    seriesId: number;
    seriesTitle: string;
    venueName: string;
    averageRating: number | null;
    reviewCount: number;
};

export type SavedEventsResponse = {
    savedEvents: SavedEventItem[];
};

export type SavedEventResponse = {
    savedEvent: SavedEventItem;
};
