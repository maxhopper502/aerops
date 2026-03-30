import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

const SPRAY_TYPES = ['General Spraying', 'Herbicide', 'Fungicide', 'Insecticide', 'Misting'];
const SPREAD_TYPES = ['Urea', 'Fertiliser', 'Snail Bait', 'Mouse Bait', 'Seed'];

export default function SubmitJobPage() {
  const { user, agronomistData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('clientId');

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [step, setStep] = useState(preselectedId ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [job, setJob] = useState({
    preferredDate: '', appType: 'Spray', appSubType: '', waterRate: '30',
    notes: '', products: '', chemDelivery: 'Client', hazards: {},
    paddocks: [], totalHa: 0
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'clients'), where('agronomistId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      const cs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClients(cs);
      if (preselectedId) {
        const pc = cs.find(c => c.id === preselectedId);
        if (pc) { setSelectedClient(pc); setJob(j => ({ ...j, paddocks: pc.paddocks || [] })); }
      }
    });
    return unsub;
  }, [user, preselectedId]);

  const set = (k, v) => setJob(j => ({ ...j, [k]: v }));
  const totalHa = (job.paddocks || []).reduce((s, p) => s + (parseFloat(p.ha) || 0), 0);

  const handleSubmit = async () => {
    if (!selectedClient || !job.preferredDate) return alert('Please fill in required fields.');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'jobs'), {
        clientId: selectedClient.id,
        clientName: selectedClient.name || '',
        email: selectedClient.email || '',
        phone: selectedClient.phone || '',
        farmAddress: selectedClient.farmAddress || '',
        airstrip: selectedClient.airstrip || '',
        region: selectedClient.region || '',
        paddocks: job.paddocks.filter(p => p.name || p.ha),
        totalHa,
        appType: job.appType,
        appSubType: job.appSubType,
        waterRate: job.waterRate,
        preferredDate: job.preferredDate,
        products: job.products,
        notes: job.notes,
        chemDelivery: job.chemDelivery,
        hazards: job.hazards,
        status: 'pending',
        submittedBy: 'agronomist',
        agronomistId: user.uid,
        agronomistName: agronomistData?.name || '',
        createdAt: serverTimestamp()
      });
      setDone(true);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="bg-white rounded-2xl p-10 text-center shadow-lg max-w-md mx-auto">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-green-600 mb-2">Job Submitted!</h2>
      <p className="text-gray-600 mb-6">Job request submitted for {selectedClient?.name}.</p>
      <button onClick={() => navigate('/')} className="bg-[#1a3a5c] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900">Back to Dashboard</button>
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[#1a3a5c]">Submit Job for Client</h2>

      {/* Step 1: Select Client */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-gray-700">Select a Client</h3>
          {clients.length === 0 ? (
            <div className="text-center py-6 text-gray-400">No linked clients. Ask admin to link clients first.</div>
          ) : (
            <div className="space-y-2">
              {clients.map(c => (
                <button key={c.id} onClick={() => { setSelectedClient(c); setJob(j => ({ ...j, paddocks: c.paddocks || [] })); setStep(2); }}
                  className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-400 rounded-xl p-4 transition-colors">
                  <div className="font-bold text-[#1a3a5c]">{c.name || '—'}</div>
                  <div className="text-sm text-gray-500">{c.farmName || c.farmAddress || '—'}</div>
                  <div className="text-sm text-gray-400">{c.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Job Details */}
      {step === 2 && selectedClient && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
            <span className="font-bold text-blue-800">Client: </span>
            <span className="text-blue-900">{selectedClient.name} — {selectedClient.farmAddress || selectedClient.farmName}</span>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Preferred Date *</label>
              <input type="date" value={job.preferredDate} onChange={e => set('preferredDate', e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Application Type</label>
              <div className="flex gap-3">
                {['Spray', 'Spread'].map(t => (
                  <button key={t} type="button" onClick={() => set('appType', t)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 ${job.appType === t ? 'bg-[#1a3a5c] text-white border-[#1a3a5c]' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {t === 'Spray' ? '💧 Spraying' : '🌾 Spreading'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{job.appType} Type</label>
              <div className="flex flex-wrap gap-2">
                {(job.appType === 'Spray' ? SPRAY_TYPES : SPREAD_TYPES).map(t => (
                  <button key={t} type="button" onClick={() => set('appSubType', t)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 ${job.appSubType === t ? 'bg-[#1a3a5c] text-white border-[#1a3a5c]' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Water Rate (L/ha)</label>
              <input type="number" value={job.waterRate} onChange={e => set('waterRate', e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]" />
            </div>

            {/* Paddocks from profile */}
            {(job.paddocks || []).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold">Paddocks (from client profile)</label>
                  <span className="text-sm font-semibold text-[#1a3a5c]">{totalHa.toFixed(2)} ha</span>
                </div>
                <div className="text-sm text-gray-500 mb-2">{job.paddocks.map(p => `${p.name} (${p.ha}ha)`).join(', ')}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1">Products / Chemicals</label>
              <textarea value={job.products} onChange={e => set('products', e.target.value)} rows={2}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"
                placeholder="Product name, rate per ha, total quantity..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Notes / Hazards</label>
              <textarea value={job.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl">← Change Client</button>
              <button onClick={handleSubmit} disabled={submitting || !job.preferredDate}
                className="flex-1 bg-[#16a34a] hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl">
                {submitting ? 'Submitting...' : 'Submit Job ✓'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
