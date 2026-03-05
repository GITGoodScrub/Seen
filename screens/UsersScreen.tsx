import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { UserListItem } from "../components/User";
import { loadUsers, UserItem } from "../Services";

export const UsersScreen = () =>
{
    const [users, setUsers] = useState<UserItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() =>
    {
        // Prevent state updates when the request resolves after unmount.
        let isCancelled = false;

        const initializeUsers = async (): Promise<void> =>
        {
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
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Seen Users</Text>

            {isLoading ? (
                <ActivityIndicator size="large" />
            ) : errorMessage ? (
                <Text style={styles.error}>{errorMessage}</Text>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <UserListItem user={item} />
                    )}
                />
            )}

            <StatusBar style="auto" />
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: 64,
        paddingHorizontal: 20,
    },
    title:
    {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 16,
    },
    error:
    {
        color: "#c0392b",
        fontSize: 14,
    },
});
