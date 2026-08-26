import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Goals from './pages/Goals';
import AI from './pages/AI';
import Adaptive from './pages/Adaptive';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

import './styles.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route
            path="/login"
            element={<AuthPage />}
          />

          <Route
            path="/register"
            element={<AuthPage />}
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<Dashboard />}
            />

            <Route
              path="workouts"
              element={<Workouts />}
            />

            <Route
              path="goals"
              element={<Goals />}
            />

            <Route
              path="ai"
              element={<AI />}
            />

            <Route
              path="adaptive"
              element={<Adaptive />}
            />

            <Route
              path="profile"
              element={<Profile />}
            />

            <Route
              path="admin"
              element={<Admin />}
            />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}