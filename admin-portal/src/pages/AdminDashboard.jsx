import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function AdminDashboard() {
  const { adminData, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user || !adminData) navigate('/login');
  }, [user, adminData, navigate]);
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Aerotech Admin</h1>
        <span className="text-sm text-gray-600">{user?.email}</span>
      </div></header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8"><h2 className="text-xl font-semibold text-gray-800">Welcome back, {adminData?.email}</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6"><p className="text-sm font-medium text-gray-500">Clients</p><p className="text-3xl font-bold text-gray-900 mt-1">—</p><button onClick={() => navigate('/clients')} className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">Manage →</button></div>
          <div className="bg-white rounded-xl shadow p-6"><p className="text-sm font-medium text-gray-500">Pending Jobs</p><p className="text-3xl font-bold text-gray-900 mt-1">—</p><button onClick={() => navigate('/jobs-approval')} className="mt-4 text-sm text-yellow-600 hover:text-yellow-800 font-medium">Review →</button></div>
          <div className="bg-white rounded-xl shadow p-6"><p className="text-sm font-medium text-gray-500">Approved Jobs</p><p className="text-3xl font-bold text-gray-900 mt-1">—</p><button onClick={() => navigate('/jobs-approval')} className="mt-4 text-sm text-green-600 hover:text-green-800 font-medium">View →</button></div>
        </div>
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => navigate('/clients')} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"><span className="text-2xl">👥</span><div><p className="font-medium">Manage Clients</p><p className="text-xs text-gray-500">View and edit accounts</p></div></button>
            <button onClick={() => navigate('/csv-import')} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"><span className="text-2xl">📊</span><div><p className="font-medium">CSV Import</p><p className="text-xs text-gray-500">Bulk import data</p></div></button>
            <button onClick={() => navigate('/jobs-approval')} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"><span className="text-2xl">📋</span><div><p className="font-medium">Job Approvals</p><p className="text-xs text-gray-500">Review submissions</p></div></button>
          </div>
        </div>
      </main>
    </div>
  );
}
