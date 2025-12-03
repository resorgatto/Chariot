import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Map, Truck, LogOut, Building2, Users, ClipboardList, LocateFixed, BadgeCheck } from 'lucide-react';
import { clearTokens } from '@/lib/api';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("is_staff") === "true" || localStorage.getItem("is_superuser") === "true";
  const isDriver = localStorage.getItem("is_driver") === "true";

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition-all duration-200 hover:bg-slate-100 ${isActive ? 'bg-slate-100 border-l-4 border-slate-900' : ''}`;

  return (
    <div className={`flex flex-col bg-white shadow-md transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img src="/chariot-logo.png" alt="Chariot" className="h-12 w-auto bg-white rounded-lg shadow-sm p-1.5" />
            <span className="text-xl font-bold text-slate-900">Chariot</span>
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-md hover:bg-slate-100 transition-all duration-200">
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-2">
        {isAdmin ? (
          <>
            <NavLink to="/dashboard" className={navLinkClasses}>
              <Home className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </NavLink>
            <NavLink to="/map" className={navLinkClasses}>
              <Map className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Map</span>}
            </NavLink>
            <NavLink to="/fleet" className={navLinkClasses}>
              <Truck className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Frota</span>}
            </NavLink>
            <NavLink to="/garages" className={navLinkClasses}>
              <Building2 className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Garagens</span>}
            </NavLink>
            <NavLink to="/users" className={navLinkClasses}>
              <Users className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Usuarios</span>}
            </NavLink>
            <NavLink to="/drivers" className={navLinkClasses}>
              <BadgeCheck className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Motoristas</span>}
            </NavLink>
            <NavLink to="/orders" className={navLinkClasses}>
              <ClipboardList className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Ordens</span>}
            </NavLink>
            <NavLink to="/service-board" className={navLinkClasses}>
              <ClipboardList className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Agenda O.S.</span>}
            </NavLink>
            <NavLink to="/coverage" className={navLinkClasses}>
              <LocateFixed className="w-6 h-6" />
              {!isCollapsed && <span className="ml-3">Cobertura</span>}
            </NavLink>
          </>
        ) : isDriver ? (
          <NavLink to="/my-orders" className={navLinkClasses}>
            <ClipboardList className="w-6 h-6" />
            {!isCollapsed && <span className="ml-3">Minhas ordens</span>}
          </NavLink>
        ) : null}
      </nav>
      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg w-full hover:bg-slate-100 transition-all duration-200"
        >
          <LogOut className="w-6 h-6" />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
