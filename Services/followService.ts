import { requestJsonWithFailover } from "./apiClientService";
import {
    FollowListType,
    FollowsResponse,
    FollowSnapshot,
    FollowToggleResponse,
    FollowUser,
} from "./followTypes";

const followsRoute = "/api/follows";

const isFollowUser = (value: unknown): value is FollowUser =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const candidate = value as {
        userId?: unknown;
        username?: unknown;
        createdAt?: unknown;
    };

    return (
        typeof candidate.userId === "number"
        && (candidate.username === null || typeof candidate.username === "string")
        && typeof candidate.createdAt === "string"
    );
};

const normalizeFollowUsers = (value: unknown): FollowUser[] =>
{
    if (!Array.isArray(value))
    {
        return [];
    }

    return value.filter(
        (entry) => isFollowUser(entry),
    );
};

export const loadFollowSnapshot = async (
    targetUserId: number,
    viewerUserId: number,
): Promise<FollowSnapshot> =>
{
    const response = await requestJsonWithFailover<FollowsResponse>(
        `${followsRoute}?userId=${targetUserId}`,
    );

    const following = normalizeFollowUsers(response.following);
    const followers = normalizeFollowUsers(response.followers);

    return {
        followingCount: following.length,
        followersCount: followers.length,
        isFollowingTarget: followers.some(
            (entry) => entry.userId === viewerUserId,
        ),
    };
};

export const loadFollowUsers = async (
    userId: number,
    listType: FollowListType,
): Promise<FollowUser[]> =>
{
    const response = await requestJsonWithFailover<FollowsResponse>(
        `${followsRoute}?userId=${userId}&type=${listType}`,
    );

    if (listType === "followers")
    {
        return normalizeFollowUsers(response.followers);
    }

    return normalizeFollowUsers(response.following);
};

export const toggleFollowUser = async (followedUserId: number): Promise<boolean> =>
{
    const response = await requestJsonWithFailover<FollowToggleResponse>(
        followsRoute,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    followedUserId,
                },
            ),
        },
    );

    return response.followed === true;
};
