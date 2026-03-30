import { useState, useCallback, useEffect } from "react";
import { endpoints, ActionItem } from "../api/endpoints";
import { useAuth } from "../auth/AuthProvider";
import { apiClient } from "../api/client";
import { MMKV } from "react-native-mmkv";

const offlineQueue = new MMKV({ id: "action-items-queue" });

export function useActionItems() {
  const { idToken, orgId } = useAuth();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queuedUpdates, setQueuedUpdates] = useState<any[]>([]);

  // Update API client auth when user logs in
  useEffect(() => {
    if (idToken && orgId) {
      apiClient.setAuth(idToken, orgId);
    }
  }, [idToken, orgId]);

  // Load from cache first
  useEffect(() => {
    const cached = offlineQueue.getString("action-items");
    if (cached) {
      try {
        setItems(JSON.parse(cached));
      } catch (e) {
        // Invalid cache
      }
    }
  }, []);

  const loadActionItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await endpoints.actionItems.myOpen();
      const newItems = response.data.data;

      setItems(newItems);

      // Cache for offline
      offlineQueue.set("action-items", JSON.stringify(newItems));

      // Flush any queued updates
      const queue = offlineQueue.getString("queue");
      if (queue) {
        const updates = JSON.parse(queue);
        for (const update of updates) {
          try {
            await endpoints.actionItems.update(update.id, update.data);
          } catch (e) {
            // Keep in queue if failed
            return;
          }
        }
        offlineQueue.delete("queue");
        setQueuedUpdates([]);
      }
    } catch (error) {
      console.error("Failed to load action items:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (idToken && orgId) {
      loadActionItems();
    }
  }, [idToken, orgId, loadActionItems]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadActionItems();
  }, [loadActionItems]);

  // Queue an update for offline handling
  const queueUpdate = useCallback((itemId: string, data: any) => {
    const update = { id: itemId, data, timestamp: Date.now() };
    const queue = offlineQueue.getString("queue");
    const updates = queue ? JSON.parse(queue) : [];
    updates.push(update);
    offlineQueue.set("queue", JSON.stringify(updates));
    setQueuedUpdates(updates);
  }, []);

  return {
    items,
    loading,
    refreshing,
    refresh,
    queueUpdate,
    queuedUpdates
  };
}
