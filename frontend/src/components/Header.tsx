import React from 'react';
import { Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md">
      <div className="flex items-center gap-3">
        <img src="/chariot-logo.png" alt="Chariot" className="h-12 w-auto bg-white rounded-lg shadow-sm p-1.5" />
        <div>
          <p className="text-sm text-muted-foreground">Plataforma</p>
          <p className="text-base font-semibold text-slate-900">Chariot</p>
        </div>
      </div>
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
