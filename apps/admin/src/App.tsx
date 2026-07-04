import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useInitAuth } from '@/hooks/useInitAuth';
import { useAuthStore } from '@/store/useAuthStore';

// Lazy loaded pages
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const ProductsTable = React.lazy(() => import('@/pages/ProductsTable'));
const CategoriesPage = React.lazy(() => import('@/pages/CategoriesPage'));
const StoresPage = React.lazy(() => import('@/pages/StoresPage'));
const UsersPage = React.lazy(() => import('@/pages/UsersPage'));
const Login = React.lazy(() => import('@/pages/Login'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-[#F0F2F5]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

/**
 * Inner component that runs useInitAuth (needs to be inside BrowserRouter
 * so that hooks which use navigate/location work correctly).
 */
function AppRoutes() {
  useInitAuth();
  const isInitializing = useAuthStore((s) => s.isInitializing);

  // While we are checking the cookie / silent refresh, show a spinner.
  // This prevents a flash of the login page for already-authenticated admins.
  if (isInitializing) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductsTable />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/stores" element={<StoresPage />} />
            {/* Placeholders for future routes */}
            <Route path="/retailers" element={<div className="p-6">Retailers Module (Coming Soon)</div>} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<div className="p-6">Settings Module (Coming Soon)</div>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
