import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function JobsApprovalPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => { setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return unsub;
  }, []);

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'jobs', id), { status });
  };

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);
  const statusColor = (s) => {
    if (s === 'approved') return 'bg-green-100 text-green-800';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'priced') return 'bg-blue-100 text-blue-800';
    if (s === 'completed') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-600';
  };
  const formatDate = (ts) => ts?.toDate ? ts.toDate().toLocaleDateString('en-AU') : ts || '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1a3a5c]">Job Requests ({jobs.length})</h2>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'priced', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-[#1a3a5c] text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-400">No jobs found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-[#1a3a5c]">{job.clientName || 'Unknown Client'}</p>
                  <p className="text-sm text-gray-500">{job.farmAddress || '—'} • {job.airstrip || '—'}</p>
                  <p className="text-sm text-gray-500">📅 {job.preferredDate || '—'} • 🌾 {job.totalHa || 0} ha • 💧 {job.waterRate || '—'} L/ha</p>
                  <p className="text-sm font-semibold">{job.appType}{job.appSubType ? ` — ${job.appSubType}` : ''}</p>
                  {job.products && <p className="text-sm text-gray-600 mt-1">💉 {job.products}</p>}
                  {job.notes && <p className="text-sm text-gray-500 mt-1 italic">📝 {job.notes}</p>}
                  {job.submittedBy === 'agronomist' && <span className="inline-block mt-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">Submitted by Agronomist</span>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColor(job.status)}`}>{job.status || 'pending'}</span>
                  <span className="text-xs text-gray-400">{formatDate(job.createdAt)}</span>
                </div>
              </div>
              {job.status === 'pending' && (
                <div className="flex gap-2 pt-2 border-t">
                  <button onClick={() => updateStatus(job.id, 'approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                    ✅ Approve
                  </button>
                  <button onClick={() => updateStatus(job.id, 'rejected')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                    ❌ Reject
                  </button>
                </div>
              )}
              {!['pending'].includes(job.status) && (
                <div className="flex gap-2 pt-2 border-t">
                  {job.status === 'approved' && (
                    <button onClick={() => updateStatus(job.id, 'priced')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                      Mark as Priced
                    </button>
                  )}
                  <button onClick={() => updateStatus(job.id, 'completed')}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
