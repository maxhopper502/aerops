import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

const REGIONS = ['Eyre Peninsula', 'Yorke Peninsula', 'Mid North', 'South East', 'Kangaroo Island', 'Other'];
const AIRSTRIPS = ['Cummins', "Trelour's", "Smithy's", 'Karkoo', 'Heymans', "Rob Mac's", "Fitzy's", 'Modras', 'Other'];

export default function ProfilePage() {
  const { user, clientData, setClientData } = useAuth();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');

  useEffect(() => {
    if (clientData) setForm(clientData);
  }, [clientData]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, 'clients', user.uid), {
        ...form, updatedAt: serverTimestamp()
      });
      setClientData(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addPaddock = () => set('paddocks', [...(form.paddocks || []), { name: '', ha: '', cropType: '' }]);
  const rmPaddock = (i) => set('paddocks', form.paddocks.filter((_, idx) => idx !== i));
  const updPaddock = (i, k, v) => {
    const ps = [...form.paddocks];
    ps[i] = { ...ps[i], [k]: v };
    set('paddocks', ps);
  };

  const tabs = [
    { id: 'contact', label: 'Contact Details' },
    { id: 'farm', label: 'Farm & Paddocks' },
    { id: 'billing', label: 'Billing' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1a3a5c]">My Profile</h2>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === t.id ? 'bg-[#1a3a5c] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Name</label>
                <input value={form.name || ''} onChange={e => set('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input value={form.phone || ''} onChange={e => set('phone', e.target.value)} type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input value={form.email || ''} onChange={e => set('email', e.target.value)} type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
            </div>
          </div>
        )}

        {/* Farm Tab */}
        {activeTab === 'farm' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Farm Name</label>
                <input value={form.farmName || ''} onChange={e => set('farmName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Region</label>
                <select value={form.region || ''} onChange={e => set('region', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm bg-white">
                  <option value="">— Select —</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Farm Address</label>
              <input value={form.farmAddress || ''} onChange={e => set('farmAddress', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nearest Airstrip</label>
              <select value={form.airstrip || ''} onChange={e => set('airstrip', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm bg-white">
                <option value="">— Select —</option>
                {AIRSTRIPS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Paddocks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">Paddocks</label>
                <button type="button" onClick={addPaddock}
                  className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-100">
                  + Add
                </button>
              </div>
              {(form.paddocks || []).length > 0 && (
                <table className="w-full text-sm mb-2">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Ha</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Crop</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.paddocks || []).map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-2 py-1"><input value={p.name} onChange={e => updPaddock(i, 'name', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></td>
                        <td className="px-2 py-1"><input value={p.ha} onChange={e => updPaddock(i, 'ha', e.target.value)} type="number" step="0.01" className="w-full px-2 py-1 border rounded text-sm" /></td>
                        <td className="px-2 py-1"><input value={p.cropType} onChange={e => updPaddock(i, 'cropType', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></td>
                        <td><button type="button" onClick={() => rmPaddock(i)} className="text-red-500 hover:text-red-700 font-bold text-lg">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Billing Name / Business</label>
              <input value={form.billingName || ''} onChange={e => set('billingName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Billing Address</label>
              <input value={form.billingAddress || ''} onChange={e => set('billingAddress', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ABN</label>
              <input value={form.ABN || ''} onChange={e => set('ABN', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-sm" />
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-t bg-gray-50 flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="bg-[#e67e22] hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-green-600 font-semibold text-sm">✓ Saved!</span>}
        </div>
      </form>
    </div>
  );
}
