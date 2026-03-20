import { StyleSheet, Text } from "react-native";
import { UserItem } from "../../Services";

type UserListItemProps = {
    user: UserItem;
};

export const UserListItem = (
    { user }: UserListItemProps,
) =>
{
    const displayName = user.username ?? user.email ?? `User #${user.id}`;

    return (
        <Text style={styles.item}>
            {displayName} ({user.type})
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
