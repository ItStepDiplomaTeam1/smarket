import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { lazyWithRetry } from '@/shared/utils/lazyWithRetry';
import { RootErrorBoundary } from '@/shared/components/ErrorBoundary/RootErrorBoundary';

const HomePage = lazyWithRetry(() => import('@/pages/Home/ui/Home'));
const AuthPage = lazyWithRetry(() => import('@/pages/Auth'));
const RegisterPage = lazyWithRetry(() => import('@/pages/Register/ui/RegisterPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('@/pages/ForgotPassword/ui/ForgotPasswordPage'));
const LoginPage = lazyWithRetry(() => import('@/pages/Login/ui/LoginPage'));
const ProductDetailPage = lazyWithRetry(() => import('@/pages/ProductDetail/ui/ProductDetail'));
const ProfilePage = lazyWithRetry(() => import('@/pages/Profile/ui/ProfilePage'));
const CatalogPage = lazyWithRetry(() => import('@/pages/Catalog/ui/Catalog'));
const ShopsPage = lazyWithRetry(() => import('@/pages/Shops/ui/ShopPage'));
const CartPage = lazyWithRetry(() => import('@/pages/Cart/ui/CartPage.tsx').then(m => ({ default: m.CartPage })));

const ConfidentialPolicyPage = lazyWithRetry(() => import('@/pages/ConfidentionalPolicy/ui/ConfidentialPolicyPage'));
const PrivacyPage = lazyWithRetry(() => import('@/pages/Privacy/ui/PrivacyPage'));
const UsingConditionsPage = lazyWithRetry(() => import('@/pages/UsingConditions/ui/UsingConditionsPage'));

const fallback = <div>Завантаження...</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
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
        path: '/product/:idAndSlug', 
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
      {
        path: '/cart',
        element: <Suspense fallback={fallback}><CartPage /></Suspense>,
      },
      {
        path: '/confidential-policy',
        element: <Suspense fallback={fallback}><ConfidentialPolicyPage /></Suspense>,
      },
      {
        path: '/privacy',
        element: <Suspense fallback={fallback}><PrivacyPage /></Suspense>,
      },
      {
        path: '/using-conditions',
        element: <Suspense fallback={fallback}><UsingConditionsPage /></Suspense>,
      },
      {
        path: '/shops',
        element: <Suspense fallback={fallback}><ShopsPage /></Suspense>,
      }
    ]
  }
]);

export const AppRouter = () => <RouterProvider router={router} />;