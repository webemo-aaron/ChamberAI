import { apiClient } from "./client";

export interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string;
  status: "DRAFT" | "ACTIVE" | "APPROVED" | "ARCHIVED";
  attendance_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  id: string;
  description: string;
  due_date: string;
  status: "OPEN" | "COMPLETED";
  owner_name: string;
  meeting_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  next_cursor?: string;
  next_since?: string;
}

export const endpoints = {
  // Meetings endpoints
  meetings: {
    list: (limit = 50, offset = 0, since?: string) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset)
      });
      if (since) params.append("since", since);
      return apiClient.get<PaginatedResponse<Meeting>>(`/api/meetings?${params}`);
    },

    detail: (meetingId: string) =>
      apiClient.get<Meeting>(`/api/meetings/${meetingId}`),

    create: (data: Partial<Meeting>) =>
      apiClient.post<Meeting>("/api/meetings", data),

    update: (meetingId: string, data: Partial<Meeting>) =>
      apiClient.patch<Meeting>(`/api/meetings/${meetingId}`, data),

    approve: (meetingId: string) =>
      apiClient.post(`/api/meetings/${meetingId}/approve`, {})
  },

  // Action Items endpoints
  actionItems: {
    listByMeeting: (
      meetingId: string,
      limit = 50,
      offset = 0,
      since?: string,
      status?: "OPEN" | "COMPLETED"
    ) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset)
      });
      if (since) params.append("since", since);
      if (status) params.append("status", status);
      return apiClient.get<PaginatedResponse<ActionItem>>(
        `/api/meetings/${meetingId}/action-items?${params}`
      );
    },

    myOpen: () =>
      apiClient.get<PaginatedResponse<ActionItem>>("/api/action-items/my-open"),

    detail: (itemId: string) =>
      apiClient.get<ActionItem>(`/api/action-items/${itemId}`),

    create: (data: Partial<ActionItem>) =>
      apiClient.post<ActionItem>("/api/action-items", data),

    update: (itemId: string, data: Partial<ActionItem>) =>
      apiClient.patch<ActionItem>(`/api/action-items/${itemId}`, data),

    complete: (itemId: string) =>
      apiClient.patch<ActionItem>(`/api/action-items/${itemId}`, {
        status: "COMPLETED"
      })
  },

  // Notifications endpoints
  notifications: {
    registerToken: (token: string, platform: "ios" | "android") =>
      apiClient.post("/api/notifications/device-token", { token, platform }),

    unregisterToken: (tokenId?: string) => {
      const params = new URLSearchParams();
      if (tokenId) params.append("token_id", tokenId);
      return apiClient.delete(`/api/notifications/device-token?${params}`);
    },

    getPreferences: () =>
      apiClient.get("/api/notifications/preferences"),

    updatePreferences: (preferences: Record<string, boolean>) =>
      apiClient.patch("/api/notifications/preferences", { preferences })
  },

  // Health check
  health: () => apiClient.get("/health")
};
