import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Map, Truck, LogOut, Building2, Users, ClipboardList, LocateFixed, BadgeCheck } from 'lucide-react';
import clsx from 'clsx';
import { clearTokens } from '@/lib/api';
import styles from './Sidebar.module.css';

type SidebarProps = {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onMobileClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("is_staff") === "true" || localStorage.getItem("is_superuser") === "true";
  const isDriver = localStorage.getItem("is_driver") === "true";

  useEffect(() => {
    if (isMobileOpen) {
      setIsCollapsed(false);
    }
  }, [isMobileOpen]);

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
    onMobileClose?.();
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    clsx(styles.navLink, isActive && styles.navLinkActive);

  return (
    <>
      <div
        className={clsx(styles.overlay, !isMobileOpen && styles.overlayHidden)}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          styles.sidebar,
          isMobileOpen && styles.sidebarOpen,
          isCollapsed && styles.sidebarCollapsed
        )}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className={styles.header}>
          {!isCollapsed && (
            <div className={styles.logoRow}>
              <img src="/logo2.png" alt="Chariot" style={{ height: 48, width: "auto", objectFit: "contain" }} />
              <span className={styles.logoText}>Chariot</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={clsx(styles.toggleButton, "hidden md:inline-flex")}
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
          <button
            onClick={onMobileClose}
            className={clsx(styles.toggleButton, "md:hidden")}
            aria-label="Fechar menu"
          >
            <ChevronLeft />
          </button>
        </div>
        <nav className={styles.nav}>
          {isAdmin ? (
            <>
              <NavLink to="/dashboard" className={navLinkClasses} onClick={onMobileClose}>
                <Home className={styles.navIcon} />
                {!isCollapsed && <span className={styles.navText}>Dashboard</span>}
              </NavLink>
              <NavLink to="/map" className={navLinkClasses} onClick={onMobileClose}>
                <Map className={styles.navIcon} />
                {!isCollapsed && <span className={styles.navText}>Map</span>}
              </NavLink>
              <NavLink to="/fleet" className={navLinkClasses} onClick={onMobileClose}>
                <Truck className={styles.navIcon} />
                {!isCollapsed && <span className={styles.navText}>Frota</span>}
              </NavLink>
              <NavLink to="/garages" className={navLinkClasses} onClick={onMobileClose}>
                <Building2 className={styles.navIcon} />
                {!isCollapsed && <span className={styles.navText}>Garagens</span>}
              </NavLink>
              <NavLink to="/users" className={navLinkClasses} onClick={onMobileClose}>
                <Users className={styles.navIcon} />
                {!isCollapsed && <span className={styles.navText}>Usuarios</span>}
              </NavLink>
              <NavLink to="/drivers" className={navLinkClasses} onClick={onMobileClose}>
                <BadgeCheck className={styles.navIcon} />
                {!isCollapsed && <span className={styles.navText}>Motoristas</span>}
              </NavLink>
              <NavLink to="/orders" className={navLinkClasses} onClick={onMobileClose}>
                <ClipboardList className={styles.navIcon} />
                {!isCollapsed && <span className={styles.navText}>Ordens</span>}
              </NavLink>
              <NavLink to="/service-board" className={navLinkClasses} onClick={onMobileClose}>
                <ClipboardList className={styles.navIcon} />
                {!isCollapsed && <span className={styles.navText}>Agenda O.S.</span>}
              </NavLink>
              <NavLink to="/coverage" className={navLinkClasses} onClick={onMobileClose}>
                <LocateFixed className={styles.navIcon} />
                {!isCollapsed && <span className={styles.navText}>Cobertura</span>}
              </NavLink>
            </>
          ) : isDriver ? (
            <NavLink to="/my-orders" className={navLinkClasses} onClick={onMobileClose}>
              <ClipboardList className={styles.navIcon} />
              {!isCollapsed && <span className={styles.navText}>Minhas ordens</span>}
            </NavLink>
          ) : null}
        </nav>
        <div className={styles.logout}>
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            <LogOut className={styles.navIcon} />
            {!isCollapsed && <span className={styles.navText}>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
