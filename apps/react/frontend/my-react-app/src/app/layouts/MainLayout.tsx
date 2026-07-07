import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/shared/ui/Header';
import { Footer } from '@/shared/ui/Footer';
import { AiChatWidget } from '@/modules/AiChat';

export const MainLayout = () => {
  const location = useLocation();

  return (
    <div className="app-container flex flex-col min-h-screen">
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
