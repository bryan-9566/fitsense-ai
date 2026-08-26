import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          Fit<span>Sense</span> AI
        </div>

        <p className="muted">
          Personal performance OS
        </p>

        <nav>
          <NavLink to="/dashboard">
            Dashboard
          </NavLink>

          <NavLink to="/workouts">
            Workouts
          </NavLink>

          <NavLink to="/goals">
            Goals
          </NavLink>

          <NavLink to="/ai">
            AI Coach
          </NavLink>

          <NavLink to="/adaptive">
            Adaptive Training
          </NavLink>

          <NavLink to="/profile">
            Profile
          </NavLink>

          {user?.role === 'ADMIN' && (
            <NavLink to="/admin">
              Admin
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {(user?.name || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name || 'User'}
              </strong>

              <span>
                {user?.role || 'USER'}
              </span>
            </div>
          </div>

          <button
            className="ghost-btn logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}