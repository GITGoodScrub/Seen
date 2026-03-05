import { StyleSheet, Text, View } from "react-native";

type AppHeaderProps = {
    title: string;
};

export const AppHeader = (
    { title }: AppHeaderProps,
) =>
{
    return (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create(
{
    headerContainer:
    {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e7ebf0",
        backgroundColor: "#ffffff",
    },
    headerTitle:
    {
        fontSize: 26,
        fontWeight: "700",
        color: "#0f172a",
    },
});
