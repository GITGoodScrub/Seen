import { requestJsonWithFailover } from "./apiClientService";
import { CreateVenueReviewRequest, VenueDetail, VenueDetailResponse } from "./venueTypes";

const venueDetailRoute = (id: number): string => `/api/venues/${id}`;
const venueReviewsRoute = "/api/venueReviews";

const isVenueDetail = (value: unknown): value is VenueDetail =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as Record<string, unknown>;

    return (
        typeof c.id === "number"
        && typeof c.name === "string"
        && (c.photo === null || typeof c.photo === "string")
        && (c.bio === null || typeof c.bio === "string")
        && typeof c.latitude === "number"
        && typeof c.longitude === "number"
        && (c.averageRating === null || typeof c.averageRating === "number")
        && typeof c.reviewCount === "number"
        && Array.isArray(c.reviews)
    );
};

export const loadVenueDetail = async (id: number): Promise<VenueDetail> =>
{
    const response = await requestJsonWithFailover<VenueDetailResponse>(venueDetailRoute(id));

    if (!response || !isVenueDetail(response.venue))
    {
        throw new Error("Unexpected response loading venue detail");
    }

    return response.venue;
};

export const createVenueReview = async (
    request: CreateVenueReviewRequest,
): Promise<void> =>
{
    await requestJsonWithFailover<{ venueReview: unknown }>(
        venueReviewsRoute,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        },
    );
};
