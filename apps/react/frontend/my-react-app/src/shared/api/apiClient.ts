import axios from 'axios';
import { useAuthStore } from '@/modules/Auth/store/authStore';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Додаємо інтерцептор запитів
apiClient.interceptors.request.use((config) => {
  // Дістаємо токен безпосередньо зі стору (це працює поза React-компонентами!)
  const token = useAuthStore.getState().token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});