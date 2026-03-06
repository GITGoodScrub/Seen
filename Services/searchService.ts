import { SearchSuggestion } from "./searchTypes";

const maxRecentSearchCount = 6;

// Placeholder source list until backend-powered recommendations are implemented.
const placeholderSuggestions: SearchSuggestion[] = [
    {
        id: "event-jazz-night",
        title: "Jazz Night at Hljomaholl",
        subtitle: "Event · Friday 20:00",
    },
    {
        id: "venue-harpa",
        title: "Harpa",
        subtitle: "Venue · Reykjavik",
    },
    {
        id: "artist-aurora-north",
        title: "Aurora North",
        subtitle: "Artist · Electronic",
    },
    {
        id: "event-indie-saturday",
        title: "Indie Saturday",
        subtitle: "Event · Saturday 22:00",
    },
    {
        id: "venue-gaukurinn",
        title: "Gaukurinn",
        subtitle: "Venue · Live music",
    },
    {
        id: "artist-solar-tide",
        title: "Solar Tide",
        subtitle: "Artist · Alternative",
    },
    {
        id: "event-open-mic",
        title: "Open Mic Session",
        subtitle: "Event · Community",
    },
    {
        id: "event-house-social",
        title: "House Social",
        subtitle: "Event · Club night",
    },
];

const normalizeSearchQuery = (searchQuery: string): string =>
{
    return searchQuery.trim().toLowerCase();
};

export const getDefaultRecentSearches = (): string[] =>
{
    return [
        "Harpa",
        "Jazz events",
        "Electronic artists",
    ];
};

export const buildUpdatedRecentSearches = (
    currentRecentSearches: string[],
    searchQuery: string,
): string[] =>
{
    const normalizedSearchQuery = normalizeSearchQuery(searchQuery);

    if (!normalizedSearchQuery)
    {
        return currentRecentSearches;
    }

    const trimmedQuery = searchQuery.trim();
    const dedupedSearches = currentRecentSearches.filter(
        (entry) => normalizeSearchQuery(entry) !== normalizedSearchQuery,
    );

    return [
        trimmedQuery,
        ...dedupedSearches,
    ].slice(0, maxRecentSearchCount);
};

export const getSearchRecommendations = (searchQuery: string): SearchSuggestion[] =>
{
    const normalizedSearchQuery = normalizeSearchQuery(searchQuery);

    if (!normalizedSearchQuery)
    {
        return [];
    }

    return placeholderSuggestions
        .filter(
            (suggestion) =>
            {
                const searchableText = `${suggestion.title} ${suggestion.subtitle}`.toLowerCase();
                return searchableText.includes(normalizedSearchQuery);
            },
        )
        .slice(0, 8);
};
