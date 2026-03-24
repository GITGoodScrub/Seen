import { requestJsonWithFailover } from "./apiClientService";

const usernameRoute = "/api/username";
const usernamePattern = /^[a-z0-9_]{3,20}$/;

type UsernameAvailabilityResponse = {
    available: boolean;
    username: string;
};

type UsernameUpdateResponse = {
    ok: true;
    username: string;
};

export const normalizeUsername = (value: string): string =>
{
    return value.trim().toLowerCase();
};

export const isValidUsername = (value: string): boolean =>
{
    return usernamePattern.test(normalizeUsername(value));
};

export const getUsernameValidationMessage = (value: string): string | null =>
{
    if (!isValidUsername(value))
    {
        return "Username must be 3-20 characters and use only lowercase letters, numbers, or underscore.";
    }

    return null;
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> =>
{
    const normalizedUsername = normalizeUsername(username);
    const response = await requestJsonWithFailover<UsernameAvailabilityResponse>(
        `${usernameRoute}?username=${encodeURIComponent(normalizedUsername)}`,
    );

    return response.available;
};

export const setCurrentUsername = async (username: string): Promise<string> =>
{
    const normalizedUsername = normalizeUsername(username);
    const response = await requestJsonWithFailover<UsernameUpdateResponse>(
        usernameRoute,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    username: normalizedUsername,
                },
            ),
        },
    );

    return response.username;
};
