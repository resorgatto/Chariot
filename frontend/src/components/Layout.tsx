import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 bg-transparent">
        <Header onToggleSidebar={() => setIsMobileSidebarOpen((open) => !open)} />
        <main className="p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
