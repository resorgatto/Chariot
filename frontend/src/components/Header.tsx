import React from 'react';
import { Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-end p-4 bg-white shadow-md">
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-slate-100">
          <Bell className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-2">
          <User className="w-6 h-6" />
          <span>Renato</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
