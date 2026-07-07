import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { CatalogSkeleton, ShopsSkeleton, PageSkeleton, ProductDetailSkeleton } from '@/shared/ui';

const HomePage = lazy(() => import('@/pages/Home/ui/Home.tsx'));
const AuthPage = lazy(() => import('@/pages/Auth'));
const Registerform = lazy(() => import('@/pages/Register/ui/RegisterPage.tsx')); 
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword/ui/ForgotPasswordPage.tsx')); 
const LoginPage = lazy(() => import('@/pages/Login/ui/LoginPage.tsx'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail/ui/ProductDetail.tsx'));
const Profile = lazy(() => import('@/pages/Profile/ui/ProfilePage.tsx'));
const Catalog = lazy(() => import('@/pages/Catalog/ui/Catalog.tsx'));
const ShopsPage = lazy(() => import('@/pages/Shops/ui/ShopPage.tsx'));
const CartPage = lazy(() => import('@/pages/Cart/ui/CartPage.tsx').then(m => ({ default: m.CartPage })));

const ConfidentialPolicy = lazy(() => import('@/pages/ConfidentionalPolicy/ui/ConfidentialPolicyPage.tsx'));
const Privacy = lazy(() => import('@/pages/Privacy/ui/PrivacyPage.tsx'));
const UsingConditions = lazy(() => import('@/pages/UsingConditions/ui/UsingConditionsPage.tsx'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
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
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
