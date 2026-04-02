import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
    getErrorMessageFromUnknown,
    loadSearchResults,
    SearchResult,
} from "../Services";

type SearchScreenProps = {
    recentSearches: string[];
    onClose: () => void;
    onSearchSubmit: (searchQuery: string) => void;
    onOpenProfilePress: (profileUserId: number) => void;
    onOpenVenuePress: (venueId: number) => void;
    onOpenEventPress: (eventSeriesId: number) => void;
    onClearRecentSearches: () => void;
};

const getUserIdFromSearchResultId = (searchResultId: string): number | null =>
{
    if (!searchResultId.startsWith("user-"))
    {
        return null;
    }

    const idPortion = searchResultId.slice("user-".length);
    const parsedId = Number(idPortion);

    if (!Number.isFinite(parsedId))
    {
        return null;
    }

    return parsedId;
};

const getEntityIdByPrefix = (
    searchResultId: string,
    expectedPrefix: string,
): number | null =>
{
    if (!searchResultId.startsWith(expectedPrefix))
    {
        return null;
    }

    const idPortion = searchResultId.slice(expectedPrefix.length);
    const parsedId = Number(idPortion);

    if (!Number.isFinite(parsedId))
    {
        return null;
    }

    return parsedId;
};

const SearchIcon = () =>
{
    return (
        <View style={styles.searchIconWrap}>
            <View style={styles.searchIconCircle} />
            <View style={styles.searchIconHandle} />
        </View>
    );
};

const VerifiedBadge = () =>
{
    return (
        <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✓</Text>
        </View>
    );
};

