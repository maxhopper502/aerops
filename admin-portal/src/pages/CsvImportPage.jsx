import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const REQUIRED = ['clientName', 'email'];

export default function CsvImportPage() {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(0);
  const [errors, setErrors] = useState([]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.trim().split('\n');
      if (lines.length < 2) return;
      const hdrs = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setHeaders(hdrs);
      const data = lines.slice(1).filter(l => l.trim());
      const parsed = data.map((line, i) => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {}; hdrs.forEach((h, idx) => obj[h] = vals[idx] || '');
        return obj;
      });
      setPreview(parsed.slice(0, 5));
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setErrors([]);
    let count = 0;
    const errs = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.email) { errs.push(`Row ${i+2}: Missing email`); continue; }
      try {
        await addDoc(collection(db, 'clients'), {
          name: r.contactName || r.clientName || '',
          email: r.email,
          phone: r.phone || '',
          farmName: r.farmName || '',
          farmAddress: r.farmAddress || '',
          region: r.region || '',
          airstrip: r.airstrip || '',
          billingName: r.billingName || r.clientName || '',
          billingAddress: r.billingAddress || '',
          ABN: r.ABN || '',
          paddocks: [],
          createdAt: serverTimestamp()
        });
        count++;
      } catch (e) {
        errs.push(`Row ${i+2}: ${e.message}`);
      }
    }
    setDone(count);
    setErrors(errs);
    setImporting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-xl font-bold text-[#1a3a5c]">CSV Import Clients</h2>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-2">Upload CSV File</h3>
        <p className="text-sm text-gray-500 mb-4">Upload a CSV with columns: clientName, contactName, email, phone, farmAddress, region, airstrip, billingName, ABN</p>
        <input type="file" accept=".csv" onChange={handleFile}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1a3a5c] file:text-white file:font-bold cursor-pointer" />
      </div>

      {preview.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="font-bold text-[#1a3a5c]">Preview — {rows.length} clients to import</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>{headers.map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((r, i) => (
                    <tr key={i}>
                      {headers.map(h => <td key={h} className="px-3 py-2 text-gray-800 whitespace-nowrap">{r[h] || '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-gray-50 text-sm text-gray-500">Showing first 5 of {rows.length} rows</div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="font-bold text-red-700 mb-2">Errors ({errors.length})</div>
              {errors.slice(0, 10).map((e, i) => <div key={i} className="text-red-600 text-sm">{e}</div>)}
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={handleImport} disabled={importing}
              className="bg-[#16a34a] hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-8 py-3 rounded-xl">
              {importing ? `Importing... ${rows.length - done} remaining` : `Import ${rows.length} Clients`}
            </button>
            {done > 0 && <span className="text-green-600 font-bold text-lg self-center">✓ {done} clients imported!</span>}
          </div>
        </>
      )}
    </div>
  );
}
