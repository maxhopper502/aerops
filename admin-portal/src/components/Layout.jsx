import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, adminData } = useAuth();
  const navigate = useNavigate();
  const navClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${isActive ? 'bg-[#e67e22] text-white' : 'text-white hover:bg-white/20'}`;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#1a3a5c] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Aerotech Admin</h1>
            <p className="text-blue-200 text-xs">{adminData?.name || user?.email}</p>
          </div>
          <button onClick={async () => { await logout(); navigate('/login'); }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
            Logout
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
          <NavLink to="/" className={navClass}>Dashboard</NavLink>
          <NavLink to="/clients" className={navClass}>Clients</NavLink>
          <NavLink to="/jobs" className={navClass}>Job Requests</NavLink>
          <NavLink to="/import" className={navClass}>CSV Import</NavLink>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
