import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { higLayout } from "../../constants";
import { SideMenuItem } from "../../Services";

type SideMenuDrawerProps = {
    items: SideMenuItem[];
    onItemPress: (item: SideMenuItem) => void;
    displayName: string | null;
    username: string | null;
    profilePhoto: string | null;
};

const getInitials = (name: string | null, fallback: string | null): string =>
{
    if (name)
    {
        const parts = name.trim().split(" ");

        if (parts.length >= 2)
        {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        return name.slice(0, 2).toUpperCase();
    }

    if (fallback)
    {
        return fallback.slice(0, 2).toUpperCase();
    }

    return "?";
};

export const SideMenuDrawer = (
    {
        items,
        onItemPress,
        displayName,
        username,
        profilePhoto,
    }: SideMenuDrawerProps,
) =>
{
    const mainItems = items.filter(
        (item) => item.key !== "settings" && item.key !== "logout",
    );
    const settingsItem = items.find((item) => item.key === "settings");
    const logoutItem = items.find((item) => item.key === "logout");
    const initials = getInitials(displayName, username);

    return (
        <View style={styles.container}>
            <View style={styles.headerArea}>
                {profilePhoto ? (
                    <Image
                        source={{ uri: profilePhoto }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                )}
                <Text style={styles.displayName} numberOfLines={1}>
                    {displayName ?? username ?? "User"}
                </Text>
                {username ? (
                    <Text style={styles.usernameText}>@{username}</Text>
                ) : null}
            </View>

            <View style={styles.itemList}>
                {mainItems.map(
                    (item) =>
                    {
                        return (
                            <Pressable
                                key={item.key}
                                style={styles.itemRow}
                                onPress={() => onItemPress(item)}
                            >
                                <View style={styles.itemTextWrap}>
                                    <Text style={styles.itemLabel}>{item.label}</Text>
                                    {item.description ? (
                                        <Text style={styles.itemDescription}>{item.description}</Text>
                                    ) : null}
                                </View>
                                <Text style={styles.chevron}>›</Text>
                            </Pressable>
                        );
                    },
                )}
            </View>

            <View style={styles.spacer} />

            {settingsItem ? (
                <View style={styles.settingsSection}>
                    <Pressable
                        style={styles.itemRow}
                        onPress={() => onItemPress(settingsItem)}
                    >
                        <View style={styles.itemTextWrap}>
                            <Text style={styles.itemLabel}>{settingsItem.label}</Text>
                            {settingsItem.description ? (
                                <Text style={styles.itemDescription}>{settingsItem.description}</Text>
                            ) : null}
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </Pressable>
                </View>
            ) : null}

            {logoutItem ? (
                <View style={styles.logoutSection}>
                    <Pressable
                        style={styles.logoutRow}
                        onPress={() => onItemPress(logoutItem)}
                    >
                        <Text style={styles.logoutLabel}>{logoutItem.label}</Text>
                    </Pressable>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        flex: 1,
        backgroundColor: "#ffffff",
        borderRightWidth: 1,
        borderRightColor: "#d9dee5",
    },
    headerArea:
    {
        paddingHorizontal: higLayout.contentHorizontalPadding,
        paddingTop: 20,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#e7ebf0",
    },
    avatar:
    {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginBottom: 12,
        backgroundColor: "#e2e8f0",
    },
    avatarFallback:
    {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#1d4ed8",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    avatarInitials:
    {
        fontSize: 20,
        fontWeight: "700",
        color: "#ffffff",
    },
    displayName:
    {
        fontSize: 20,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 2,
    },
    usernameText:
    {
        fontSize: 13,
        color: "#64748b",
    },
    itemList:
    {
        paddingTop: 6,
    },
    spacer:
    {
        flex: 1,
    },
    settingsSection:
    {
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    logoutSection:
    {
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        marginBottom: 8,
    },
    itemRow:
    {
        minHeight: higLayout.minTouchTargetSize,
        paddingVertical: 10,
        paddingHorizontal: higLayout.contentHorizontalPadding,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    itemTextWrap:
    {
        flex: 1,
        paddingRight: 12,
    },
    itemLabel:
    {
        fontSize: 16,
        fontWeight: "600",
        color: "#0f172a",
        marginBottom: 2,
    },
    itemDescription:
    {
        fontSize: 12,
        color: "#64748b",
    },
    chevron:
    {
        fontSize: 20,
        color: "#94a3b8",
        lineHeight: 20,
    },
    logoutRow:
    {
        minHeight: higLayout.minTouchTargetSize,
        paddingVertical: 10,
        paddingHorizontal: higLayout.contentHorizontalPadding,
        justifyContent: "center",
    },
    logoutLabel:
    {
        fontSize: 16,
        fontWeight: "600",
        color: "#dc2626",
    },
});
