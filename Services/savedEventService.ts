import { requestJsonWithFailover } from "./apiClientService";
import { SavedEventItem, SavedEventsResponse } from "./savedEventTypes";

const savedEventsRoute = "/api/savedEvents";

const isSavedEventItem = (value: unknown): value is SavedEventItem =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as Record<string, unknown>;

    return (
        typeof c.userId === "number"
        && (c.username === null || typeof c.username === "string")
        && typeof c.eventId === "number"
        && (c.eventTitle === null || typeof c.eventTitle === "string")
        && typeof c.eventStartTime === "string"
        && typeof c.seriesId === "number"
        && typeof c.seriesTitle === "string"
        && typeof c.venueName === "string"
        && (c.averageRating === null || typeof c.averageRating === "number")
        && typeof c.reviewCount === "number"
    );
};

export const loadSavedEvents = async (): Promise<SavedEventItem[]> =>
{
    const response = await requestJsonWithFailover<SavedEventsResponse>(savedEventsRoute);

    if (!Array.isArray(response.savedEvents))
    {
        return [];
    }

    return response.savedEvents.filter(isSavedEventItem);
};

export const saveEvent = async (eventId: number): Promise<void> =>
{
    await requestJsonWithFailover<{ savedEvent: SavedEventItem }>(
        savedEventsRoute,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId }),
        },
    );
};

export const unsaveEvent = async (eventId: number): Promise<void> =>
{
    await requestJsonWithFailover<{ message: string }>(
        savedEventsRoute,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId }),
        },
    );
};
