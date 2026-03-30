import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const REGIONS = ['Eyre Peninsula', 'Yorke Peninsula', 'Mid North', 'South East', 'Kangaroo Island', 'Other'];
const AIRSTRIPS = ['Cummins', "Trelour's", "Smithy's", 'Karkoo', 'Heymans', "Rob Mac's", "Fitzy's", 'Modras', 'Other'];

export default function ClientEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [form, setForm] = useState({});
  const [agronomists, setAgronomists] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  const loading = !client;

  useEffect(() => {
    async function load() {
      const [cSnap, agronSnap] = await Promise.all([
        getDoc(doc(db, 'clients', id)),
        getDocs(collection(db, 'agronomists'))
      ]);
      if (cSnap.exists()) { setClient({ id: cSnap.id, ...cSnap.data() }); setForm(cSnap.data()); }
      setAgronomists(agronSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    load();
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateDoc(doc(db, 'clients', id), { ...form, updatedAt: serverTimestamp() });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const addPaddock = () => set('paddocks', [...(form.paddocks || []), { name: '', ha: '', cropType: '' }]);
  const rmPaddock = (i) => set('paddocks', form.paddocks.filter((_, idx) => idx !== i));
  const updPaddock = (i, k, v) => { const ps = [...form.paddocks]; ps[i] = { ...ps[i], [k]: v }; set('paddocks', ps); };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const tabs = [{ id: 'contact', label: 'Contact & Farm' }, { id: 'billing', label: 'Billing' }, { id: 'paddocks', label: 'Paddocks' }, { id: 'links', label: 'Agronomist Link' }];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="text-gray-500 hover:text-gray-700 font-bold text-lg">←</button>
        <h2 className="text-xl font-bold text-[#1a3a5c]">Edit Client</h2>
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === t.id ? 'bg-[#1a3a5c] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm overflow-hidden">
        {activeTab === 'contact' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold mb-1">Contact Name</label><input value={form.name||''} onChange={e=>set('name',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"/></div>
              <div><label className="block text-sm font-semibold mb-1">Email</label><input value={form.email||''} onChange={e=>set('email',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"/></div>
              <div><label className="block text-sm font-semibold mb-1">Phone</label><input value={form.phone||''} onChange={e=>set('phone',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"/></div>
              <div><label className="block text-sm font-semibold mb-1">Region</label>
                <select value={form.region||''} onChange={e=>set('region',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm bg-white">
                  <option value="">— Select —</option>{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div><label className="block text-sm font-semibold mb-1">Farm Name</label><input value={form.farmName||''} onChange={e=>set('farmName',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"/></div>
            <div><label className="block text-sm font-semibold mb-1">Farm Address</label><input value={form.farmAddress||''} onChange={e=>set('farmAddress',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"/></div>
            <div><label className="block text-sm font-semibold mb-1">Nearest Airstrip</label>
              <select value={form.airstrip||''} onChange={e=>set('airstrip',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm bg-white">
                <option value="">— Select —</option>{AIRSTRIPS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="p-5 space-y-4">
            <div><label className="block text-sm font-semibold mb-1">Billing Name</label><input value={form.billingName||''} onChange={e=>set('billingName',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"/></div>
            <div><label className="block text-sm font-semibold mb-1">Billing Address</label><input value={form.billingAddress||''} onChange={e=>set('billingAddress',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"/></div>
            <div><label className="block text-sm font-semibold mb-1">ABN</label><input value={form.ABN||''} onChange={e=>set('ABN',e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm"/></div>
          </div>
        )}

        {activeTab === 'paddocks' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold">Paddocks</label>
              <button type="button" onClick={addPaddock} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100">+ Add</button>
            </div>
            {(form.paddocks||[]).length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50"><th className="px-3 py-2 text-left text-xs font-semibold">Name</th><th className="px-3 py-2 text-left text-xs font-semibold">Ha</th><th className="px-3 py-2 text-left text-xs font-semibold">Crop</th><th className="w-8"></th></tr></thead>
                <tbody>
                  {form.paddocks.map((p,i)=>(
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2"><input value={p.name} onChange={e=>updPaddock(i,'name',e.target.value)} className="w-full px-2 py-1 border rounded text-sm"/></td>
                      <td className="px-3 py-2"><input value={p.ha} onChange={e=>updPaddock(i,'ha',e.target.value)} type="number" step="0.01" className="w-full px-2 py-1 border rounded text-sm"/></td>
                      <td className="px-3 py-2"><input value={p.cropType} onChange={e=>updPaddock(i,'cropType',e.target.value)} className="w-full px-2 py-1 border rounded text-sm"/></td>
                      <td><button type="button" onClick={()=>rmPaddock(i)} className="text-red-500 font-bold text-lg">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-gray-400 text-sm">No paddocks.</p>}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Linked Agronomist</label>
              <select value={form.agronomistId||''} onChange={e=>set('agronomistId',e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm bg-white">
                <option value="">— No agronomist linked —</option>
                {agronomists.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email}) — {a.company}</option>)}
              </select>
            </div>
            {form.agronomistId && agronomists.find(a => a.id === form.agronomistId) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
                <div className="font-bold text-green-800">{(agronomists.find(a => a.id === form.agronomistId)).name}</div>
                <div className="text-green-700">{(agronomists.find(a => a.id === form.agronomistId)).email}</div>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-4 border-t bg-gray-50 flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="bg-[#e67e22] hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold px-6 py-3 rounded-xl">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-green-600 font-semibold text-sm">✓ Saved!</span>}
        </div>
      </form>
    </div>
  );
}
