import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { ActionItem } from "../api/endpoints";

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 4
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
    marginLeft: 3
  },
  overdue: {
    color: "#dc2626"
  }
});

interface ActionItemRowProps {
  item: ActionItem;
}

export default function ActionItemRow({ item }: ActionItemRowProps) {
  const dueDate = new Date(item.due_date);
  const today = new Date();
  const isOverdue = dueDate < today && item.status === "OPEN";

  return (
    <View style={styles.container}>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.metadata}>
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>📋</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {item.owner_name}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>📅</Text>
          <Text
            style={[styles.metaText, isOverdue && styles.overdue]}
            numberOfLines={1}
          >
            {item.due_date}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text
            style={[styles.metaText, item.status === "COMPLETED" && { color: "#10b981" }]}
          >
            {item.status === "OPEN" ? "⭕" : "✅"}
          </Text>
        </View>
      </View>
    </View>
  );
}
