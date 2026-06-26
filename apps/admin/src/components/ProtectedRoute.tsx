import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export const ProtectedRoute: React.FC = () => {
  const { token, isAdmin } = useAuthStore();
  const location = useLocation();

  if (!token) {
    // Not logged in → redirect to login, preserve intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin()) {
    // Logged in but not an admin
    return (
      <div className="flex items-center justify-center h-screen bg-[#F0F2F5] text-textMain">
        <div className="text-center bg-white rounded-2xl p-12 shadow-sm border border-border max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-accentRed text-3xl">✕</span>
          </div>
          <h1 className="font-manrope text-2xl font-bold mb-2 text-textMain">Доступ заборонено</h1>
          <p className="text-textMuted text-sm">Ви не маєте прав адміністратора для перегляду цієї сторінки.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
