import * as Notifications from "expo-notifications";
import { getToken } from "expo-notifications";
import { endpoints } from "../api/endpoints";

export class NotificationService {
  private tokenRegistered = false;

  async init() {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted");
      return;
    }

    // Register for push notifications
    await this.registerToken();

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true
        };
      }
    });

    // Listen to foreground notifications
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        this.handleNotification(notification);
      }
    );

    return subscription;
  }

  private async registerToken() {
    try {
      const token = await getToken({ projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID });
      if (!token) {
        console.warn("No FCM token received");
        return;
      }

      // Determine platform
      const platform = await this.getPlatform();

      // Register with backend
      await endpoints.notifications.registerToken(token, platform);
      this.tokenRegistered = true;

      console.log("FCM token registered:", token.substring(0, 20) + "...");
    } catch (error) {
      console.error("Failed to register FCM token:", error);
    }
  }

  private async getPlatform(): Promise<"ios" | "android"> {
    const notification = await Notifications.getLastNotificationResponseAsync();
    // In a real app, you'd use Platform.OS
    // For now, return "android" as default (should be overridden in production)
    return "android";
  }

  private handleNotification(notification: Notifications.Notification) {
    const data = notification.request.content.data;

    // Route based on notification type
    if (data.event_type === "meeting_created" || data.event_type === "meeting_approved") {
      // Navigate to meetings list
      console.log("Meeting notification:", data);
    } else if (data.event_type === "action_item_reminder") {
      // Navigate to action items
      console.log("Action item notification:", data);
    }
  }

  async unregister() {
    if (this.tokenRegistered) {
      await endpoints.notifications.unregisterToken();
      this.tokenRegistered = false;
    }
  }
}

export const notificationService = new NotificationService();
