import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

export default function JobHistoryPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'jobs'), where('clientId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => { setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return unsub;
  }, [user]);

  const statusColor = (s) => s === 'approved' ? 'bg-green-100 text-green-800' : s === 'pending' ? 'bg-yellow-100 text-yellow-800' : s === 'priced' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600';
  const fmtDate = (ts) => ts?.toDate ? ts.toDate().toLocaleDateString('en-AU', { day:'2-digit', month:'short', year:'numeric' }) : ts || '—';

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1a3a5c]">Job History</h2>
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> :
       jobs.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm"><div className="text-5xl mb-3">📋</div><p className="text-gray-500">No jobs submitted yet.</p></div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-[#1a3a5c]">{job.appType} — {job.appSubType || 'General'}</p>
                  <p className="text-sm text-gray-500 mt-0.5">📅 {job.preferredDate || '—'} &nbsp; 🏡 {job.farmAddress || '—'}</p>
                  <p className="text-sm text-gray-500">🌾 {job.totalHa || 0} ha &nbsp; 💧 {job.waterRate || '—'} L/ha</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColor(job.status)}`}>{job.status || 'pending'}</span>
              </div>
              {job.notes && <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 mb-2"><span className="font-semibold">Notes:</span> {job.notes}</div>}
              {job.submittedBy === 'agronomist' && <span className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">Submitted by Agronomist</span>}
              <div className="text-xs text-gray-400 mt-1">Submitted {fmtDate(job.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
