import { requestJsonWithFailover } from "./apiClientService";
import {
    CreatePostRequest,
    CreatePostResponse,
    CreatedPost,
    FeedPost,
    PostsFeedResponse,
} from "./postTypes";
import {
    CreateCommentResponse,
    PostComment,
    PostCommentsResponse,
    ToggleLikeResponse,
} from "./postTypes";

const postByIdRoute = (id: number): string => `/api/posts/${id}`;
const postsRoute = "/api/posts";
const postLikesRoute = "/api/postLikes";
const commentsRoute = "/api/comments";

const isCreatedPost = (value: unknown): value is CreatedPost =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const candidate = value as {
        id?: unknown;
        username?: unknown;
        venueName?: unknown;
        createdAt?: unknown;
    };

    return (
        typeof candidate.id === "number"
        && (candidate.username === null || typeof candidate.username === "string")
        && (candidate.venueName === null || typeof candidate.venueName === "string")
        && typeof candidate.createdAt === "string"
    );
};

const isFeedPost = (value: unknown): value is FeedPost =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const candidate = value as {
        id?: unknown;
        authorUserId?: unknown;
        username?: unknown;
        authorProfilePhoto?: unknown;
        venueName?: unknown;
        text?: unknown;
        photoURL?: unknown;
        createdAt?: unknown;
    };

    return (
        typeof candidate.id === "number"
        && typeof candidate.authorUserId === "number"
        && (candidate.username === null || typeof candidate.username === "string")
        && (candidate.authorProfilePhoto === null || typeof candidate.authorProfilePhoto === "string")
        && (candidate.venueName === null || typeof candidate.venueName === "string")
        && typeof candidate.text === "string"
        && (candidate.photoURL === null || typeof candidate.photoURL === "string")
        && typeof candidate.createdAt === "string"
        && typeof (candidate as Record<string, unknown>).likeCount === "number"
        && typeof (candidate as Record<string, unknown>).isLikedByCurrentUser === "boolean"
        && typeof (candidate as Record<string, unknown>).commentCount === "number"
    );
};

const isPostComment = (value: unknown): value is PostComment =>
{
    if (!value || typeof value !== "object")
    {
        return false;
    }

    const c = value as Record<string, unknown>;

    return (
        typeof c.id === "number"
        && (c.authorUsername === null || typeof c.authorUsername === "string")
        && typeof c.text === "string"
        && typeof c.createdAt === "string"
    );
};

export const loadFeedPosts = async (): Promise<FeedPost[]> =>
{
    const response = await requestJsonWithFailover<PostsFeedResponse>(postsRoute);

    if (!Array.isArray(response.post))
    {
        return [];
    }

    return response.post.filter(
        (entry) => isFeedPost(entry),
    );
};

export const createPost = async (
    request: CreatePostRequest,
): Promise<CreatedPost> =>
{
    const trimmedText = request.text.trim();

    if (trimmedText.length === 0)
    {
        throw new Error("Post text cannot be empty.");
    }

    const bodyPayload: {
        text: string;
        photoURL?: string;
    } = {
        text: trimmedText,
    };

    const trimmedPhotoUrl = request.photoURL?.trim();

    if (trimmedPhotoUrl)
    {
        bodyPayload.photoURL = trimmedPhotoUrl;
    }

    const response = await requestJsonWithFailover<CreatePostResponse>(
        postsRoute,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyPayload),
        },
    );

    if (!isCreatedPost(response.post))
    {
        throw new Error("Failed to parse created post response.");
    }

    return response.post;
};

export const deletePost = async (postId: number): Promise<void> =>
{
    await requestJsonWithFailover<Record<string, never>>(
        postByIdRoute(postId),
        { method: "DELETE" },
    );
};

export const togglePostLike = async (postId: number): Promise<boolean> =>
{
    const response = await requestJsonWithFailover<ToggleLikeResponse>(
        postLikesRoute,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId }),
        },
    );

    if (typeof response.liked !== "boolean")
    {
        throw new Error("Failed to parse like response.");
    }

    return response.liked;
};

export const loadPostComments = async (postId: number): Promise<PostComment[]> =>
{
    const response = await requestJsonWithFailover<PostCommentsResponse>(
        `${commentsRoute}?postId=${postId}`,
    );

    if (!Array.isArray(response.comments))
    {
        return [];
    }

    return response.comments.filter((entry) => isPostComment(entry));
};

export const createPostComment = async (postId: number, text: string): Promise<PostComment> =>
{
    const trimmed = text.trim();

    if (trimmed.length === 0)
    {
        throw new Error("Comment text cannot be empty.");
    }

    const response = await requestJsonWithFailover<CreateCommentResponse>(
        commentsRoute,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, text: trimmed }),
        },
    );

    if (!isPostComment(response.comment))
    {
        throw new Error("Failed to parse comment response.");
    }

    return response.comment;
};
