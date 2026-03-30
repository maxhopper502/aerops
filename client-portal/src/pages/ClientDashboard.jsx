import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

export default function ClientDashboard() {
  const { user, clientData } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'jobs'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const totalHa = jobs.reduce((s, j) => s + (j.totalHa || 0), 0);
  const pending = jobs.filter(j => j.status === 'pending').length;

  const statusColor = (s) => {
    if (s === 'approved') return 'bg-green-100 text-green-800';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'priced') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-[#1a3a5c] rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Welcome back, {clientData?.name || 'Client'} 👋</h2>
        <p className="text-blue-200 mt-1 text-sm">{clientData?.farmName || clientData?.farmAddress || 'Farm not set'}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Jobs', value: jobs.length, icon: '📋' },
          { label: 'Pending', value: pending, icon: pending > 0 ? '⏳' : '✅' },
          { label: 'Total Ha', value: totalHa.toFixed(0), icon: '🌾' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-[#1a3a5c]">{value}</div>
            <div className="text-xs text-gray-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/new-job" className="bg-[#e67e22] hover:bg-orange-600 text-white rounded-xl p-5 font-bold text-center transition-colors shadow-md">
          ✈️ New Job Request
        </Link>
        <Link to="/profile" className="bg-white hover:bg-gray-50 text-[#1a3a5c] border-2 border-[#1a3a5c] rounded-xl p-5 font-bold text-center transition-colors">
          ⚙️ Edit Profile
        </Link>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-[#1a3a5c]">Recent Jobs</h3>
          <Link to="/jobs" className="text-sm text-[#e67e22] font-semibold hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>No jobs submitted yet.</p>
            <Link to="/new-job" className="text-[#e67e22] font-semibold text-sm hover:underline mt-1 inline-block">Submit your first job →</Link>
          </div>
        ) : (
          <div className="divide-y">
            {jobs.slice(0, 5).map(job => (
              <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{job.appType} — {job.appSubType || 'General'}</p>
                  <p className="text-xs text-gray-500">{job.preferredDate} • {job.totalHa || '?'} ha</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
