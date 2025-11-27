import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import LoginPage from '@/features/auth/LoginPage';
import PrivateRoute from '@/router/PrivateRoute';
import FleetPage from './pages/FleetPage';
import MapPage from './pages/MapPage';

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
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
