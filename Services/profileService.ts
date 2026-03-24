import { requestJsonWithFailover } from "./apiClientService";
import { ProfileResponse, ProfileUpdateInput, ProfileRecord } from "./profileTypes";

const profileRoute = "/api/profile";

export const loadProfileByUserId = async (userId: number): Promise<ProfileRecord> =>
{
    const response = await requestJsonWithFailover<ProfileResponse>(
        `${profileRoute}?userId=${userId}`,
    );

    return response.profile;
};

export const saveMyProfile = async (input: ProfileUpdateInput): Promise<ProfileRecord> =>
{
    const response = await requestJsonWithFailover<ProfileResponse>(
        profileRoute,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    displayName: input.displayName,
                    profilePhoto: input.profilePhoto,
                    bio: input.bio,
                },
            ),
        },
    );

    return response.profile;
};
