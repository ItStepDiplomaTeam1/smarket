import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export const ProtectedRoute: React.FC = () => {
  const { token, isAdmin } = useAuthStore();
  const location = useLocation();

  if (!token) {
    // Not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin()) {
    // Logged in but not an admin
    return (
      <div className="flex items-center justify-center h-screen bg-background text-textMain">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-accentRed">Access Denied</h1>
          <p className="text-textMuted">You do not have administrative privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
