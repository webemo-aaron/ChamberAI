import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert
} from "react-native";
import { endpoints, Meeting, ActionItem } from "../api/endpoints";
import { apiClient } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import ActionItemRow from "../components/ActionItemRow";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8
  },
  metadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  metaText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 6
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12
  },
  sectionContent: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8
  },
  actionItemsList: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    overflow: "hidden"
  },
  actionItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 12
  },
  button: {
    backgroundColor: "#1f2937",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12
  }
});

interface MeetingDetailScreenProps {
  route: {
    params: { id: string };
  };
  navigation: any;
}

export default function MeetingDetailScreen({
  route,
  navigation
}: MeetingDetailScreenProps) {
  const meetingId = route.params.id;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMeetingData();
  }, [meetingId]);

  const loadMeetingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [meetingRes, itemsRes] = await Promise.all([
        endpoints.meetings.detail(meetingId),
        endpoints.actionItems.listByMeeting(meetingId)
      ]);

      setMeeting(meetingRes.data);
      setActionItems(itemsRes.data.data);
    } catch (err: any) {
      setError(err.message || "Failed to load meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMeeting = async () => {
    try {
      Alert.alert("Confirm", "Approve this meeting?", [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Approve",
          onPress: async () => {
            await endpoints.meetings.approve(meetingId);
            await loadMeetingData();
            Alert.alert("Success", "Meeting approved");
          }
        }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to approve meeting");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1f2937" />
      </View>
    );
  }

  if (error || !meeting) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.emptyText}>{error || "Meeting not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.title}>{meeting.title}</Text>
            <StatusBadge status={meeting.status} />
          </View>
          <View style={styles.metadata}>
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>📅 {meeting.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>📍 {meeting.location}</Text>
            </View>
          </View>
          <View style={styles.metadata}>
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>
                👥 {meeting.attendance_count || 0} attendees
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action Items</Text>
          {actionItems.length === 0 ? (
            <Text style={styles.emptyText}>No action items</Text>
          ) : (
            <View style={styles.actionItemsList}>
              {actionItems.map((item, idx) => (
                <View key={item.id} style={styles.actionItem}>
                  <ActionItemRow item={item} />
                </View>
              ))}
            </View>
          )}
        </View>

        {meeting.status === "ACTIVE" && (
          <TouchableOpacity style={styles.button} onPress={handleApproveMeeting}>
            <Text style={styles.buttonText}>Approve Meeting</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
