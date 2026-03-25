export type FollowUser = {
    userId: number;
    username: string | null;
    createdAt: string;
};

export type FollowListType = "followers" | "following";

export type FollowsResponse = {
    following?: FollowUser[];
    followers?: FollowUser[];
};

export type FollowToggleResponse = {
    followed: boolean;
};

export type FollowSnapshot = {
    followingCount: number;
    followersCount: number;
    isFollowingTarget: boolean;
};
