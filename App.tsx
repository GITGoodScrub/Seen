import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

type UserItem = {
  id: number;
  username: string;
  type: string;
};

export default function App() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
        if (!baseUrl) {
          throw new Error("EXPO_PUBLIC_API_BASE_URL is not set");
        }

        const response = await fetch(`${baseUrl}/api/users`);
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        const payload: { users: UserItem[] } = await response.json();
        setUsers(payload.users ?? []);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Failed to load users";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seen Users</Text>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Text style={styles.item}>{item.username} ({item.type})</Text>
          )}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 64,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  item: {
    fontSize: 16,
    paddingVertical: 8,
  },
  error: {
    color: "#c0392b",
    fontSize: 14,
  },
});
