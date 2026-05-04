import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { exportData, importData, resetData } from '../lib/export-import';
import { useAppState } from '../hooks/useLocalStorage';

export default function Settings() {
  const [, setState] = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      if (!confirm('This will replace all your current data. Continue?')) return;
      const result = importData(json);
      if (result.success) {
        setImportSuccess(true);
        setImportError(null);
        setState(() => JSON.parse(json));
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        setImportError(result.error ?? 'Unknown error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleReset() {
    if (resetConfirm !== 'DELETE') return;
    resetData();
    setState(() => JSON.parse(localStorage.getItem('sponsor-track-ie:v1') || '{}'));
    setResetConfirm('');
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">Manage your local data.</p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-800">Export data</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Downloads a JSON file of all your jobs, checklist, study progress, and blog ideas.
            Keep this as a backup.
          </p>
          <button onClick={exportData} className="btn-primary mt-4 flex items-center gap-2">
            <Download size={15} /> Export JSON
          </button>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-800">Import data</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Restores from a previously exported JSON file. This replaces all current data.
          </p>
          {importError && (
            <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{importError}</p>
          )}
          {importSuccess && (
            <p className="mt-2 rounded bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Data imported successfully.</p>
          )}
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} className="btn-secondary mt-4 flex items-center gap-2">
            <Upload size={15} /> Import JSON
          </button>
        </div>

        <div className="rounded-lg border border-red-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-red-700">Reset all data</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Clears everything from localStorage. This cannot be undone. Export first if you want a backup.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <input
              className="input w-40"
              placeholder='Type DELETE to confirm'
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
            />
            <button
              onClick={handleReset}
              disabled={resetConfirm !== 'DELETE'}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} /> Reset
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-800">Storage info</h2>
          <p className="mt-1 text-xs text-zinc-500">
            All data stored in <code className="font-mono">localStorage</code> under key{' '}
            <code className="font-mono">sponsor-track-ie:v1</code>.
            No data leaves your browser.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            To add a new sponsor company, edit <code className="font-mono">data/sponsors.json</code> and redeploy.
          </p>
        </div>
      </div>
    </div>
  );
}
