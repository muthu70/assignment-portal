import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-logo">AP</span>
            Assignment Portal
          </Link>

          <nav>
            <NavLink to="/" end>Classes</NavLink>
            {user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          </nav>

          <div className="user">
            <span className="avatar">{initials(user.name)}</span>
            <span>
              {user.name}
              <br />
              <small>{user.role}</small>
            </span>
            <button className="btn small" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <h4>Assignment Portal</h4>
            <p>Online submission, grading and feedback for college courses.</p>
          </div>
          <div>
            <h4>Need help?</h4>
            <p>Contact your college IT desk for account problems.</p>
          </div>
          <div>
            <h4>Roles</h4>
            <p>Admins manage accounts. Teachers grade. Students submit.</p>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Assignment Portal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
