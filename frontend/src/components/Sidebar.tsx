import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Map, Truck, LogOut } from 'lucide-react';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition-all duration-200 hover:bg-slate-100 ${isActive ? 'bg-slate-100 border-l-4 border-slate-900' : ''}`;

  return (
    <div className={`flex flex-col bg-white shadow-md transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && <h1 className="text-xl font-bold">EcoFleet</h1>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-md hover:bg-slate-100 transition-all duration-200">
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-2">
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
          {!isCollapsed && <span className="ml-3">Fleet</span>}
        </NavLink>
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