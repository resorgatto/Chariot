import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute: React.FC = () => {
  const hasAccessToken = Boolean(localStorage.getItem('access_token'));
  const isAuthenticated = hasAccessToken || localStorage.getItem('auth') === 'true';

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
