import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import logo from '@/assets/Logo-Smarket.svg';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-background text-textMain overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <div className="max-w-[1400px] mx-auto min-h-full flex flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
            
            {/* Footer */}
            <footer className="mt-12 pt-8 pb-6 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-sm text-textMuted">
              <div className="flex flex-col gap-2 max-w-sm">
                <img src={logo} alt="Smarket Logo" className="h-5 w-auto object-contain self-start grayscale opacity-70" />
                <p>Smarket — сервіс для розумного порівняння цін і планування покупок.</p>
              </div>
              <div className="flex flex-col md:flex-row gap-8 md:gap-16">
                <div className="flex flex-col gap-2">
                  <a href="#" className="hover:text-primary transition-colors font-medium text-textMain">Акції</a>
                  <a href="#" className="hover:text-primary transition-colors font-medium text-textMain">Магазини</a>
                </div>
                <div className="flex flex-col gap-2">
                  <a href="#" className="hover:text-primary transition-colors font-medium text-textMain">Категорії</a>
                  <a href="#" className="hover:text-primary transition-colors font-medium text-textMain">Як це працює</a>
                </div>
                <div className="flex flex-col gap-2">
                  <a href="#" className="hover:text-primary transition-colors">Політика конфіденційності</a>
                  <a href="#" className="hover:text-primary transition-colors">Умови використання</a>
                  <a href="#" className="hover:text-primary transition-colors">Обробка персональних даних</a>
                </div>
              </div>
              <div className="w-full text-center md:hidden mt-4 pt-4 border-t border-border">
                © 2026 Smarket. All rights reserved.
              </div>
            </footer>
            <div className="hidden md:block w-full text-center pb-4 text-xs text-textMuted">
              © 2026 Smarket. All rights reserved.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
