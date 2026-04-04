export type SearchSuggestion = {
    id: string;
    title: string;
    subtitle: string;
};

export type SearchResultType = "user" | "venue" | "event";

export type SearchResult = {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle: string;
    isVerified?: boolean;
};

export type SearchResponse = {
    query: string;
    results: SearchResult[];
};
