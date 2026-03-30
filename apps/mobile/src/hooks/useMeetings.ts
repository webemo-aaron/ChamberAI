import { useState, useCallback, useEffect } from "react";
import { endpoints, Meeting } from "../api/endpoints";
import { useAuth } from "../auth/AuthProvider";
import { apiClient } from "../api/client";

export function useMeetings() {
  const { idToken, orgId } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [nextSince, setNextSince] = useState<string | undefined>();
  const [limit] = useState(50);

  // Update API client auth when user logs in
  useEffect(() => {
    if (idToken && orgId) {
      apiClient.setAuth(idToken, orgId);
    }
  }, [idToken, orgId]);

  const loadMeetings = useCallback(
    async (initialLoad: boolean = false) => {
      try {
        if (initialLoad) {
          setLoading(true);
          setOffset(0);
          setMeetings([]);
        }

        const response = await endpoints.meetings.list(limit, offset, nextSince);
        const newMeetings = response.data.data;
        const total = response.data.total;

        setMeetings((prev) => (initialLoad ? newMeetings : [...prev, ...newMeetings]));
        setNextSince(response.data.next_since);
        setOffset((prev) => (initialLoad ? limit : prev + limit));
        setHasMore(offset + limit < total);
      } catch (error) {
        console.error("Failed to load meetings:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [offset, limit, nextSince]
  );

  useEffect(() => {
    if (idToken && orgId) {
      loadMeetings(true);
    }
  }, [idToken, orgId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadMeetings(true);
  }, [loadMeetings]);

  const loadMore = useCallback(async () => {
    if (hasMore) {
      await loadMeetings(false);
    }
  }, [hasMore, loadMeetings]);

  return { meetings, loading, refreshing, hasMore, loadMore, refresh };
}
