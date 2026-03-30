import React from "react";
import { View, StyleSheet, Text } from "react-native";

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 60,
    alignItems: "center"
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600"
  },
  draft: {
    backgroundColor: "#e5e7eb"
  },
  draftText: {
    color: "#6b7280"
  },
  active: {
    backgroundColor: "#dbeafe"
  },
  activeText: {
    color: "#1e40af"
  },
  approved: {
    backgroundColor: "#dcfce7"
  },
  approvedText: {
    color: "#166534"
  },
  archived: {
    backgroundColor: "#f3f4f6"
  },
  archivedText: {
    color: "#6b7280"
  }
});

interface StatusBadgeProps {
  status: "DRAFT" | "ACTIVE" | "APPROVED" | "ARCHIVED";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    DRAFT: { bg: styles.draft, text: styles.draftText, label: "Draft" },
    ACTIVE: { bg: styles.active, text: styles.activeText, label: "Active" },
    APPROVED: {
      bg: styles.approved,
      text: styles.approvedText,
      label: "Approved"
    },
    ARCHIVED: {
      bg: styles.archived,
      text: styles.archivedText,
      label: "Archived"
    }
  };

  const config = statusConfig[status];

  return (
    <View style={[styles.badge, config.bg]}>
      <Text style={[styles.badgeText, config.text]}>{config.label}</Text>
    </View>
  );
}
