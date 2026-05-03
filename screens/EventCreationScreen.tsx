import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import {
    AuthSession,
    addArtistToOccurrence,
    createEventOccurrence,
    createEventSeries,
    getErrorMessageFromUnknown,
    loadTags,
    loadEventSeriesDetail,
    updateEventSeries,
} from "../Services";

type EventCreationScreenProps = {
    authSession: AuthSession;
    onClose: () => void;
    onEventCreated?: () => void;
    eventSeriesId?: number | null;
};

const parseArtistIds = (rawValue: string): number[] =>
{
    if (rawValue.trim().length === 0)
    {
        return [];
    }

    const parsed = rawValue
        .split(",")
        .map((entry) => parseInt(entry.trim(), 10))
        .filter((entry) => !isNaN(entry) && entry > 0);

    return Array.from(new Set(parsed));
};

const normalizeTagName = (rawValue: string): string =>
{
    return rawValue.trim().toLowerCase();
};

const formatDateTimeForInput = (value: Date | null): string =>
{
    if (!value)
    {
        return "";
    }

    return value.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const EventCreationScreen = (
    {
        authSession,
        onClose,
        onEventCreated,
        eventSeriesId = null,
    }: EventCreationScreenProps,
) =>
{
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDateTime, setStartDateTime] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState("");
    const [ticketURLBase, setTicketURLBase] = useState("");
    const [ticketURL, setTicketURL] = useState("");
    const [posterURL, setPosterURL] = useState("");
    const [ageLimit, setAgeLimit] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState("");
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [artistIdsRaw, setArtistIdsRaw] = useState("");
    const [isLoadingExistingEvent, setIsLoadingExistingEvent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isVenueAdmin = authSession.user.type === "venueAdmin";
    const isEditing = eventSeriesId !== null;

    useEffect(
        () =>
        {
            if (!isEditing || eventSeriesId === null)
            {
                return;
            }

            let isCancelled = false;

            const loadExisting = async (): Promise<void> =>
            {
                setIsLoadingExistingEvent(true);
                setErrorMessage(null);

                try
                {
                    const detail = await loadEventSeriesDetail(eventSeriesId);

                    if (isCancelled)
                    {
                        return;
                    }

                    setTitle(detail.title);
                    setDescription(detail.description);
                    setTicketURLBase(detail.ticketURLBase ?? "");
                    setPosterURL(detail.posterURL ?? "");
                    setAgeLimit(detail.ageLimit !== null ? String(detail.ageLimit) : "");
                    setSelectedTags(detail.tags);

                    const firstOccurrence = detail.occurrences[0];
                    if (firstOccurrence)
                    {
                        setStartDateTime(new Date(firstOccurrence.startTime));
                        setDurationMinutes(
                            firstOccurrence.durationMinutes !== null
                                ? String(firstOccurrence.durationMinutes)
                                : "",
                        );
                        setTicketURL(firstOccurrence.ticketURL ?? "");
                    }
                }
                catch (caughtError)
                {
                    if (!isCancelled)
                    {
                        setErrorMessage(getErrorMessageFromUnknown(caughtError));
                    }
                }
                finally
                {
                    if (!isCancelled)
                    {
                        setIsLoadingExistingEvent(false);
                    }
                }
            };

            void loadExisting();

            return () =>
            {
                isCancelled = true;
            };
        },
        [eventSeriesId, isEditing],
    );

    useEffect(
        () =>
        {
            let isCancelled = false;

            const loadAvailableTags = async (): Promise<void> =>
            {
                setIsLoadingTags(true);

                try
                {
                    const tags = await loadTags();

                    if (isCancelled)
                    {
                        return;
                    }

                    setAvailableTags(
                        Array.from(
                            new Set(tags.map((tag) => normalizeTagName(tag.name)).filter((tagName) => tagName.length > 0)),
                        ),
                    );
                }
                catch
                {
                    if (!isCancelled)
                    {
                        setAvailableTags([]);
                    }
                }
                finally
                {
                    if (!isCancelled)
                    {
                        setIsLoadingTags(false);
                    }
                }
            };

            void loadAvailableTags();

            return () =>
            {
                isCancelled = true;
            };
        },
        [],
    );

    const filteredAvailableTags = useMemo(
        () =>
        {
            const normalizedQuery = normalizeTagName(tagSearchQuery);

            return availableTags
                .filter((tagName) => !selectedTags.includes(tagName))
                .filter((tagName) =>
                {
                    if (normalizedQuery.length === 0)
                    {
                        return true;
                    }

                    return tagName.includes(normalizedQuery);
                })
                .slice(0, 20);
        },
        [availableTags, selectedTags, tagSearchQuery],
    );

    const canAddCustomTag = useMemo(
        () =>
        {
            const normalizedQuery = normalizeTagName(tagSearchQuery);

            if (normalizedQuery.length === 0)
            {
                return false;
            }

            return !selectedTags.includes(normalizedQuery) && !availableTags.includes(normalizedQuery);
        },
        [availableTags, selectedTags, tagSearchQuery],
    );

    const addTag = (tagName: string): void =>
    {
        const normalizedTag = normalizeTagName(tagName);

        if (normalizedTag.length === 0)
        {
            return;
        }

        setSelectedTags(
            (currentTags) =>
            {
                if (currentTags.includes(normalizedTag) || currentTags.length >= 20)
                {
                    return currentTags;
                }

                return [...currentTags, normalizedTag];
            },
        );
        setTagSearchQuery("");
    };

    const removeTag = (tagName: string): void =>
    {
        setSelectedTags((currentTags) => currentTags.filter((entry) => entry !== tagName));
    };

    const isSaveDisabled = useMemo(
        () =>
        {
            return (
                !isVenueAdmin
                || title.trim().length === 0
                || description.trim().length === 0
                || startDateTime === null
                || isLoadingExistingEvent
                || isSubmitting
            );
        },
        [description, isLoadingExistingEvent, isSubmitting, isVenueAdmin, startDateTime, title],
    );

    const handlePickPosterFromLibrary = async (): Promise<void> =>
    {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.status !== "granted")
        {
            Alert.alert("Permission required", "Please allow photo library access to choose a poster.");
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync(
            {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.75,
                base64: true,
            },
        );

        if (pickerResult.canceled)
        {
            return;
        }

        const pickedAsset = pickerResult.assets[0];

        if (!pickedAsset)
        {
            return;
        }

        if (pickedAsset.base64)
        {
            const mimeType = pickedAsset.mimeType || "image/jpeg";
            setPosterURL(`data:${mimeType};base64,${pickedAsset.base64}`);
            return;
        }

        setPosterURL(pickedAsset.uri);
    };

    const handleSave = async (): Promise<void> =>
    {
        if (isSaveDisabled)
        {
            return;
        }

        setErrorMessage(null);
        setIsSubmitting(true);

        try
        {
            if (isEditing && eventSeriesId !== null)
            {
                await updateEventSeries(
                    eventSeriesId,
                    {
                        title: title.trim(),
                        description: description.trim(),
                        status: "active",
                        ticketURLBase: ticketURLBase.trim() || undefined,
                        posterURL: posterURL.trim() || undefined,
                        ageLimit: ageLimit.trim() ? parseInt(ageLimit, 10) : undefined,
                        startTime: startDateTime?.toISOString(),
                        durationMinutes: durationMinutes.trim() ? parseInt(durationMinutes, 10) : undefined,
                        ticketURL: ticketURL.trim() || undefined,
                        tags: selectedTags,
                    },
                );

                onEventCreated?.();
                onClose();
                return;
            }

            const series = await createEventSeries(
                {
                    title: title.trim(),
                    description: description.trim(),
                    status: "active",
                    ticketURLBase: ticketURLBase.trim() || undefined,
                    posterURL: posterURL.trim() || undefined,
                    ageLimit: ageLimit.trim() ? parseInt(ageLimit, 10) : undefined,
                    tags: selectedTags,
                },
            );

            const occurrence = await createEventOccurrence(
                {
                    seriesId: series.id,
                    startTime: startDateTime!.toISOString(),
                    status: "scheduled",
                    durationMinutes: durationMinutes.trim() ? parseInt(durationMinutes, 10) : undefined,
                    ticketURL: ticketURL.trim() || undefined,
                },
            );

            const artistIds = parseArtistIds(artistIdsRaw);
            await Promise.all(
                artistIds.map((artistId) => addArtistToOccurrence(occurrence.id, artistId)),
            );

            onEventCreated?.();
            onClose();
        }
        catch (caughtError)
        {
            setErrorMessage(getErrorMessageFromUnknown(caughtError));
        }
        finally
        {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <Pressable style={styles.cancelButton} disabled={isSubmitting} onPress={onClose}>
                    <Text style={styles.cancelLabel}>Cancel</Text>
                </Pressable>

                <Text style={styles.title}>{isEditing ? "Edit Event" : "Create Event"}</Text>

                <Pressable
                    style={styles.saveButton}
                    disabled={isSaveDisabled}
                    onPress={() =>
                    {
                        void handleSave();
                    }}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#1d4ed8" />
                    ) : (
                        <Text style={[styles.saveLabel, isSaveDisabled ? styles.saveLabelDisabled : null]}>Save</Text>
                    )}
                </Pressable>
            </View>

            {!isVenueAdmin ? (
                <View style={styles.errorPanel}>
                    <Text style={styles.errorText}>Only venue admins can create events.</Text>
                </View>
            ) : null}

            <ScrollView contentContainerStyle={styles.formContent}>
                {isLoadingExistingEvent ? (
                    <View style={styles.loadingPanel}>
                        <ActivityIndicator size="small" color="#1d4ed8" />
                        <Text style={styles.loadingText}>Loading event details...</Text>
                    </View>
                ) : null}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Series</Text>

                    <TextInput
                        editable={!isSubmitting}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Series title"
                        placeholderTextColor="#94a3b8"
                        style={styles.input}
                    />

                    <TextInput
                        editable={!isSubmitting}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Description"
                        placeholderTextColor="#94a3b8"
                        style={[styles.input, styles.textArea]}
                        multiline={true}
                    />

                    <TextInput
                        editable={!isSubmitting}
                        value={posterURL}
                        onChangeText={setPosterURL}
                        placeholder="Poster URL (optional)"
                        placeholderTextColor="#94a3b8"
                        style={styles.input}
                        autoCapitalize="none"
                    />

                    <View style={styles.posterActionsRow}>
                        <Pressable
                            style={styles.secondaryButton}
                            disabled={isSubmitting}
                            onPress={() =>
                            {
                                void handlePickPosterFromLibrary();
                            }}
                        >
                            <Text style={styles.secondaryButtonText}>Choose poster from phone</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.secondaryButton, !posterURL ? styles.secondaryButtonDisabled : null]}
                            disabled={isSubmitting || posterURL.length === 0}
                            onPress={() => setPosterURL("")}
                        >
                            <Text style={styles.secondaryButtonText}>Remove poster</Text>
                        </Pressable>
                    </View>

                    <TextInput
                        editable={!isSubmitting}
                        value={ticketURLBase}
                        onChangeText={setTicketURLBase}
                        placeholder="Ticket URL base (optional)"
                        placeholderTextColor="#94a3b8"
                        style={styles.input}
                        autoCapitalize="none"
                    />

                    <TextInput
                        editable={!isSubmitting}
                        value={ageLimit}
                        onChangeText={setAgeLimit}
                        placeholder="Age limit (optional, e.g. 18)"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        style={styles.input}
                    />

                    <Pressable
                        style={styles.tagPickerTrigger}
                        disabled={isSubmitting}
                        onPress={() => setIsTagPickerOpen((currentValue) => !currentValue)}
                    >
                        <Text style={styles.tagPickerTriggerText}>
                            {selectedTags.length > 0
                                ? `${selectedTags.length} tag${selectedTags.length === 1 ? "" : "s"} selected`
                                : "Select tags"}
                        </Text>
                        <Text style={styles.tagPickerChevron}>{isTagPickerOpen ? "▲" : "▼"}</Text>
                    </Pressable>

                    {selectedTags.length > 0 ? (
                        <View style={styles.selectedTagsWrap}>
                            {selectedTags.map((tagName) => (
                                <View key={tagName} style={styles.selectedTagChip}>
                                    <Text style={styles.selectedTagChipText}>{tagName}</Text>
                                    <Pressable
                                        disabled={isSubmitting}
                                        onPress={() => removeTag(tagName)}
                                        style={styles.selectedTagRemoveButton}
                                    >
                                        <Text style={styles.selectedTagRemoveText}>×</Text>
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    ) : null}

                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>First Occurrence</Text>
                    <View style={styles.dateTimeRow}>
                        <Pressable
                            style={styles.secondaryButton}
                            disabled={isSubmitting}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.secondaryButtonText}>Pick date</Text>
                        </Pressable>
                        <Pressable
                            style={styles.secondaryButton}
                            disabled={isSubmitting}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Text style={styles.secondaryButtonText}>Pick time</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.dateTimeValue}>
                        {startDateTime ? formatDateTimeForInput(startDateTime) : "No date/time selected"}
                    </Text>

                    {showDatePicker ? (
                        <DateTimePicker
                            value={startDateTime ?? new Date()}
                            mode="date"
                            onChange={(_, selectedDate) =>
                            {
                                setShowDatePicker(false);
                                if (!selectedDate)
                                {
                                    return;
                                }

                                const current = startDateTime ?? new Date();
                                const next = new Date(current);
                                next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                                setStartDateTime(next);
                            }}
                        />
                    ) : null}

                    {showTimePicker ? (
                        <DateTimePicker
                            value={startDateTime ?? new Date()}
                            mode="time"
                            onChange={(_, selectedTime) =>
                            {
                                setShowTimePicker(false);
                                if (!selectedTime)
                                {
                                    return;
                                }

                                const current = startDateTime ?? new Date();
                                const next = new Date(current);
                                next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
                                setStartDateTime(next);
                            }}
                        />
                    ) : null}

                    <TextInput
                        editable={!isSubmitting}
                        value={durationMinutes}
                        onChangeText={setDurationMinutes}
                        placeholder="Duration minutes (optional)"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        style={styles.input}
                    />

                    <TextInput
                        editable={!isSubmitting}
                        value={ticketURL}
                        onChangeText={setTicketURL}
                        placeholder="Ticket URL override (optional)"
                        placeholderTextColor="#94a3b8"
                        style={styles.input}
                        autoCapitalize="none"
                    />

                    {!isEditing ? (
                        <TextInput
                            editable={!isSubmitting}
                            value={artistIdsRaw}
                            onChangeText={setArtistIdsRaw}
                            placeholder="Artist IDs (comma-separated, optional)"
                            placeholderTextColor="#94a3b8"
                            style={styles.input}
                            autoCapitalize="none"
                        />
                    ) : null}
                </View>

                {errorMessage ? (
                    <View style={styles.errorPanel}>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                ) : null}
            </ScrollView>

            <Modal
                visible={isTagPickerOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsTagPickerOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsTagPickerOpen(false)}>
                    <View style={styles.tagPickerModalBackdrop}>
                        <TouchableWithoutFeedback onPress={() => undefined}>
                            <View style={styles.tagPickerModalCard}>
                                <Text style={styles.sectionTitle}>Select Tags</Text>

                                <TextInput
                                    editable={!isSubmitting}
                                    value={tagSearchQuery}
                                    onChangeText={setTagSearchQuery}
                                    placeholder="Type to filter tags"
                                    placeholderTextColor="#94a3b8"
                                    style={styles.input}
                                    autoCapitalize="none"
                                />

                                {isLoadingTags ? (
                                    <View style={styles.tagPickerLoadingRow}>
                                        <ActivityIndicator size="small" color="#1d4ed8" />
                                        <Text style={styles.tagPickerHintText}>Loading tags...</Text>
                                    </View>
                                ) : null}

                                {!isLoadingTags && canAddCustomTag ? (
                                    <Pressable
                                        style={styles.tagOptionRow}
                                        disabled={isSubmitting}
                                        onPress={() => addTag(tagSearchQuery)}
                                    >
                                        <Text style={styles.tagOptionText}>Add "{normalizeTagName(tagSearchQuery)}"</Text>
                                    </Pressable>
                                ) : null}

                                {!isLoadingTags && filteredAvailableTags.length === 0 && !canAddCustomTag ? (
                                    <Text style={styles.tagPickerHintText}>No matching tags.</Text>
                                ) : null}

                                <ScrollView style={styles.tagOptionsScroll} contentContainerStyle={styles.tagOptionsContent}>
                                    {!isLoadingTags ? (
                                        filteredAvailableTags.map((tagName) => (
                                            <Pressable
                                                key={tagName}
                                                style={styles.tagOptionRow}
                                                disabled={isSubmitting}
                                                onPress={() => addTag(tagName)}
                                            >
                                                <Text style={styles.tagOptionText}>{tagName}</Text>
                                            </Pressable>
                                        ))
                                    ) : null}
                                </ScrollView>

                                <Pressable
                                    style={styles.tagPickerDoneButton}
                                    onPress={() => setIsTagPickerOpen(false)}
                                >
                                    <Text style={styles.tagPickerDoneButtonText}>Done</Text>
                                </Pressable>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
        backgroundColor: "#f8fafc",
    },
    topRow: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    cancelButton: {
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
    },
    cancelLabel: {
        fontSize: 16,
        color: "#1d4ed8",
        fontWeight: "600",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    saveButton: {
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "flex-end",
    },
    saveLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1d4ed8",
    },
    saveLabelDisabled: {
        color: "#94a3b8",
    },
    formContent: {
        paddingBottom: 24,
        gap: 12,
    },
    loadingPanel: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#bfdbfe",
        backgroundColor: "#eff6ff",
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    loadingText: {
        color: "#1e40af",
        fontSize: 13,
        fontWeight: "600",
    },
    card: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 2,
    },
    input: {
        minHeight: 46,
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 10,
        backgroundColor: "#ffffff",
        paddingHorizontal: 12,
        fontSize: 15,
        color: "#0f172a",
    },
    tagPickerTrigger: {
        minHeight: 46,
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 10,
        backgroundColor: "#ffffff",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    tagPickerTriggerText: {
        color: "#0f172a",
        fontSize: 14,
        fontWeight: "600",
    },
    tagPickerChevron: {
        color: "#64748b",
        fontSize: 12,
    },
    selectedTagsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    selectedTagChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563eb",
        borderRadius: 999,
        paddingLeft: 10,
        paddingRight: 6,
        paddingVertical: 4,
    },
    selectedTagChipText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
        marginRight: 6,
    },
    selectedTagRemoveButton: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    selectedTagRemoveText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 14,
    },
    tagPickerPanel: {
        borderWidth: 1,
        borderColor: "#d9dee5",
        borderRadius: 10,
        padding: 10,
        backgroundColor: "#ffffff",
        gap: 8,
    },
    tagPickerModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.35)",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    tagPickerModalCard: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d9dee5",
        padding: 12,
        maxHeight: "75%",
        gap: 8,
    },
    tagOptionsScroll: {
        maxHeight: 260,
    },
    tagOptionsContent: {
        gap: 8,
        paddingBottom: 4,
    },
    tagPickerLoadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    tagPickerHintText: {
        color: "#64748b",
        fontSize: 13,
    },
    tagOptionRow: {
        minHeight: 36,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        paddingHorizontal: 10,
        justifyContent: "center",
        backgroundColor: "#f8fafc",
    },
    tagOptionText: {
        color: "#0f172a",
        fontSize: 14,
        fontWeight: "600",
    },
    tagPickerDoneButton: {
        minHeight: 40,
        borderRadius: 10,
        backgroundColor: "#1d4ed8",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
    },
    tagPickerDoneButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
    },
    posterActionsRow: {
        flexDirection: "row",
        gap: 8,
    },
    secondaryButton: {
        minHeight: 40,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
        backgroundColor: "#ffffff",
    },
    secondaryButtonDisabled: {
        opacity: 0.6,
    },
    secondaryButtonText: {
        color: "#0f172a",
        fontSize: 13,
        fontWeight: "600",
    },
    dateTimeRow: {
        flexDirection: "row",
        gap: 8,
    },
    dateTimeValue: {
        color: "#334155",
        fontSize: 14,
        marginTop: 2,
    },
    textArea: {
        minHeight: 96,
        textAlignVertical: "top",
        paddingTop: 10,
        paddingBottom: 10,
    },
    errorPanel: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#fecaca",
        backgroundColor: "#fef2f2",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    errorText: {
        color: "#b91c1c",
        fontSize: 13,
    },
});