export const SearchScreen = (
    {
        recentSearches,
        onClose,
        onSearchSubmit,
        onOpenProfilePress,
        onOpenVenuePress,
        onOpenEventPress,
        onClearRecentSearches,
    }: SearchScreenProps,
) =>
{
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);
    const trimmedSearchQuery = searchQuery.trim();

    useEffect(
        () =>
        {
            let isCancelled = false;

            const runSearch = async (): Promise<void> =>
            {
                if (trimmedSearchQuery.length < 2)
                {
                    setSearchResults([]);
                    setSearchErrorMessage(null);
                    setIsSearching(false);
                    return;
                }

                setIsSearching(true);
                setSearchErrorMessage(null);

                try
                {
                    const results = await loadSearchResults(trimmedSearchQuery);

                    if (isCancelled)
                    {
                        return;
                    }

                    setSearchResults(results);
                }
                catch (caughtError)
                {
                    if (isCancelled)
                    {
                        return;
                    }

                    setSearchResults([]);
                    setSearchErrorMessage(getErrorMessageFromUnknown(caughtError));
                }
                finally
                {
                    if (!isCancelled)
                    {
                        setIsSearching(false);
                    }
                }
            };

            const timeoutHandle = setTimeout(
                () =>
                {
                    void runSearch();
                },
                250,
            );

            return () =>
            {
                isCancelled = true;
                clearTimeout(timeoutHandle);
            };
        },
        [trimmedSearchQuery],
    );

    const handleSubmitSearch = (nextSearchQuery: string): void =>
    {
        const normalizedQuery = nextSearchQuery.trim();

        if (!normalizedQuery)
        {
            return;
        }

        setSearchQuery(normalizedQuery);
        onSearchSubmit(normalizedQuery);
    };

    const handlePressSearchResult = (result: SearchResult): void =>
    {
        handleSubmitSearch(result.title);

        if (result.type === "user")
        {
            const profileUserId = getUserIdFromSearchResultId(result.id);

            if (profileUserId === null)
            {
                return;
            }

            onOpenProfilePress(profileUserId);
            return;
        }

        if (result.type === "venue")
        {
            const venueId = getEntityIdByPrefix(result.id, "venue-");

            if (venueId === null)
            {
                return;
            }

            onOpenVenuePress(venueId);
            return;
        }

        if (result.type === "event")
        {
            const eventSeriesId = getEntityIdByPrefix(result.id, "event-");

            if (eventSeriesId === null)
            {
                return;
            }

            onOpenEventPress(eventSeriesId);
        }
    };

    const renderRecentSearches = () =>
    {
        if (recentSearches.length === 0)
        {
            return (
                <Text style={styles.emptyText}>No recent searches yet.</Text>
            );
        }

        return recentSearches.map(
            (recentSearch) =>
            {
                return (
                    <Pressable
                        key={recentSearch}
                        style={styles.listRow}
                        onPress={() => handleSubmitSearch(recentSearch)}
                    >
                        <Text style={styles.listTitle}>{recentSearch}</Text>
                    </Pressable>
                );
            },
        );
    };

    const renderSearchResults = () =>
    {
        if (trimmedSearchQuery.length < 2)
        {
            return (
                <Text style={styles.emptyText}>Type at least 2 characters to search.</Text>
            );
        }

        if (isSearching)
        {
            return (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" />
                    <Text style={styles.loadingLabel}>Searching...</Text>
                </View>
            );
        }

        if (searchErrorMessage)
        {
            return (
                <Text style={styles.errorText}>{searchErrorMessage}</Text>
            );
        }

        if (searchResults.length === 0)
        {
            return (
                <Text style={styles.emptyText}>No results found for this query.</Text>
            );
        }

        return searchResults.map(
            (result: SearchResult) =>
            {
                return (
                    <Pressable
                        key={result.id}
                        style={styles.listRow}
                        onPress={() => handlePressSearchResult(result)}
                    >
                        <Text style={styles.listTitle}>{result.title}</Text>
                        <View style={styles.listSubtitleRow}>
                            <Text style={styles.listSubtitle}>{result.subtitle}</Text>
                            {result.type === "user" && result.isVerified ? <VerifiedBadge /> : null}
                        </View>
                    </Pressable>
                );
            },
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <View style={styles.inputShell}>
                    <SearchIcon />

                    <TextInput
                        autoFocus={true}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search people, events, and venues"
                        placeholderTextColor="#64748b"
                        style={styles.input}
                        returnKeyType="search"
                        onSubmitEditing={() => handleSubmitSearch(searchQuery)}
                    />
                </View>

                <Pressable
                    style={styles.cancelButton}
                    onPress={onClose}
                >
                    <Text style={styles.cancelLabel}>Cancel</Text>
                </Pressable>
            </View>

            <ScrollView
                style={styles.resultsArea}
                contentContainerStyle={styles.resultsContent}
                keyboardShouldPersistTaps="handled"
            >
                {trimmedSearchQuery ? (
                    <View>
                        <Text style={styles.sectionTitle}>Results</Text>
                        {renderSearchResults()}
                    </View>
                ) : (
                    <View>
                        <View style={styles.recentHeaderRow}>
                            <Text style={styles.sectionTitle}>Recent Searches</Text>
                            {recentSearches.length > 0 ? (
                                <Pressable onPress={onClearRecentSearches}>
                                    <Text style={styles.clearLabel}>Clear</Text>
                                </Pressable>
                            ) : null}
                        </View>
                        {renderRecentSearches()}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        backgroundColor: "#f8fafc",
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    topRow:
    {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    inputShell:
    {
        flex: 1,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: "#d0d7e2",
        backgroundColor: "#ffffff",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    searchIconWrap:
    {
        marginRight: 8,
    },
    searchIconCircle:
    {
        width: 12,
        height: 12,
        borderWidth: 2,
        borderColor: "#64748b",
        borderRadius: 6,
    },
    searchIconHandle:
    {
        width: 7,
        height: 2,
        backgroundColor: "#64748b",
        borderRadius: 2,
        transform: [{ rotate: "45deg" }],
        marginLeft: 9,
        marginTop: -1,
    },
    input:
    {
        flex: 1,
        fontSize: 14,
        color: "#0f172a",
        paddingVertical: 0,
    },
    cancelButton:
    {
        minWidth: 56,
        minHeight: 44,
        marginLeft: 10,
        justifyContent: "center",
        alignItems: "flex-end",
    },
    cancelLabel:
    {
        fontSize: 15,
        color: "#1d4ed8",
        fontWeight: "600",
    },
    resultsArea:
    {
        flex: 1,
    },
    resultsContent:
    {
        paddingBottom: 24,
    },
    sectionTitle:
    {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 10,
    },
    recentHeaderRow:
    {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    clearLabel:
    {
        fontSize: 13,
        color: "#1d4ed8",
        fontWeight: "600",
    },
    listRow:
    {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    listTitle:
    {
        fontSize: 14,
        color: "#0f172a",
        fontWeight: "600",
    },
    listSubtitle:
    {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
    },
    listSubtitleRow:
    {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
        columnGap: 6,
    },
    verifiedBadge:
    {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#1d4ed8",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    verifiedBadgeText:
    {
        color: "#ffffff",
        fontSize: 10,
        fontWeight: "700",
        lineHeight: 10,
    },
    emptyText:
    {
        fontSize: 13,
        color: "#64748b",
    },
    loadingRow:
    {
        flexDirection: "row",
        alignItems: "center",
        columnGap: 8,
    },
    loadingLabel:
    {
        fontSize: 13,
        color: "#64748b",
    },
    errorText:
    {
        fontSize: 13,
        color: "#b91c1c",
    },
});
