import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/modules/Profile';
import { useAuthStore } from '@/modules/Auth/store/authStore';

export default function ProfilePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="w-full min-h-screen bg-[#F9FBFB] dark:bg-[#111A17] transition-colors duration-200">

      <div className="flex flex-col lg:flex-row items-start gap-6 max-w-[1200px] mx-auto w-full pt-8 pb-12 px-4">
        
        <Sidebar />
        
        <div className="flex-1 min-w-0 w-full">
          <Outlet />
        </div>

      </div>
      
    </main>
  );
}