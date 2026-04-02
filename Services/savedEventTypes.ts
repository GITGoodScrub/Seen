export type SavedEventItem = {
    userId: number;
    username: string | null;
    eventId: number;
    eventTitle: string | null;
    eventStartTime: string;
    seriesId: number;
    seriesTitle: string;
    venueName: string;
};

export type SavedEventsResponse = {
    savedEvents: SavedEventItem[];
};

export type SavedEventResponse = {
    savedEvent: SavedEventItem;
};
