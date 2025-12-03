import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute />}>
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
          <Route
            path="my-orders"
            element={
              <Layout>
                <DriverOrdersPage />
              </Layout>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
