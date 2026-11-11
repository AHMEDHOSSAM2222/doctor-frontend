import { useEffect } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api, CLINIC_NAME, getToken, setToken } from '../../api.js';

function FolderMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M3 9a3 3 0 0 1 3-3h7l3 3h10a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="#12584f" />
      <path d="M14.5 13h3v3h3v3h-3v3h-3v-3h-3v-3h3z" fill="#fff" />
    </svg>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasToken = Boolean(getToken());

  // Check the saved session is still valid; a 401 fires "admin:logout".
  useEffect(() => {
    if (hasToken) api.me().catch(() => {});
  }, [hasToken]);

  useEffect(() => {
    const onLogout = () => navigate('/admin/login', { replace: true, state: { from: location.pathname } });
    window.addEventListener('admin:logout', onLogout);
    return () => window.removeEventListener('admin:logout', onLogout);
  }, [navigate, location.pathname]);

  if (!hasToken) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  const logout = () => {
    setToken(null);
    navigate('/admin/login', { replace: true });
  };

  const filesActive = location.pathname === '/admin' || location.pathname.startsWith('/admin/patients');

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <Link to="/admin" className="admin-brand">
            <FolderMark />
            {CLINIC_NAME}
          </Link>
          <nav className="admin-nav" aria-label="Main">
            <NavLink to="/admin" className={filesActive ? 'active' : undefined} end>
              Patient files
            </NavLink>
            <NavLink to="/admin/qr">QR code</NavLink>
            <NavLink to="/admin/account">Account</NavLink>
          </nav>
          <button type="button" className="btn-link" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
