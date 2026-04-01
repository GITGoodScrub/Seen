import Constants from "expo-constants";

type RequestFailure = {
    baseUrl: string;
    reason: string;
};

class TerminalApiError extends Error
{
}

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

const extractHostFromUriLikeValue = (value: string | null | undefined): string | null =>
{
    if (!value)
    {
        return null;
    }

    const normalizedValue = value.includes("://")
        ? value
        : `http://${value}`;

    try
    {
        const parsedUrl = new URL(normalizedValue);
        return parsedUrl.hostname || null;
    }
    catch
    {
        return null;
    }
};

const getExpoDerivedBaseUrls = (): string[] =>
{
    const constantsLike = Constants as unknown as {
        expoConfig?: {
            hostUri?: string;
        };
        expoGoConfig?: {
            debuggerHost?: string;
        };
        manifest?: {
            debuggerHost?: string;
            hostUri?: string;
        };
        manifest2?: {
            extra?: {
                expoClient?: {
                    hostUri?: string;
                };
            };
        };
    };

    const hostCandidates = [
        constantsLike.expoConfig?.hostUri,
        constantsLike.expoGoConfig?.debuggerHost,
        constantsLike.manifest?.debuggerHost,
        constantsLike.manifest?.hostUri,
        constantsLike.manifest2?.extra?.expoClient?.hostUri,
    ];

    const detectedHost = hostCandidates
        .map(
            (candidate) => extractHostFromUriLikeValue(candidate),
        )
        .find(
            (host): host is string => Boolean(host),
        );

    if (!detectedHost)
    {
        return [];
    }

    const detectedBaseUrls = [
        `http://${detectedHost}:3000`,
    ];

    // Android emulator host mapping, kept near detected host for faster fallback.
    if (detectedHost === "localhost" || detectedHost === "127.0.0.1")
    {
        detectedBaseUrls.push("http://10.0.2.2:3000");
    }

    return detectedBaseUrls;
};

const getConfiguredBaseUrls = (): string[] =>
{
    const primaryBaseUrls = parseBaseUrlList(process.env.EXPO_PUBLIC_API_BASE_URL);
    const fallbackBaseUrls = parseBaseUrlList(process.env.EXPO_PUBLIC_API_BASE_URL_FALLBACKS);
    const expoDerivedBaseUrls = getExpoDerivedBaseUrls();

    const configuredBaseUrls = [
        ...expoDerivedBaseUrls,
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

const isTerminalClientError = (statusCode: number): boolean =>
{
    return statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429;
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

const getErrorMessageFromResponse = async (response: Response): Promise<string> =>
{
    try
    {
        const parsedPayload = await response.json() as {
            error?: unknown;
            message?: unknown;
        };

        if (typeof parsedPayload.error === "string" && parsedPayload.error.trim().length > 0)
        {
            return parsedPayload.error;
        }

        if (typeof parsedPayload.message === "string" && parsedPayload.message.trim().length > 0)
        {
            return parsedPayload.message;
        }
    }
    catch
    {
        // Ignore parse failures and fall back to generic status message.
    }

    return `Request failed with HTTP ${response.status}`;
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
                    if (isTerminalClientError(response.status))
                    {
                        const terminalErrorMessage = await getErrorMessageFromResponse(response);
                        throw new TerminalApiError(terminalErrorMessage);
                    }

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
                if (caughtError instanceof TerminalApiError)
                {
                    throw caughtError;
                }

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
