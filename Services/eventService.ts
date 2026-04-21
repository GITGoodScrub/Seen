import { requestJsonWithFailover } from "./apiClientService";
import {
    CreateEventOccurrenceRequest,
    CreateEventOccurrenceResponse,
    CreateEventSeriesRequest,
    CreateEventSeriesResponse,
    CreateSeriesReviewRequest,
    CreatedEventOccurrence,
    EventOccurrenceDetail,
    EventSeriesDetail,
    EventSeriesDetailResponse,
    EventSeriesFeedResponse,
    EventSeriesItem,
    UpdateEventSeriesRequest,
} from "./eventTypes";

const eventSeriesRoute = "/api/eventSeries";
const eventSeriesDetailRoute = (id: number): string => `/api/eventSeries/${id}`;
const createEventOccurrenceRoute = "/api/createEventOccurance";
const eventArtistsRoute = "/api/eventArtists";
const seriesReviewsRoute = "/api/seriesReviews";

// ─── Type guards ─────────────────────────────────────────────────────────────

const isEventSeriesItem = (value: unknown): value is EventSeriesItem =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as {
        id?: unknown;
        title?: unknown;
        venueName?: unknown;
        venueLatitude?: unknown;
        venueLongitude?: unknown;
        status?: unknown;
        createdAt?: unknown;
        nextOccurrenceId?: unknown;
        averageRating?: unknown;
        reviewCount?: unknown;
        tags?: unknown;
    };

    const hasValidTags = Array.isArray(c.tags)
        && c.tags.every(
            (tag) =>
            {
                if (!tag || typeof tag !== "object")
                {
                    return false;
                }

                const typedTag = tag as {
                    tagId?: unknown;
                    name?: unknown;
                    tagType?: unknown;
                };

                return (
                    typeof typedTag.tagId === "number"
                    && typeof typedTag.name === "string"
                    && (typedTag.tagType === null || typeof typedTag.tagType === "string")
                );
            },
        );

    return (
        typeof c.id === "number"
        && typeof c.title === "string"
        && typeof c.venueName === "string"
        && typeof c.venueLatitude === "number"
        && typeof c.venueLongitude === "number"
        && typeof c.status === "string"
        && typeof c.createdAt === "string"
        && (c.nextOccurrenceId === null || typeof c.nextOccurrenceId === "number")
        && (c.averageRating === null || typeof c.averageRating === "number")
        && typeof c.reviewCount === "number"
        && hasValidTags
    );
};

const isEventSeriesFeedResponse = (value: unknown): value is EventSeriesFeedResponse =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as { eventSeries?: unknown };
    return Array.isArray(c.eventSeries) && c.eventSeries.every(isEventSeriesItem);
};

const isEventSeriesDetail = (value: unknown): value is EventSeriesDetail =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as {
        id?: unknown;
        venueId?: unknown;
        title?: unknown;
        venueName?: unknown;
        occurrences?: unknown;
    };

    return (
        typeof c.id === "number"
        && typeof c.venueId === "number"
        && typeof c.title === "string"
        && typeof c.venueName === "string"
        && Array.isArray(c.occurrences)
    );
};

const isEventSeriesDetailResponse = (value: unknown): value is EventSeriesDetailResponse =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as { eventSeries?: unknown };
    return isEventSeriesDetail(c.eventSeries);
};

const isCreatedEventOccurrence = (value: unknown): value is CreatedEventOccurrence =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as {
        id?: unknown;
        seriesId?: unknown;
        startTime?: unknown;
        status?: unknown;
    };

    return (
        typeof c.id === "number"
        && typeof c.seriesId === "number"
        && typeof c.startTime === "string"
        && typeof c.status === "string"
    );
};

const isCreateEventOccurrenceResponse = (value: unknown): value is CreateEventOccurrenceResponse =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as { eventOccurrence?: unknown };
    return isCreatedEventOccurrence(c.eventOccurrence);
};

const isCreateEventSeriesResponse = (value: unknown): value is CreateEventSeriesResponse =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as { eventSeries?: unknown };
    return isEventSeriesItem(c.eventSeries);
};

// ─── Service functions ────────────────────────────────────────────────────────

export const loadEventSeries = async (): Promise<EventSeriesItem[]> =>
{
    const response = await requestJsonWithFailover<EventSeriesFeedResponse>(eventSeriesRoute);

    if (!isEventSeriesFeedResponse(response))
    {
        throw new Error("Unexpected response loading event series");
    }

    return response.eventSeries;
};

export const loadEventSeriesDetail = async (id: number): Promise<EventSeriesDetail> =>
{
    const response = await requestJsonWithFailover<EventSeriesDetailResponse>(
        eventSeriesDetailRoute(id),
    );

    if (!isEventSeriesDetailResponse(response))
    {
        throw new Error("Unexpected response loading event series detail");
    }

    return response.eventSeries;
};

export const createEventSeries = async (
    request: CreateEventSeriesRequest,
): Promise<EventSeriesItem> =>
{
    const response = await requestJsonWithFailover<CreateEventSeriesResponse>(
        eventSeriesRoute,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        },
    );

    if (!isCreateEventSeriesResponse(response))
    {
        throw new Error("Unexpected response creating event series");
    }

    return response.eventSeries;
};

export const createEventOccurrence = async (
    request: CreateEventOccurrenceRequest,
): Promise<CreatedEventOccurrence> =>
{
    const response = await requestJsonWithFailover<CreateEventOccurrenceResponse>(
        createEventOccurrenceRoute,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        },
    );

    if (!isCreateEventOccurrenceResponse(response))
    {
        throw new Error("Unexpected response creating event occurrence");
    }

    return response.eventOccurrence;
};

export const addArtistToOccurrence = async (
    occurrenceId: number,
    artistId: number,
): Promise<void> =>
{
    await requestJsonWithFailover<{ message: string }>(
        eventArtistsRoute,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ occurrenceId, artistId }),
        },
    );
};

export const removeArtistFromOccurrence = async (
    occurrenceId: number,
    artistId: number,
): Promise<void> =>
{
    await requestJsonWithFailover<{ message: string }>(
        eventArtistsRoute,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ occurrenceId, artistId }),
        },
    );
};

export const createSeriesReview = async (
    request: CreateSeriesReviewRequest,
): Promise<void> =>
{
    await requestJsonWithFailover<{ seriesReview: unknown }>(
        seriesReviewsRoute,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        },
    );
};

export const updateEventSeries = async (
    eventSeriesId: number,
    request: UpdateEventSeriesRequest,
): Promise<void> =>
{
    await requestJsonWithFailover<{ message: string }>(
        eventSeriesDetailRoute(eventSeriesId),
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        },
    );
};

export const deleteEventSeries = async (eventSeriesId: number): Promise<void> =>
{
    await requestJsonWithFailover<{ message: string }>(
        eventSeriesDetailRoute(eventSeriesId),
        {
            method: "DELETE",
        },
    );
};
