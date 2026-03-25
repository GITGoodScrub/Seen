import { requestJsonWithFailover } from "./apiClientService";
import { SearchResponse, SearchResult } from "./searchTypes";

const maxRecentSearchCount = 6;
const minSearchQueryLength = 2;
const searchRoute = "/api/search";

const normalizeSearchQuery = (searchQuery: string): string =>
{
    return searchQuery.trim().toLowerCase();
};

const isSearchResult = (value: unknown): value is SearchResult =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const candidate = value as {
        id?: unknown;
        type?: unknown;
        title?: unknown;
        subtitle?: unknown;
    };

    return (
        typeof candidate.id === "string"
        && (candidate.type === "user" || candidate.type === "venue" || candidate.type === "post")
        && typeof candidate.title === "string"
        && typeof candidate.subtitle === "string"
    );
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

export const loadSearchResults = async (searchQuery: string): Promise<SearchResult[]> =>
{
    const normalizedSearchQuery = normalizeSearchQuery(searchQuery);

    if (normalizedSearchQuery.length < minSearchQueryLength)
    {
        return [];
    }

    const encodedQuery = encodeURIComponent(searchQuery.trim());
    const payload = await requestJsonWithFailover<unknown>(`${searchRoute}?q=${encodedQuery}`);

    if (!payload || typeof payload !== "object")
    {
        return [];
    }

    const response = payload as SearchResponse;

    if (!Array.isArray(response.results))
    {
        return [];
    }

    return response.results.filter(
        (entry) => isSearchResult(entry),
    );
};
