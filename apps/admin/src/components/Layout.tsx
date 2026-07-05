import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { IdleTimeoutManager } from './IdleTimeoutManager';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-[#F0F2F5] font-sans overflow-hidden p-5 md:p-8 gap-5 md:gap-8">
      <IdleTimeoutManager />
      {/* Sidebar card */}
      <Sidebar />

      {/* Right side (Header + Main content) */}
      <div className="flex-1 flex flex-col overflow-hidden gap-5 md:gap-8">
        <Header />
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
