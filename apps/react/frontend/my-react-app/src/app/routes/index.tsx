import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/Home/ui/Home'));
const AuthPage = lazy(() => import('@/pages/Auth'));
const RegisterPage = lazy(() => import('@/pages/Register/ui/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword/ui/ForgotPasswordPage'));
const LoginPage = lazy(() => import('@/pages/Login/ui/LoginPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetail/ui/ProductDetail'));
const ProfilePage = lazy(() => import('@/pages/Profile/ui/ProfilePage'));
const CatalogPage = lazy(() => import('@/pages/Catalog/ui/Catalog'));

const fallback = <div />;

const router = createBrowserRouter([
  {
    path: '/',
    element: <Suspense fallback={fallback}><HomePage /></Suspense>,
  },
  {
    path: '/auth',
    element: <Suspense fallback={fallback}><AuthPage /></Suspense>,
  },
  {
    path: '/register',
    element: <Suspense fallback={fallback}><RegisterPage /></Suspense>,
  },
  {
    path: '/forgot-password',
    element: <Suspense fallback={fallback}><ForgotPasswordPage /></Suspense>,
  },
  {
    path: '/login',
    element: <Suspense fallback={fallback}><LoginPage /></Suspense>,
  },
  {
    path: '/product/:id',
    element: <Suspense fallback={fallback}><ProductDetailPage /></Suspense>,
  },
  {
    path: '/profile',
    element: <Suspense fallback={fallback}><ProfilePage /></Suspense>,
  },
  {
    path: '/catalog',
    element: <Suspense fallback={fallback}><CatalogPage /></Suspense>,
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;