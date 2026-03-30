import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';

export default function LinkedClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'clients'), where('agronomistId', '==', user.uid));
    const unsub = onSnapshot(q, snap => { setClients(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return unsub;
  }, [user]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1a3a5c]">My Linked Clients ({clients.length})</h2>
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : clients.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <p>No clients linked yet.</p>
          <p className="text-sm mt-1">Ask your admin to link clients to your account.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-[#1a3a5c]">{c.name || '—'}</p>
                  <p className="text-sm text-gray-500">{c.email || '—'}</p>
                  <p className="text-sm text-gray-500">{c.farmName || c.farmAddress || '—'}</p>
                  <p className="text-sm text-gray-500">{(c.paddocks || []).length} paddocks • {c.region || '—'}</p>
                </div>
                <Link to={`/submit-job?clientId=${c.id}`}
                  className="bg-[#e67e22] hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap">
                  + New Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
