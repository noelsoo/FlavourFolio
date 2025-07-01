import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Header from './Header';

const MainLayout = () => {
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>
      {!isSettingsPage && <BottomNavigation />}
    </div>
  );
};

export default MainLayout;