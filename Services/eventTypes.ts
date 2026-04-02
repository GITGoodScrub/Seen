export type EventSeriesItem = {
    id: number;
    title: string;
    description: string;
    posterURL: string | null;
    status: string;
    ageLimit: number | null;
    ticketURLBase: string | null;
    venueName: string;
    venueLatitude: number;
    venueLongitude: number;
    createdByUsername: string | null;
    createdAt: string;
    nextOccurrenceAt: string | null;
    nextOccurrenceId: number | null;
};

export type EventSeriesFeedResponse = {
    eventSeries: EventSeriesItem[];
};

export type EventArtistItem = {
    artistId: number;
    name: string;
    photo: string | null;
    username: string | null;
};

export type EventOccurrenceDetail = {
    id: number;
    title: string | null;
    startTime: string;
    durationMinutes: number | null;
    ticketURL: string | null;
    status: string;
    artists: EventArtistItem[];
};

export type EventSeriesDetail = {
    id: number;
    title: string;
    description: string;
    posterURL: string | null;
    status: string;
    ageLimit: number | null;
    ticketURLBase: string | null;
    createdByUsername: string | null;
    createdAt: string;
    venueName: string;
    venueLatitude: number;
    venueLongitude: number;
    venuePhoto: string | null;
    occurrences: EventOccurrenceDetail[];
};

export type EventSeriesDetailResponse = {
    eventSeries: EventSeriesDetail;
};

export type CreateEventSeriesRequest = {
    title: string;
    description: string;
    status: string;
    posterURL?: string;
    ageLimit?: number;
    ticketURLBase?: string;
};

export type CreateEventSeriesResponse = {
    eventSeries: EventSeriesItem;
};

export type CreateEventOccurrenceRequest = {
    seriesId: number;
    startTime: string;
    status: string;
    title?: string;
    durationMinutes?: number;
    ticketURL?: string;
};

export type CreatedEventOccurrence = {
    id: number;
    seriesId: number;
    seriesTitle: string;
    title: string | null;
    startTime: string;
    durationMinutes: number | null;
    ticketURL: string | null;
    status: string;
    createdAt: string;
};

export type CreateEventOccurrenceResponse = {
    eventOccurrence: CreatedEventOccurrence;
};
