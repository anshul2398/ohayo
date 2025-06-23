const NOTIFICATION_ID_KEY = '@dailyNotificationId';
const NOTIF_SCHEDULED_DATE_KEY = '@notificationScheduledDate';

export const scheduleDaily8amNotification = async (userName, quote, temp = '') => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const lastScheduled = await AsyncStorage.getItem(NOTIF_SCHEDULED_DATE_KEY);
    if (lastScheduled === today) {
      console.log("Notification already scheduled for today");
      return;
    }

    const prevNotificationId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (prevNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(prevNotificationId);
    }

    const trigger = {
      hour: 8,
      minute: 0,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Ohayo, ${userName || 'buddy'}! ☀️`,
        body: `"${quote}"${temp ? ` It's currently ${temp}°C.` : ''}`,
      },
      trigger,
    });

    await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);
    await AsyncStorage.setItem(NOTIF_SCHEDULED_DATE_KEY, today);
    console.log("Scheduled daily 8 AM notification:", notificationId);
  } catch (error) {
    console.error("Error scheduling 8AM notification:", error);
  }
};