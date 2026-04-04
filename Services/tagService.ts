import { requestJsonWithFailover } from "./apiClientService";
import { TagItem, TagsResponse } from "./tagTypes";

const tagsRoute = "/api/tags";

const isTagItem = (value: unknown): value is TagItem =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const candidate = value as { name?: unknown };
    return typeof candidate.name === "string" && candidate.name.trim().length > 0;
};

export const loadTags = async (): Promise<TagItem[]> =>
{
    const response = await requestJsonWithFailover<TagsResponse>(tagsRoute);

    if (!response || !Array.isArray(response.tags))
    {
        return [];
    }

    return response.tags.filter((entry) => isTagItem(entry));
};
