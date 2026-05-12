import { useMemo, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type SelectOption<TValue extends string> = {
    label: string;
    value: TValue;
};

type SelectDropdownProps<TValue extends string> = {
    selectedValue: TValue;
    options: readonly SelectOption<TValue>[];
    onValueChange: (value: TValue) => void;
    disabled?: boolean;
};

export const SelectDropdown = <TValue extends string>(
    {
        selectedValue,
        options,
        onValueChange,
        disabled = false,
    }: SelectDropdownProps<TValue>,
) =>
{
    const [isOpen, setIsOpen] = useState(false);

    const selectedLabel = useMemo(
        () => options.find((option) => option.value === selectedValue)?.label ?? "Select",
        [options, selectedValue],
    );

    const handleToggle = (): void =>
    {
        if (disabled)
        {
            return;
        }

        setIsOpen((currentValue) => !currentValue);
    };

    const handleSelect = (value: TValue): void =>
    {
        onValueChange(value);
        setIsOpen(false);
    };

    return (
        <View>
            <Pressable
                accessibilityRole="button"
                onPress={handleToggle}
                style={[
                    styles.field,
                    disabled ? styles.fieldDisabled : null,
                    isOpen ? styles.fieldOpen : null,
                ]}
            >
                <Text style={styles.fieldLabel}>{selectedLabel}</Text>
                <View style={styles.chevronBox}>
                    <Text style={styles.chevronText}>{isOpen ? "˄" : "˅"}</Text>
                </View>
            </Pressable>

            {isOpen ? (
                <View style={styles.dropdownList}>
                    {options.map((option) => (
                        <Pressable
                            key={option.value}
                            onPress={() => handleSelect(option.value)}
                            style={[
                                styles.optionButton,
                                option.value === selectedValue ? styles.optionButtonActive : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    option.value === selectedValue ? styles.optionTextActive : null,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    field: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
    },
    fieldOpen: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    fieldDisabled: {
        opacity: 0.6,
    },
    fieldLabel: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 16,
        color: "#111827",
    },
    chevronBox: {
        width: 52,
        alignSelf: "stretch",
        backgroundColor: "#a7d3f5",
        alignItems: "center",
        justifyContent: "center",
        borderLeftWidth: 1,
        borderLeftColor: "#93c5fd",
    },
    chevronText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    dropdownList: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: "#d1d5db",
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: "#ffffff",
        overflow: "hidden",
    },
    optionButton: {
        minHeight: 44,
        paddingHorizontal: 12,
        justifyContent: "center",
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    optionButtonActive: {
        backgroundColor: "#dbeafe",
    },
    optionText: {
        fontSize: 16,
        color: "#111827",
    },
    optionTextActive: {
        fontWeight: "700",
        color: "#1e3a8a",
    },
});
