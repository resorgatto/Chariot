import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import LoginPage from '@/features/auth/LoginPage';
import PrivateRoute from '@/router/PrivateRoute';
import FleetPage from './pages/FleetPage';
import MapPage from './pages/MapPage';
import GaragesPage from './pages/GaragesPage';
import UsersPage from './pages/UsersPage';
import DriversPage from './pages/DriversPage';
import DeliveryOrdersPage from './pages/DeliveryOrdersPage';
import CoverageCheckPage from './pages/CoverageCheckPage';
import DriverOrdersPage from './pages/DriverOrdersPage';
import ServiceBoardPage from './pages/ServiceBoardPage';

function App() {
  const readRole = () => ({
    isAdmin:
      localStorage.getItem("is_staff") === "true" ||
      localStorage.getItem("is_superuser") === "true",
    isDriver: localStorage.getItem("is_driver") === "true",
  });

  const [{ isAdmin, isDriver }, setRole] = useState(readRole);

  useEffect(() => {
    const handler = () => setRole(readRole());
    window.addEventListener("storage", handler);
    window.addEventListener("auth-changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("auth-changed", handler);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute />}>
          {isAdmin ? (
            <>
              <Route
                path="dashboard"
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                }
              />
              <Route
                path="fleet"
                element={
                  <Layout>
                    <FleetPage />
                  </Layout>
                }
              />
              <Route
                path="map"
                element={
                  <Layout>
                    <MapPage />
                  </Layout>
                }
              />
              <Route
                path="garages"
                element={
                  <Layout>
                    <GaragesPage />
                  </Layout>
                }
              />
              <Route
                path="users"
                element={
                  <Layout>
                    <UsersPage />
                  </Layout>
                }
              />
              <Route
                path="drivers"
                element={
                  <Layout>
                    <DriversPage />
                  </Layout>
                }
              />
              <Route
                path="orders"
                element={
                  <Layout>
                    <DeliveryOrdersPage />
                  </Layout>
                }
              />
              <Route
                path="coverage"
                element={
                  <Layout>
                    <CoverageCheckPage />
                  </Layout>
                }
              />
              <Route
                path="service-board"
                element={
                  <Layout>
                    <ServiceBoardPage />
                  </Layout>
                }
              />
              <Route path="my-orders" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="*"
                element={<Navigate to="/dashboard" replace />}
              />
            </>
          ) : isDriver ? (
            <>
              <Route
                path="my-orders"
                element={
                  <Layout>
                    <DriverOrdersPage />
                  </Layout>
                }
              />
              <Route path="dashboard" element={<Navigate to="/my-orders" replace />} />
              <Route path="/" element={<Navigate to="/my-orders" replace />} />
              <Route path="*" element={<Navigate to="/my-orders" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
