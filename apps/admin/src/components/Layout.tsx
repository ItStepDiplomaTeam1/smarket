import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { IdleTimeoutManager } from './IdleTimeoutManager';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-[#F0F2F5] font-sans overflow-hidden relative">
      <IdleTimeoutManager />
      {/* Header card (full width at the top) */}
      <Header onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />

      {/* Bottom Area (Sidebar + Main content) */}
      <div className="flex-1 flex overflow-hidden p-4 lg:py-8 lg:px-[10%] gap-4 lg:gap-8 relative">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden rounded-2xl"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto pr-2 pb-2">
          <div className="max-w-[1400px] mx-auto min-h-full flex flex-col">
            <div className="flex-1 pb-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
