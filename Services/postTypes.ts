export type CreatedPost = {
    id: number;
    username: string | null;
    venueName: string | null;
    createdAt: string;
};

export type FeedPost = {
    id: number;
    authorUserId: number;
    username: string | null;
    authorProfilePhoto: string | null;
    venueName: string | null;
    text: string;
    photoURL: string | null;
    createdAt: string;
    likeCount: number;
    isLikedByCurrentUser: boolean;
    commentCount: number;
};

export type PostComment = {
    id: number;
    authorUsername: string | null;
    text: string;
    createdAt: string;
};

export type ToggleLikeResponse = {
    liked?: boolean;
    error?: string;
};

export type PostCommentsResponse = {
    comments?: PostComment[];
    error?: string;
};

export type CreateCommentRequest = {
    postId: number;
    text: string;
};

export type CreateCommentResponse = {
    comment?: PostComment;
    error?: string;
};

export type CreatePostRequest = {
    text: string;
    photoURL?: string;
};

export type CreatePostResponse = {
    post?: CreatedPost;
    error?: string;
};

export type PostsFeedResponse = {
    post?: FeedPost[];
    error?: string;
};
