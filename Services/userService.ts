import { UserItem, UsersResponse } from "./types";

const usersRoute = "/api/users";

const normalizeBaseUrl = (baseUrl: string): string =>
{
    return baseUrl.replace(/\/+$/, "");
};

const getApiBaseUrl = (): string =>
{
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

    if (!baseUrl || !baseUrl.trim())
    {
        throw new Error("EXPO_PUBLIC_API_BASE_URL is not set");
    }

    return normalizeBaseUrl(baseUrl.trim());
};

export const loadUsers = async (): Promise<UserItem[]> =>
{
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}${usersRoute}`);

    if (!response.ok)
    {
        throw new Error(`Request failed with ${response.status}`);
    }

    const payload = (await response.json()) as UsersResponse;

    if (!Array.isArray(payload.users))
    {
        return [];
    }

    return payload.users;
};
