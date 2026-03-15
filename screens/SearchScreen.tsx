import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getSearchRecommendations, SearchSuggestion } from "../Services";

type SearchScreenProps = {
    recentSearches: string[];
    onClose: () => void;
    onSearchSubmit: (searchQuery: string) => void;
    onClearRecentSearches: () => void;
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

export const SearchScreen = (
    {
        recentSearches,
        onClose,
        onSearchSubmit,
        onClearRecentSearches,
    }: SearchScreenProps,
) =>
{
    const [searchQuery, setSearchQuery] = useState("");
    const trimmedSearchQuery = searchQuery.trim();

    const recommendations = useMemo(
        () => getSearchRecommendations(searchQuery),
        [searchQuery],
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

    const renderRecommendations = () =>
    {
        if (recommendations.length === 0)
        {
            return (
                <Text style={styles.emptyText}>No recommendations yet for this query.</Text>
            );
        }

        return recommendations.map(
            (suggestion: SearchSuggestion) =>
            {
                return (
                    <Pressable
                        key={suggestion.id}
                        style={styles.listRow}
                        onPress={() => handleSubmitSearch(suggestion.title)}
                    >
                        <Text style={styles.listTitle}>{suggestion.title}</Text>
                        <Text style={styles.listSubtitle}>{suggestion.subtitle}</Text>
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
                        placeholder="Search people, venues, and posts"
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
                        <Text style={styles.sectionTitle}>Recommendations</Text>
                        {renderRecommendations()}
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
    emptyText:
    {
        fontSize: 13,
        color: "#64748b",
    },
});
