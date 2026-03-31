/**
 * Notification dispatch service
 * Sends push notifications to mobile devices via Firebase Cloud Messaging (FCM)
 */

import admin from "firebase-admin";

/**
 * Send a notification to all registered devices in an organization
 * @param {object} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {object} notification - Notification payload
 * @returns {Promise<object>} - Response from FCM (tokens sent, failures)
 */
export async function sendToOrg(db, orgId, notification) {
  try {
    // Fetch all device tokens for this org
    const tokensSnap = await db
      .collection("organizations")
      .doc(orgId)
      .collection("device_tokens")
      .get();

    if (tokensSnap.empty) {
      console.log(`No devices registered for org ${orgId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    const tokens = tokensSnap.docs.map((doc) => doc.data().token).filter((t) => t);

    if (tokens.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }

    // Send multicast message to all devices
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        event_type: notification.event_type || "notification",
        ...notification.data
      }
    };

    const response = await admin.messaging().sendMulticast({
      tokens,
      ...message
    });

    console.log(`Sent notification to ${response.successCount} devices in org ${orgId}`);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      // Remove invalid tokens from Firestore
      const batch = db.batch();
      tokensSnap.docs.forEach((doc) => {
        if (failedTokens.includes(doc.data().token)) {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();
    }

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount
    };
  } catch (error) {
    console.error(`Failed to send notification to org ${orgId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a notification to a specific user's devices
 * @param {object} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {string} userEmail - User email (identifies device tokens)
 * @param {object} notification - Notification payload
 * @returns {Promise<object>} - Response from FCM
 */
export async function sendToUser(db, orgId, userEmail, notification) {
  try {
    // Fetch device tokens for this user
    const tokensSnap = await db
      .collection("organizations")
      .doc(orgId)
      .collection("device_tokens")
      .where("email", "==", userEmail)
      .get();

    if (tokensSnap.empty) {
      console.log(`No devices registered for ${userEmail} in org ${orgId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    const tokens = tokensSnap.docs.map((doc) => doc.data().token).filter((t) => t);

    if (tokens.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        event_type: notification.event_type || "notification",
        ...notification.data
      }
    };

    const response = await admin.messaging().sendMulticast({
      tokens,
      ...message
    });

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      const batch = db.batch();
      tokensSnap.docs.forEach((doc) => {
        if (failedTokens.includes(doc.data().token)) {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();
    }

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount
    };
  } catch (error) {
    console.error(`Failed to send notification to ${userEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Build a notification payload for a meeting event
 * @param {object} meeting - Meeting document
 * @param {string} eventType - "created", "approved", "uploaded"
 * @returns {object} - Notification payload
 */
export function buildMeetingNotification(meeting, eventType) {
  const date = meeting.date || "Unknown date";
  const location = meeting.location || "Unknown location";

  const messages = {
    created: {
      title: "New meeting scheduled",
      body: `Meeting on ${date} at ${location}`
    },
    approved: {
      title: "Minutes approved",
      body: `Minutes for meeting on ${date} have been approved`
    },
    uploaded: {
      title: "Meeting uploaded",
      body: `Audio for meeting on ${date} has been processed`
    }
  };

  const template = messages[eventType] || messages.created;

  return {
    title: template.title,
    body: template.body,
    event_type: `meeting_${eventType}`,
    data: {
      meeting_id: meeting.id,
      meeting_date: date,
      notification_type: "meeting"
    }
  };
}

/**
 * Build a notification payload for an action item reminder
 * @param {object} actionItem - Action item document
 * @param {number} daysOverdue - 0 = due today, positive = days overdue
 * @returns {object} - Notification payload
 */
export function buildActionItemNotification(actionItem, daysOverdue) {
  const description = actionItem.description || "Action item";
  const dueDate = actionItem.due_date || "Unknown date";

  let title = "Action item reminder";
  let body = `${description} is due on ${dueDate}`;

  if (daysOverdue > 0) {
    title = "Action item overdue";
    body = `${description} was due on ${dueDate} (${daysOverdue} days overdue)`;
  }

  return {
    title,
    body,
    event_type: "action_item_reminder",
    data: {
      action_item_id: actionItem.id,
      meeting_id: actionItem.meeting_id,
      due_date: dueDate,
      notification_type: "action_item"
    }
  };
}

/**
 * Build a notification payload for minutes pending approval
 * @param {object} meeting - Meeting document
 * @param {string} submittedBy - Email of person who submitted
 * @returns {object} - Notification payload
 */
export function buildMinutesNotification(meeting, submittedBy) {
  const date = meeting.date || "Unknown date";

  return {
    title: "Minutes ready for review",
    body: `Draft minutes for meeting on ${date} are ready for approval`,
    event_type: "minutes_pending_approval",
    data: {
      meeting_id: meeting.id,
      meeting_date: date,
      submitted_by: submittedBy,
      notification_type: "minutes"
    }
  };
}
