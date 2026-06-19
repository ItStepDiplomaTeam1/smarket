import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

const HomePage = lazy(() => import('@/pages/Home/ui/Home.tsx'));
const AuthPage = lazy(() => import('@/pages/Auth'));
const Registerform = lazy(() => import('@/pages/Register/ui/RegisterPage.tsx')); 
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword/ui/ForgotPasswordPage.tsx')); 
const LoginPage = lazy(() => import('@/pages/Login/ui/LoginPage.tsx'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail/ui/ProductDetail.tsx'));
const Profile = lazy(() => import('@/pages/Profile/ui/ProfilePage.tsx'));
const Catalog = lazy(() => import('@/pages/Catalog/ui/Catalog.tsx'));
const CartPage = lazy(() => import('@/pages/Cart/ui/CartPage.tsx').then(m => ({ default: m.CartPage })));

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: (
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
        path: '/register',
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
      },
      {
        path: '/catalog',
        element: (
          <Suspense fallback={<div>Завантаження каталогу...</div>}>
            <Catalog />
          </Suspense>
        ),
      },
      {
        path: '/cart',
        element: (
          <Suspense fallback={<div>Завантаження кошика...</div>}>
            <CartPage />
          </Suspense>
        ),
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
