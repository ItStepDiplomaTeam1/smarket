import { Outlet } from 'react-router-dom';
import { Header } from '@/shared/ui/Header';
import { Footer } from '@/shared/ui/Footer';

export const MainLayout = () => {
  return (
    <div className="app-container flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
