import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    AuthSession,
    addArtistToOccurrence,
    createEventOccurrence,
    createEventSeries,
    getErrorMessageFromUnknown,
} from "../Services";

type EventCreationScreenProps = {
    authSession: AuthSession;
    onClose: () => void;
    onEventCreated?: () => void;
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

export const EventCreationScreen = (
    {
        authSession,
        onClose,
        onEventCreated,
    }: EventCreationScreenProps,
) =>
{
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [ticketURLBase, setTicketURLBase] = useState("");
    const [ticketURL, setTicketURL] = useState("");
    const [posterURL, setPosterURL] = useState("");
    const [ageLimit, setAgeLimit] = useState("");
    const [artistIdsRaw, setArtistIdsRaw] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isVenueAdmin = authSession.user.type === "venueAdmin";

    const isSaveDisabled = useMemo(
        () =>
        {
            return (
                !isVenueAdmin
                || title.trim().length === 0
                || description.trim().length === 0
                || startTime.trim().length === 0
                || isSubmitting
            );
        },
        [description, isSubmitting, isVenueAdmin, startTime, title],
    );

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
            const series = await createEventSeries(
                {
                    title: title.trim(),
                    description: description.trim(),
                    status: "active",
                    ticketURLBase: ticketURLBase.trim() || undefined,
                    posterURL: posterURL.trim() || undefined,
                    ageLimit: ageLimit.trim() ? parseInt(ageLimit, 10) : undefined,
                },
            );

            const occurrence = await createEventOccurrence(
                {
                    seriesId: series.id,
                    startTime: startTime.trim(),
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

                <Text style={styles.title}>Create Event</Text>

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
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>First Occurrence</Text>

                    <TextInput
                        editable={!isSubmitting}
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="Start time ISO (e.g. 2026-07-01T20:00:00.000Z)"
                        placeholderTextColor="#94a3b8"
                        style={styles.input}
                        autoCapitalize="none"
                    />

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

                    <TextInput
                        editable={!isSubmitting}
                        value={artistIdsRaw}
                        onChangeText={setArtistIdsRaw}
                        placeholder="Artist IDs (comma-separated, optional)"
                        placeholderTextColor="#94a3b8"
                        style={styles.input}
                        autoCapitalize="none"
                    />
                </View>

                {errorMessage ? (
                    <View style={styles.errorPanel}>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                ) : null}
            </ScrollView>
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
