import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { CatalogSkeleton, ShopsSkeleton, PageSkeleton, ProductDetailSkeleton } from '@/shared/ui';
import { lazyWithRetry } from '@/shared/utils/lazyWithRetry';
import { RootErrorBoundary } from '@/shared/components/ErrorBoundary/RootErrorBoundary';

const HomePage = lazyWithRetry(() => import('@/pages/Home/ui/Home.tsx'));
const AuthPage = lazyWithRetry(() => import('@/pages/Auth'));
const Registerform = lazyWithRetry(() => import('@/pages/Register/ui/RegisterPage.tsx')); 
const ForgotPassword = lazyWithRetry(() => import('@/pages/ForgotPassword/ui/ForgotPasswordPage.tsx')); 
const ResetPassword = lazyWithRetry(() => import('@/pages/ResetPassword/ui/ResetPasswordPage.tsx'));
const LoginPage = lazyWithRetry(() => import('@/pages/Login/ui/LoginPage.tsx'));
const ProductDetail = lazyWithRetry(() => import('@/pages/ProductDetail/ui/ProductDetail.tsx'));
const Profile = lazyWithRetry(() => import('@/pages/Profile/ui/ProfilePage.tsx'));
const Catalog = lazyWithRetry(() => import('@/pages/Catalog/ui/Catalog.tsx'));
const ShopsPage = lazyWithRetry(() => import('@/pages/Shops/ui/ShopPage.tsx'));
const CartPage = lazyWithRetry(() => import('@/pages/Cart/ui/CartPage.tsx').then(m => ({ default: m.CartPage })));
const ReceiptPage = lazyWithRetry(() => import('@/pages/ReceiptPage/ReceiptPage.tsx'));

const ProfileDashboard = lazy(() => import('@/modules/Profile/components/MainContent').then(m => ({ default: m.MainContent })));
const ProfileReviews = lazy(() => import('@/modules/Profile/components/Reviews/ReviewsContent').then(m => ({ default: m.ReviewsContent })));
const ProfileBaskets = lazy(() => import('@/modules/Profile/components/Baskets/BasketsContent').then(m => ({ default: m.BasketsContent })));
const ProfileFavorites = lazy(() => import('@/modules/Profile/components/Favorites/FavoritesContent').then(m => ({ default: m.FavoritesContent })));
const ProfileSettings = lazy(() => import('@/modules/Profile/components/Settings/SettingsContent').then(m => ({ default: m.SettingsContent })));

const ConfidentialPolicy = lazyWithRetry(() => import('@/pages/ConfidentionalPolicy/ui/ConfidentialPolicyPage.tsx'));
const Privacy = lazyWithRetry(() => import('@/pages/Privacy/ui/PrivacyPage.tsx'));
const UsingConditions = lazyWithRetry(() => import('@/pages/UsingConditions/ui/UsingConditionsPage.tsx'));
const TelegramCallbackPage = lazyWithRetry(() => import('@/pages/TelegramCallback/ui/TelegramCallbackPage.tsx'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: '/auth',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <AuthPage />
          </Suspense>
        ),
      },
      {
        path: '/register',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Registerform />
          </Suspense>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <ForgotPassword />
          </Suspense>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <ResetPassword />
          </Suspense>
        ),
      },
      {
        path: '/login',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/product/:id',
        element: (
          <Suspense fallback={<ProductDetailSkeleton />}>
            <ProductDetail />
          </Suspense>
        ),
      },
      {
        path: '/profile',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Profile />
          </Suspense>
        ),
        children: [
          { index: true, element: <Suspense fallback={<div>Завантаження...</div>}><ProfileDashboard /></Suspense> },
          { path: 'reviews', element: <Suspense fallback={<div>Завантаження...</div>}><ProfileReviews /></Suspense> },
          { path: 'baskets', element: <Suspense fallback={<div>Завантаження...</div>}><ProfileBaskets /></Suspense> },
          { path: 'favorites', element: <Suspense fallback={<div>Завантаження...</div>}><ProfileFavorites /></Suspense> },
          { path: 'settings', element: <Suspense fallback={<div>Завантаження...</div>}><ProfileSettings /></Suspense> },
        ],
      },
      {
        path: '/catalog',
        element: (
          <Suspense fallback={<CatalogSkeleton />}>
            <Catalog />
          </Suspense>
        ),
      },
      {
        path: '/cart',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <CartPage />
          </Suspense>
        ),
      },
      {
        path: '/cart/:cartId',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <CartPage />
          </Suspense>
        ),
      },
      {
        path: '/ConfidentialPolicy',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <ConfidentialPolicy />
          </Suspense>
        ),
      },
      {
        path: '/Privacy',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Privacy />
          </Suspense>
        ),
      },
      {
        path: '/UsingConditions',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <UsingConditions />
          </Suspense>
        ),
      },
      {
        path: '/Shops',
        element: (
          <Suspense fallback={<ShopsSkeleton />}>
            <ShopsPage />
          </Suspense>
        ),
      },
      {
        path: '/auth/telegram/callback',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <TelegramCallbackPage />
          </Suspense>
        ),
      },
      {
        path: '/receipts/:token',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <ReceiptPage />
          </Suspense>
        ),
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
