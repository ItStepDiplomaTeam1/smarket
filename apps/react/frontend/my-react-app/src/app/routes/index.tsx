
// src/app/routes/index.tsx
import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Ліниве завантаження сторінок (використовуємо наш налаштований аліас @/) !!!!
const HomePage = lazy(() => import('@/pages/Home/ui/Home.tsx')); // !!!!!!!!!!!!
const AuthPage = lazy(() => import('@/pages/Auth')); // !!!!!!!!!!!!
const Registerform = lazy(() => import('@/pages/Register/ui/RegisterPage.tsx')); 

// Створюємо конфігурацію маршрутів
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      // Suspense перехоплює момент завантаження чанка сторінки
      <Suspense fallback={<div>Завантаження сторінки...</div>}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: '/auth',
    element: (
      <Suspense fallback={<div>Завантаження авторизації...</div>}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    path: '/create',
    element: (
      <Suspense fallback={<div>Завантаження реєстрації...</div>}>
        <Registerform />
      </Suspense>
    ),
  },
]);

// Експортуємо провайдер, який огорне наш додаток
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};