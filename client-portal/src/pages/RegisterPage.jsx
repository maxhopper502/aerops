import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const REGIONS = [
  'Eyre Peninsula', 'Yorke Peninsula', 'Mid North', 'South East', 'Kangaroo Island'
];

const ic = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] text-gray-800 text-sm';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', farmName: '', region: '' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function upd(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const cred = await register(form.email, password);
      await setDoc(doc(db, 'clients', cred.user.uid), {
        name: form.name, email: form.email, phone: form.phone,
        farmName: form.farmName, region: form.region,
        farmAddress: '', airstrip: '', paddocks: [],
        billingName: '', billingAddress: '', ABN: '',
        agronomistId: null,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a3a5c] to-[#243f63] px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-[#1a3a5c] mb-1">AeroOps</div>
          <div className="text-sm text-gray-500">Client Registration — Aerotech Australasia</div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">Create Your Account</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Contact Name *</label>
              <input type="text" value={form.name} onChange={e => upd('name', e.target.value)} className={ic} required placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Phone *</label>
              <input type="tel" value={form.phone} onChange={e => upd('phone', e.target.value)} className={ic} required placeholder="04xx xxx xxx" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => upd('email', e.target.value)} className={ic} required placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Farm / Business Name *</label>
              <input type="text" value={form.farmName} onChange={e => upd('farmName', e.target.value)} className={ic} required placeholder="Farm or business name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Region *</label>
              <select value={form.region} onChange={e => upd('region', e.target.value)} className={ic} required>
                <option value="">— Select —</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={ic} required placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Confirm Password *</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={ic} required placeholder="Repeat password" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#e67e22] hover:bg-[#d35400] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-60">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1a3a5c] font-semibold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
