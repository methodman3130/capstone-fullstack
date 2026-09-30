import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge } from './ui';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  function handleLogout() {
    logout();
    toast.info('Signed out');
    navigate('/login');
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm text-white">
            C2
          </span>
          <span className="hidden sm:inline">E-Commerce</span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Products
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/products/new" className={linkClass}>
              Add Product
            </NavLink>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              {isAdmin && <Badge tone="brand">admin</Badge>}
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
