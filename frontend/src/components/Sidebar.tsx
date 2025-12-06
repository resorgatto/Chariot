import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Map, Truck, LogOut, Building2, Users, ClipboardList, LocateFixed, BadgeCheck } from 'lucide-react';
import { clearTokens } from '@/lib/api';
import { useTheme } from './ThemeProvider';

type SidebarProps = {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onMobileClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { theme } = useTheme();
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
    `flex items-center p-2 text-base font-normal rounded-lg transition-all duration-200 text-slate-900 dark:text-white hover:bg-slate-100/50 dark:hover:bg-white/10 ${isActive ? 'bg-slate-100/50 dark:bg-white/10 border-l-4 border-slate-900 dark:border-white' : ''}`;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity md:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <div
        className={`group/sidebar fixed md:static inset-y-0 left-0 z-40 flex flex-col bg-transparent shadow-md transition-all duration-300 transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img src="/logo2.png" alt="Chariot" className="h-12 w-auto object-contain" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">Chariot</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all duration-200 text-slate-900 dark:text-white hidden md:inline-flex"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-md hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all duration-200 text-slate-900 dark:text-white md:hidden"
            aria-label="Fechar menu"
          >
            <ChevronLeft />
          </button>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {isAdmin ? (
            <>
              <NavLink to="/dashboard" className={navLinkClasses} onClick={onMobileClose}>
                <Home className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">Dashboard</span>}
              </NavLink>
              <NavLink to="/map" className={navLinkClasses} onClick={onMobileClose}>
                <Map className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">Map</span>}
              </NavLink>
              <NavLink to="/fleet" className={navLinkClasses} onClick={onMobileClose}>
                <Truck className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">Frota</span>}
              </NavLink>
              <NavLink to="/garages" className={navLinkClasses} onClick={onMobileClose}>
                <Building2 className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">Garagens</span>}
              </NavLink>
              <NavLink to="/users" className={navLinkClasses} onClick={onMobileClose}>
                <Users className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">Usuarios</span>}
              </NavLink>
              <NavLink to="/drivers" className={navLinkClasses} onClick={onMobileClose}>
                <BadgeCheck className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">Motoristas</span>}
              </NavLink>
              <NavLink to="/orders" className={navLinkClasses} onClick={onMobileClose}>
                <ClipboardList className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">Ordens</span>}
              </NavLink>
              <NavLink to="/service-board" className={navLinkClasses} onClick={onMobileClose}>
                <ClipboardList className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">Agenda O.S.</span>}
              </NavLink>
              <NavLink to="/coverage" className={navLinkClasses} onClick={onMobileClose}>
                <LocateFixed className="w-6 h-6" />
                {!isCollapsed && <span className="ml-3">Cobertura</span>}
              </NavLink>
            </>
          ) : isDriver ? (
            <NavLink to="/my-orders" className={navLinkClasses} onClick={onMobileClose}>
              <ClipboardList className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Minhas ordens</span>}
            </NavLink>
          ) : null}
        </nav>
        <div className="p-4 mt-auto space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center p-2 text-base font-normal text-slate-900 dark:text-white rounded-lg w-full hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all duration-200"
          >
            <LogOut className="w-6 h-6" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
