export type SavedEventItem = {
    userId: number;
    username: string | null;
    eventId: number;
    eventTitle: string | null;
    eventStartTime: string;
    seriesId: number;
    seriesTitle: string;
    seriesPosterURL: string | null;
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
