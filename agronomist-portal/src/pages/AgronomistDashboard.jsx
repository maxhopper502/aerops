import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';

export default function AgronomistDashboard() {
  const { user, agronomistData } = useAuth();
  const [clients, setClients] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'clients'), where('agronomistId', '==', user.uid));
    const unsub = onSnapshot(q, snap => setClients(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const q2 = query(collection(db, 'jobs'), where('agronomistId', '==', user.uid));
    const unsub2 = onSnapshot(q2, snap => setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub(); unsub2(); };
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-[#1a3a5c] rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Welcome, {agronomistData?.name || 'Agronomist'} 🧑‍🌾</h2>
        <p className="text-blue-200 text-sm mt-1">{agronomistData?.company || ''} • {clients.length} clients linked</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Linked Clients', value: clients.length, icon: '👥' },
          { label: 'Jobs Submitted', value: jobs.length, icon: '📋' },
          { label: 'Pending', value: jobs.filter(j => j.status === 'pending').length, icon: '⏳' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-[#1a3a5c]">{value}</div>
            <div className="text-xs text-gray-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/clients" className="bg-white hover:shadow-md rounded-xl p-5 border transition-shadow">
          <div className="text-2xl mb-2">👥</div>
          <div className="font-bold text-[#1a3a5c]">My Clients</div>
          <div className="text-sm text-gray-500 mt-1">View and manage linked clients</div>
        </Link>
        <Link to="/submit-job" className="bg-[#e67e22] hover:bg-orange-600 rounded-xl p-5 text-white transition-colors">
          <div className="text-2xl mb-2">✈️</div>
          <div className="font-bold">Submit Job for Client</div>
          <div className="text-sm text-orange-100 mt-1">Create a job on behalf of a client</div>
        </Link>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-3 border-b font-bold text-[#1a3a5c]">Recent Jobs</div>
        {jobs.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No jobs submitted yet.</div>
        ) : (
          <div className="divide-y">
            {jobs.slice(0, 5).map(j => (
              <div key={j.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{j.clientName || '—'} — {j.appType}</p>
                  <p className="text-xs text-gray-500">{j.preferredDate} • {j.totalHa || 0} ha</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${j.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{j.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
