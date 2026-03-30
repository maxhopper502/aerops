import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, clientData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${isActive ? 'bg-[#e67e22] text-white' : 'text-white hover:bg-white/20'}`;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#1a3a5c] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Aerotech Australasia</h1>
            <p className="text-blue-200 text-xs">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-200 hidden sm:block">{clientData?.name || 'Client'}</span>
            <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
          <NavLink to="/" className={navClass}>Dashboard</NavLink>
          <NavLink to="/profile" className={navClass}>My Profile</NavLink>
          <NavLink to="/new-job" className={navClass}>New Job</NavLink>
          <NavLink to="/jobs" className={navClass}>Job History</NavLink>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
