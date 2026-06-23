import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/modules/Auth/store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Логіка автоматичного оновлення токена ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token as string);
    }
  });
  failedQueue = [];
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    // Токен вважається простроченим, якщо до закінчення залишилось менше 10 секунд
    return payload.exp - currentTime < 10;
  } catch (e) {
    return true;
  }
}

// Інтерцептор запитів — підставляємо актуальний токен з Zustand (проактивно оновлюємо, якщо прострочений)
apiClient.interceptors.request.use(
  async (config) => {
    let token = useAuthStore.getState().token;
    const isRefreshEndpoint = config.url?.includes('/api/v1/auth/refresh');

    if (token && !isRefreshEndpoint && isTokenExpired(token)) {
      if (isRefreshing) {
        try {
          token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({
              resolve,
              reject: (err) => reject(err),
            });
          });
        } catch (err) {
          return Promise.reject(err);
        }
      } else {
        isRefreshing = true;
        try {
          const { data } = await apiClient.post<{ access_token: string }>(
            '/api/v1/auth/refresh',
          );
          token = data.access_token;
          useAuthStore.setState({ token });
          processQueue(null, token);
        } catch (refreshError) {
          processQueue(refreshError, null);
          useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Інтерцептор відповідей — обробляємо 401 і тихо оновлюємо токен
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    const is401 = error.response?.status === 401;
    const isRefreshEndpoint = originalRequest.url?.includes('/api/v1/auth/refresh');

    // Якщо помилка на самому refresh-ендпоінті або запит вже повторювався — логаут
    if (is401 && (isRefreshEndpoint || originalRequest._retry)) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (is401) {
      if (isRefreshing) {
        // Запит чекає, поки виконується refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post<{ access_token: string }>(
          '/api/v1/auth/refresh',
        );
        const newToken = data.access_token;

        // Оновлюємо токен у Zustand
        useAuthStore.setState({ token: newToken });

        // Оновлюємо заголовок для поточного запиту
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }

        processQueue(null, newToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);