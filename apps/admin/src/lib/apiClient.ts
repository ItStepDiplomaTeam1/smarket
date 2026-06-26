import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Axios instance pre-configured for the Smarket API Gateway.
 *
 * - baseURL points to /api/v1 (proxied by Vite dev-server → localhost:8080 in dev,
 *   should be set via VITE_API_URL env var in production).
 * - withCredentials: true  →  the browser automatically attaches HttpOnly cookies
 *   (refresh_token) on every request.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://157.180.74.21:8080/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
// Attach the access token (kept only in Zustand memory, never in localStorage)
// to every request as a Bearer header.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
// On 401, attempt a silent token refresh. If refresh succeeds, retry the
// original request. If refresh fails (cookie expired/revoked), clear auth state
// and redirect to /login.

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh') || originalRequest?.url?.endsWith('/refresh');

    // Only intercept 401 errors that are not refresh requests and haven't already been retried
    if (error.response?.status === 401 && !isRefreshRequest && !originalRequest?._retry) {
      if (isRefreshing) {
        // Queue the request until a refresh is in progress
        return new Promise<string>((resolve) => {
          refreshQueue.push(resolve);
        }).then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // POST /api/v1/auth/refresh — the HttpOnly cookie is sent automatically
        const { data } = await apiClient.post<{ access_token: string }>('/auth/refresh');
        const newToken = data.access_token;

        useAuthStore.getState().setToken(newToken);
        processQueue(newToken);

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — force logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
