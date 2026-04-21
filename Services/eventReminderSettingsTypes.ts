export type EventReminderSettings = {
    remindOneWeek: boolean;
    remindTwentyFourHours: boolean;
    remindOneHour: boolean;
};

export type EventReminderSettingsResponse = {
    settings: EventReminderSettings;
};
