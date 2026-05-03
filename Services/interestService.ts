import { requestJsonWithFailover } from "./apiClientService";
import {
    InterestSetup,
    InterestSetupResponse,
    SkipInterestsOnboardingResponse,
} from "./interestTypes";

const interestsRoute = "/api/interests";

export const loadInterestSetup = async (): Promise<InterestSetup> =>
{
    return requestJsonWithFailover<InterestSetupResponse>(interestsRoute);
};

export const saveUserInterests = async (tagIds: number[]): Promise<InterestSetup> =>
{
    return requestJsonWithFailover<InterestSetupResponse>(
        interestsRoute,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    tagIds,
                },
            ),
        },
    );
};

export const skipInterestsOnboarding = async (): Promise<void> =>
{
    const response = await requestJsonWithFailover<SkipInterestsOnboardingResponse>(
        interestsRoute,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        },
    );

    if (response.ok !== true)
    {
        throw new Error("Failed to skip interests onboarding.");
    }
};
