import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './Layout.module.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className={styles.container}>
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className={styles.content}>
        <Header onToggleSidebar={() => setIsMobileSidebarOpen((open) => !open)} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
