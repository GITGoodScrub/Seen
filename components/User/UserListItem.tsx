import { StyleSheet, Text } from "react-native";
import { UserItem } from "../../Services";

type UserListItemProps = {
    user: UserItem;
};

export const UserListItem = (
    { user }: UserListItemProps,
) =>
{
    return (
        <Text style={styles.item}>
            {user.username} ({user.type})
        </Text>
    );
};

const styles = StyleSheet.create(
{
    item:
    {
        fontSize: 16,
        paddingVertical: 8,
    },
});
