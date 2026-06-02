import axios from 'axios';

/**
 * Базовий axios-клієнт для зв'язку з нашим API Gateway.
 * Усі мікросервісні запити будуть йти через цей інстанс.
 */
export const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000, // Чекаємо відповідь максимум 10 секунд
  headers: {
    'Content-Type': 'application/json',
  },
});

// Пізніше ми додамо сюди interceptors для автоматичного
// підкладання JWT-токенів у заголовки та глобальної обробки помилок (наприклад, 401).