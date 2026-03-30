import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

const SPRAY_TYPES = ['General Spraying', 'Herbicide', 'Fungicide', 'Insecticide', 'Misting'];
const SPREAD_TYPES = ['Urea', 'Fertiliser', 'Snail Bait', 'Mouse Bait', 'Seed'];

export default function NewJobPage() {
  const { user, clientData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [appType, setAppType] = useState('Spray');
  const [subType, setSubType] = useState('');
  const [job, setJob] = useState({ preferredDate: '', waterRate: '30', notes: '', products: '', chemDelivery: 'Client', hazards: {} });

  useEffect(() => {
    if (!clientData) return;
    setJob(j => ({ ...j, farmAddress: clientData.farmAddress || '', airstrip: clientData.airstrip || '', region: clientData.region || '', paddocks: clientData.paddocks || [] }));
  }, [clientData]);

  const set = (k, v) => setJob(j => ({ ...j, [k]: v }));
  const totalHa = (job.paddocks || []).reduce((s, p) => s + (parseFloat(p.ha) || 0), 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'jobs'), {
        clientId: user.uid, clientName: clientData?.name || user.email,
        email: clientData?.email || user.email, phone: clientData?.phone || '',
        farmAddress: job.farmAddress, airstrip: job.airstrip, region: job.region,
        appType, appSubType: subType, waterRate: job.waterRate, preferredDate: job.preferredDate,
        paddocks: job.paddocks.filter(p => p.name || p.ha), totalHa,
        products: job.products, hazards: job.hazards || {}, notes: job.notes, chemDelivery: job.chemDelivery,
        status: 'pending', submittedBy: 'client', createdAt: serverTimestamp()
      });
      setDone(true);
    } catch (err) { alert('Error: ' + err.message); }
    setSubmitting(false);
  };

  if (done) return (
    <div className="bg-white rounded-2xl p-10 text-center shadow-lg max-w-md mx-auto">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-green-600 mb-2">Job Submitted!</h2>
      <p className="text-gray-600 mb-6">Your job request has been received. Aerotech will be in contact shortly.</p>
      <button onClick={() => navigate('/')} className="bg-[#1a3a5c] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900">Back to Dashboard</button>
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[#1a3a5c]">New Job Request</h2>
      <div className="flex gap-1"><div className={`h-1.5 flex-1 rounded-full ${step>=1?'bg-[#e67e22]':'bg-gray-200'}`}/><div className={`h-1.5 flex-1 rounded-full ${step>=2?'bg-[#e67e22]':'bg-gray-200'}`}/><div className={`h-1.5 flex-1 rounded-full ${step>=3?'bg-[#e67e22]':'bg-gray-200'}`}/></div>
      <p className="text-sm text-gray-500">Step {step} of 3</p>

      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Application Date</label>
            <input type="date" value={job.preferredDate} onChange={e => set('preferredDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Application Type</label>
            <div className="flex gap-3">
              {['Spray','Spread'].map(t => (
                <button key={t} type="button" onClick={() => { setAppType(t); setSubType(''); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-colors ${appType===t?'bg-[#1a3a5c] text-white border-[#1a3a5c]':'bg-white text-gray-600 border-gray-200 hover:border-[#1a3a5c]'}`}>
                  {t==='Spray'?'💧 Spraying':'🌾 Spreading'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{appType} Type</label>
            <div className="flex flex-wrap gap-2">
              {(appType==='Spray'?SPRAY_TYPES:SPREAD_TYPES).map(t => (
                <button key={t} type="button" onClick={() => setSubType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${subType===t?'bg-[#1a3a5c] text-white border-[#1a3a5c]':'bg-white text-gray-600 border-gray-200 hover:border-[#1a3a5c]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Water Rate (L/ha)</label>
            <input type="number" value={job.waterRate} onChange={e => set('waterRate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]" />
          </div>
          <button onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
            className="w-full bg-[#e67e22] hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          {(job.paddocks||[]).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">Paddocks (from profile)</label>
                <span className="text-sm font-semibold text-[#1a3a5c]">{totalHa.toFixed(2)} ha total</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{job.paddocks.map(p => `${p.name} (${p.ha}ha)`).join(', ')}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Products / Chemicals</label>
            <textarea value={job.products} onChange={e => set('products', e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"
              placeholder="Product name, rate per ha, total quantity..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Hazards</label>
            <textarea value={job.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Chem Delivery</label>
            <div className="flex gap-2">
              {['Client','Agent','Other'].map(d => (
                <button key={d} type="button" onClick={() => set('chemDelivery', d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${job.chemDelivery===d?'bg-[#1a3a5c] text-white border-[#1a3a5c]':'bg-white text-gray-600 border-gray-200'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors">← Back</button>
            <button onClick={() => setStep(3)} className="flex-1 bg-[#e67e22] hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">Review →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-[#1a3a5c]">Review Job Request</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Date',job.preferredDate||'—'],['App Type',`${appType}${subType?' — '+subType:''}`],['Water Rate',job.waterRate+' L/ha'],['Total Ha',totalHa.toFixed(2)+' ha'],['Farm',job.farmAddress||'—'],['Airstrip',job.airstrip||'—'],['Chem Delivery',job.chemDelivery]].map(([label,value])=>(
              <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="font-semibold text-gray-900">{value}</div>
              </div>
            ))}
          </div>
          {job.notes && <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm"><span className="font-semibold text-yellow-800">Notes:</span> <span className="text-yellow-800">{job.notes}</span></div>}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors">← Back</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 bg-[#16a34a] hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors">
              {submitting ? 'Submitting...' : 'Submit Job ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
