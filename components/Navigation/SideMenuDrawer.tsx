import { Pressable, StyleSheet, Text, View } from "react-native";
import { higLayout } from "../../constants";
import { SideMenuItem } from "../../Services";

type SideMenuDrawerProps = {
    items: SideMenuItem[];
    onItemPress: (item: SideMenuItem) => void;
};

export const SideMenuDrawer = (
    {
        items,
        onItemPress,
    }: SideMenuDrawerProps,
) =>
{
    return (
        <View style={styles.container}>
            <View style={styles.headerArea}>
                <Text style={styles.title}>Menu</Text>
                <Text style={styles.subtitle}>Quick navigation</Text>
            </View>

            <View style={styles.itemList}>
                {items.map(
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
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e7ebf0",
    },
    title:
    {
        fontSize: 24,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 2,
    },
    subtitle:
    {
        fontSize: 13,
        color: "#64748b",
    },
    itemList:
    {
        paddingVertical: 6,
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
});
