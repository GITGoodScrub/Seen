import { requestJsonWithFailover } from "./apiClientService";
import {
    EventReminderSettings,
    EventReminderSettingsResponse,
} from "./eventReminderSettingsTypes";

const reminderSettingsRoute = "/api/eventReminderSettings";

export const loadEventReminderSettings = async (): Promise<EventReminderSettings> =>
{
    const response = await requestJsonWithFailover<EventReminderSettingsResponse>(
        reminderSettingsRoute,
    );

    return response.settings;
};

export const saveEventReminderSettings = async (
    settings: EventReminderSettings,
): Promise<EventReminderSettings> =>
{
    const response = await requestJsonWithFailover<EventReminderSettingsResponse>(
        reminderSettingsRoute,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(settings),
        },
    );

    return response.settings;
};
