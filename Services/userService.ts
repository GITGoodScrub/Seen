import { requestJsonWithFailover } from "./apiClientService";
import { UserItem, UsersResponse } from "./types";

const usersRoute = "/api/users";

const isUserItem = (value: unknown): value is UserItem =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const candidate = value as {
        id?: unknown;
        username?: unknown;
        type?: unknown;
    };

    return (
        typeof candidate.id === "number"
        && typeof candidate.username === "string"
        && typeof candidate.type === "string"
    );
};

const getUsersFromPayload = (payload: unknown): UserItem[] =>
{
    if (!payload || typeof payload !== "object")
    {
        return [];
    }

    const usersPayload = (payload as UsersResponse).users;

    if (!Array.isArray(usersPayload))
    {
        return [];
    }

    return usersPayload.filter(
        (entry) => isUserItem(entry),
    );
};

export const loadUsers = async (): Promise<UserItem[]> =>
{
    const payload = await requestJsonWithFailover<unknown>(usersRoute);
    return getUsersFromPayload(payload);
};
