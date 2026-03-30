import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text
} from "react-native";
import { Meeting } from "../api/endpoints";
import StatusBadge from "./StatusBadge";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    marginRight: 8
  },
  metadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  metaText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4
  }
});

interface MeetingCardProps {
  meeting: Meeting;
  onPress: () => void;
}

export default function MeetingCard({ meeting, onPress }: MeetingCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {meeting.title}
        </Text>
        <StatusBadge status={meeting.status} />
      </View>
      <View style={styles.metadata}>
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>📅</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {meeting.date}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>📍</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {meeting.location}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>👥</Text>
          <Text style={styles.metaText}>
            {meeting.attendance_count || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
