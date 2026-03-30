import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert
} from "react-native";
import { useActionItems } from "../hooks/useActionItems";
import ActionItemRow from "../components/ActionItemRow";
import { endpoints, ActionItem } from "../api/endpoints";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20
  },
  itemContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden"
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#d1d5db",
    borderRadius: 4
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937"
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center"
  }
});

export default function ActionItemsScreen() {
  const { items, loading, refreshing, refresh } = useActionItems();
  const [completing, setCompleting] = useState<string | null>(null);

  const handleCompleteItem = async (item: ActionItem) => {
    Alert.alert("Mark Complete?", item.description, [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Mark Complete",
        onPress: async () => {
          try {
            setCompleting(item.id);
            await endpoints.actionItems.complete(item.id);
            await refresh();
            Alert.alert("Success", "Action item marked complete");
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to mark complete");
          } finally {
            setCompleting(null);
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: ActionItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <ActionItemRow item={item} />
        </View>
        {item.status === "OPEN" && completing !== item.id && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteItem(item)}
          >
            <Text style={styles.completeButtonText}>Done</Text>
          </TouchableOpacity>
        )}
        {completing === item.id && (
          <ActivityIndicator color="#1f2937" size="small" />
        )}
      </View>
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1f2937" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        contentContainerStyle={
          items.length === 0 ? styles.loaderContainer : styles.contentContainer
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>No open action items</Text>
          )
        }
      />
    </View>
  );
}
