import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Lazy loaded pages
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const ProductsTable = React.lazy(() => import('@/pages/ProductsTable'));
const Login = React.lazy(() => import('@/pages/Login'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<ProductsTable />} />
                {/* Placeholders for other routes */}
                <Route path="/retailers" element={<div className="p-6">Retailers Module (Coming Soon)</div>} />
                <Route path="/users" element={<div className="p-6">Users Module (Coming Soon)</div>} />
                <Route path="/settings" element={<div className="p-6">Settings Module (Coming Soon)</div>} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
