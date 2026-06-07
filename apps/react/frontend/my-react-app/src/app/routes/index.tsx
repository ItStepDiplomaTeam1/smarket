
// src/app/routes/index.tsx
import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Ліниве завантаження сторінок (використовуємо наш налаштований аліас @/) !!!!
const HomePage = lazy(() => import('@/pages/Home/ui/Home.tsx')); // !!!!!!!!!!!!
const AuthPage = lazy(() => import('@/pages/Auth')); // !!!!!!!!!!!!
const Registerform = lazy(() => import('@/pages/Register/ui/RegisterPage.tsx')); 
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword/ui/ForgotPasswordPage.tsx')); 
const LoginPage = lazy(() => import('@/pages/Login/ui/LoginPage.tsx'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail/ui/ProductDetail.tsx'));
const Profile = lazy(() => import('@/pages/Profile/ui/ProfilePage.tsx'));

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
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<div>Завантаження відновлення пароля...</div>}>
        <ForgotPassword />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<div>Завантаження входу...</div>}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/product/:id',
    element: (
      <Suspense fallback={<div>Завантаження деталей продукту...</div>}>
        <ProductDetail />
      </Suspense>
    ),
  },
  {
    path: '/profile',
    element: (
      <Suspense fallback={<div>Завантаження профілю...</div>}>
        <Profile />
      </Suspense>
    ),
  }
]);

// Експортуємо провайдер, який огорне наш додаток
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};