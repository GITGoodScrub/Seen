import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { RequestErrorState, UserListItem } from "../components";
import { loadUsers, UserItem } from "../Services";

export const UsersScreen = () =>
{
    const [users, setUsers] = useState<UserItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [requestVersion, setRequestVersion] = useState(0);

    useEffect(() =>
    {
        // Prevent state updates when the request resolves after unmount.
        let isCancelled = false;

        const initializeUsers = async (): Promise<void> =>
        {
            setIsLoading(true);

            try
            {
                const loadedUsers = await loadUsers();

                if (isCancelled)
                {
                    return;
                }

                setUsers(loadedUsers);
                setErrorMessage(null);
            }
            catch (caughtError)
            {
                if (isCancelled)
                {
                    return;
                }

                const message = caughtError instanceof Error
                    ? caughtError.message
                    : "Failed to load users";

                setErrorMessage(message);
            }
            finally
            {
                if (!isCancelled)
                {
                    setIsLoading(false);
                }
            }
        };

        initializeUsers();

        return () =>
        {
            isCancelled = true;
        };
    }, [requestVersion]);

    const handleRetryPress = (): void =>
    {
        setRequestVersion(
            (currentVersion) => currentVersion + 1,
        );
    };

    const handleRefresh = async (): Promise<void> =>
    {
        setIsRefreshing(true);

        try
        {
            const loadedUsers = await loadUsers();
            setUsers(loadedUsers);
            setErrorMessage(null);
        }
        catch (caughtError)
        {
            const message = caughtError instanceof Error
                ? caughtError.message
                : "Failed to refresh users";

            setErrorMessage(message);
        }
        finally
        {
            setIsRefreshing(false);
        }
    };

    if (isLoading && users.length === 0)
    {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (errorMessage && users.length === 0)
    {
        return (
            <View style={styles.container}>
                <RequestErrorState
                    message={errorMessage}
                    onRetryPress={handleRetryPress}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <UserListItem user={item} />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                    />
                }
                ListHeaderComponent={
                    errorMessage ? (
                        <Text style={styles.warningText}>
                            Showing last loaded users. Refresh failed: {errorMessage}
                        </Text>
                    ) : null
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No users available.</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        backgroundColor: "#f8fafc",
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    loadingContainer:
    {
        flex: 1,
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    listContent:
    {
        paddingBottom: 20,
    },
    warningText:
    {
        fontSize: 13,
        lineHeight: 18,
        color: "#92400e",
        backgroundColor: "#fef3c7",
        borderColor: "#fcd34d",
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    emptyText:
    {
        fontSize: 14,
        color: "#64748b",
        paddingTop: 12,
    },
});
