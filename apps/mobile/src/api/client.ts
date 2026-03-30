import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { MMKV } from "react-native-mmkv";
import { useAuth, storage } from "../auth/AuthProvider";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4001";
const offlineQueue = new MMKV({ id: "offline-queue" });

interface QueuedRequest {
  method: string;
  url: string;
  data?: any;
  timestamp: number;
}

export class APIClient {
  private client: AxiosInstance;
  private idToken: string | null = null;
  private orgId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        if (this.idToken) {
          config.headers.Authorization = `Bearer ${this.idToken}`;
        }
        if (this.orgId) {
          config.headers["X-Org-ID"] = this.orgId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config || !config.retry) config.retry = 0;

        // Retry up to 3 times for 5xx errors or network errors
        if (
          (error.response?.status >= 500 || !error.response) &&
          config.retry < 3
        ) {
          config.retry += 1;
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, config.retry) * 1000)
          );
          return this.client(config);
        }

        // If offline or failed after retries, queue the request
        if (!error.response || error.code === "ECONNABORTED") {
          this.queueRequest(config);
        }

        return Promise.reject(error);
      }
    );
  }

  setAuth(idToken: string | null, orgId: string | null) {
    this.idToken = idToken;
    this.orgId = orgId;
  }

  private queueRequest(config: AxiosRequestConfig) {
    const queued: QueuedRequest = {
      method: config.method || "GET",
      url: config.url || "",
      data: config.data,
      timestamp: Date.now()
    };
    const queue = this.getQueue();
    queue.push(queued);
    offlineQueue.set("queue", JSON.stringify(queue));
  }

  private getQueue(): QueuedRequest[] {
    const queueStr = offlineQueue.getString("queue");
    return queueStr ? JSON.parse(queueStr) : [];
  }

  async flushQueue() {
    const queue = this.getQueue();
    const failed = [];

    for (const req of queue) {
      try {
        await this.client({
          method: req.method as any,
          url: req.url,
          data: req.data
        });
      } catch (error) {
        failed.push(req);
      }
    }

    if (failed.length === 0) {
      offlineQueue.delete("queue");
    } else {
      offlineQueue.set("queue", JSON.stringify(failed));
    }

    return failed.length === 0;
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new APIClient();
