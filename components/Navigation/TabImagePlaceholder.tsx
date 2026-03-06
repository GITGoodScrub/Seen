import { StyleSheet, Text, View } from "react-native";

type TabImagePlaceholderProps = {
    label: string;
    isActive: boolean;
};

export const TabImagePlaceholder = (
    {
        label,
        isActive,
    }: TabImagePlaceholderProps,
) =>
{
    return (
        <View
            style={[
                styles.container,
                isActive ? styles.containerActive : undefined,
            ]}
        >
            <Text
                style={[
                    styles.label,
                    isActive ? styles.labelActive : undefined,
                ]}
            >
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create(
{
    container:
    {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#d1d5db",
        borderWidth: 1,
        borderColor: "#c1c8d0",
        marginBottom: 4,
    },
    containerActive:
    {
        backgroundColor: "#1d4ed8",
        borderColor: "#1d4ed8",
    },
    label:
    {
        fontSize: 11,
        fontWeight: "700",
        color: "#1f2937",
    },
    labelActive:
    {
        color: "#ffffff",
    },
});