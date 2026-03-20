type RequestFailure = {
    baseUrl: string;
    reason: string;
};

const requestTimeoutMs = 7000;
const maxAttemptsPerBaseUrl = 2;
const retryDelayMs = 400;
const defaultApiBaseUrls = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.0.2.2:3000",
];

let preferredBaseUrl: string | null = null;
let apiAuthToken: string | null = null;

export const setApiAuthToken = (authToken: string | null): void =>
{
    apiAuthToken = authToken;
};

const normalizeBaseUrl = (baseUrl: string): string =>
{
    return baseUrl.replace(/\/+$/, "");
};

const normalizeRoute = (route: string): string =>
{
    if (route.startsWith("/"))
    {
        return route;
    }

    return `/${route}`;
};

const sleep = async (delayMs: number): Promise<void> =>
{
    await new Promise<void>(
        (resolve) =>
        {
            setTimeout(resolve, delayMs);
        },
    );
};

const parseBaseUrlList = (value: string | undefined): string[] =>
{
    if (!value)
    {
        return [];
    }

    return value
        .split(",")
        .map(
            (entry) => normalizeBaseUrl(entry.trim()),
        )
        .filter(
            (entry) => entry.length > 0,
        );
};

const getConfiguredBaseUrls = (): string[] =>
{
    const primaryBaseUrls = parseBaseUrlList(process.env.EXPO_PUBLIC_API_BASE_URL);
    const fallbackBaseUrls = parseBaseUrlList(process.env.EXPO_PUBLIC_API_BASE_URL_FALLBACKS);

    const configuredBaseUrls = [
        ...primaryBaseUrls,
        ...fallbackBaseUrls,
        ...defaultApiBaseUrls,
    ];

    return Array.from(new Set(configuredBaseUrls));
};

const getCandidateBaseUrls = (): string[] =>
{
    const configuredBaseUrls = getConfiguredBaseUrls();

    if (!preferredBaseUrl)
    {
        return configuredBaseUrls;
    }

    return Array.from(
        new Set([
            preferredBaseUrl,
            ...configuredBaseUrls,
        ]),
    );
};

const withAuthHeader = (requestInit: RequestInit): RequestInit =>
{
    if (!apiAuthToken)
    {
        return requestInit;
    }

    const headers = new Headers(requestInit.headers ?? {});

    if (!headers.has("Authorization"))
    {
        headers.set("Authorization", `Bearer ${apiAuthToken}`);
    }

    return {
        ...requestInit,
        headers,
    };
};

const shouldRetryResponse = (statusCode: number): boolean =>
{
    return statusCode === 429 || statusCode >= 500;
};

const getErrorMessage = (caughtError: unknown): string =>
{
    if (caughtError instanceof Error)
    {
        return caughtError.message;
    }

    return "Unknown error";
};

const summarizeFailures = (failures: RequestFailure[]): string =>
{
    if (failures.length === 0)
    {
        return "No hosts were available.";
    }

    const maxReportedFailures = 4;
    const compactFailures = failures.slice(0, maxReportedFailures);
    const compactSummary = compactFailures
        .map(
            (failure) => `${failure.baseUrl} (${failure.reason})`,
        )
        .join("; ");

    if (failures.length <= maxReportedFailures)
    {
        return compactSummary;
    }

    const hiddenCount = failures.length - maxReportedFailures;
    return `${compactSummary}; +${hiddenCount} additional failures`;
};

const fetchWithTimeout = async (
    requestUrl: string,
    requestInit: RequestInit,
    timeoutMs: number,
): Promise<Response> =>
{
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(
        () =>
        {
            abortController.abort();
        },
        timeoutMs,
    );

    try
    {
        return await fetch(
            requestUrl,
            {
                ...requestInit,
                signal: abortController.signal,
            },
        );
    }
    catch (caughtError)
    {
        if (caughtError instanceof Error && caughtError.name === "AbortError")
        {
            throw new Error(`Request timed out after ${timeoutMs} ms`);
        }

        throw caughtError;
    }
    finally
    {
        clearTimeout(timeoutHandle);
    }
};

export const getPreferredApiBaseUrl = (): string | null =>
{
    return preferredBaseUrl;
};

export const requestJsonWithFailover = async <TResponse>(
    route: string,
    requestInit: RequestInit = {},
): Promise<TResponse> =>
{
    const normalizedRoute = normalizeRoute(route);
    const requestInitWithAuth = withAuthHeader(requestInit);
    const failures: RequestFailure[] = [];

    for (const baseUrl of getCandidateBaseUrls())
    {
        const requestUrl = `${baseUrl}${normalizedRoute}`;

        for (let attempt = 1; attempt <= maxAttemptsPerBaseUrl; attempt += 1)
        {
            try
            {
                const response = await fetchWithTimeout(
                    requestUrl,
                    requestInitWithAuth,
                    requestTimeoutMs,
                );

                if (!response.ok)
                {
                    failures.push(
                        {
                            baseUrl,
                            reason: `HTTP ${response.status}`,
                        },
                    );

                    if (shouldRetryResponse(response.status) && attempt < maxAttemptsPerBaseUrl)
                    {
                        await sleep(retryDelayMs * attempt);
                        continue;
                    }

                    break;
                }

                const payload = (await response.json()) as TResponse;
                preferredBaseUrl = baseUrl;
                return payload;
            }
            catch (caughtError)
            {
                failures.push(
                    {
                        baseUrl,
                        reason: getErrorMessage(caughtError),
                    },
                );

                if (attempt < maxAttemptsPerBaseUrl)
                {
                    await sleep(retryDelayMs * attempt);
                    continue;
                }
            }
        }
    }

    const failureSummary = summarizeFailures(failures);
    throw new Error(
        `Unable to reach Seen API. ${failureSummary}. Update EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_API_BASE_URL_FALLBACKS.`,
    );
};
