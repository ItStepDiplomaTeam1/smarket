import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from '@/shared/ui/Header';
import { Footer } from '@/shared/ui/Footer';
import { AiChatWidget } from '@/modules/AiChat';

export const MainLayout = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="app-container flex flex-col min-h-screen bg-[#F4F6F5] dark:bg-[#111A17]">
      <Header />
      <main className="flex-1">
        <div key={location.pathname} className="animate-page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
      <AiChatWidget />
    </div>
  );
};
