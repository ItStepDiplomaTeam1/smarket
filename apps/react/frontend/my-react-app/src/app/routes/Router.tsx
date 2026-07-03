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

const ProfileDashboard = lazy(() => import('@/modules/Profile/components/MainContent').then(m => ({ default: m.MainContent })));
const ProfileReviews = lazy(() => import('@/modules/Profile/components/Reviews/ReviewsContent').then(m => ({ default: m.ReviewsContent })));
const ProfileBaskets = lazy(() => import('@/modules/Profile/components/Baskets/BasketsContent').then(m => ({ default: m.BasketsContent })));
const ProfileFavorites = lazy(() => import('@/modules/Profile/components/Favorites/FavoritesContent').then(m => ({ default: m.FavoritesContent })));
const ProfileSettings = lazy(() => import('@/modules/Profile/components/Settings/SettingsContent').then(m => ({ default: m.SettingsContent })));

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
      },
      {
        path: '/ConfidentialPolicy',
        element: (
          <Suspense fallback={<div>Завантаження політики конфіденційності...</div>}>
            <ConfidentialPolicy />
          </Suspense>
        ),
      },
      {
        path: '/Privacy',
        element: (
          <Suspense fallback={<div>Завантаження обробки персональних даних...</div>}>
            <Privacy />
          </Suspense>
        ),
      },
      {
        path: '/UsingConditions',
        element: (
          <Suspense fallback={<div>Завантаження умов використання...</div>}>
            <UsingConditions />
          </Suspense>
        ),
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
