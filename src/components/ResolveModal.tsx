import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface ResolveModalProps {
  ticketId: string;
  onClose: () => void;
  onConfirm: (notes: string, rootCause: string) => Promise<void>;
}

export function ResolveModal({
  ticketId,
  onClose,
  onConfirm,
}: ResolveModalProps) {
  const [notes, setNotes] = useState('');
  const [rootCause, setRootCause] = useState('Configuration Adjusted');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rootCauses = [
    'Configuration Adjusted',
    'Hardware Component Replaced',
    'Software Bug / Patch Applied',
    'Network / DNS Routing Fixed',
    'IAM / Access Permission Granted',
    'User Guidance Provided',
    'Vendor / Cloud Provider Outage Resolved',
    'Duplicate / Void Incident',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || notes.trim().length < 5) {
      setError('Please provide a descriptive resolution summary (min 5 characters).');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(notes.trim(), rootCause);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
        <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <h2 className="text-sm font-bold">Resolve Ticket {ticketId}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-emerald-200 hover:text-white hover:bg-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Root Cause Classification
            </label>
            <select
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              className="w-full p-2.5 rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {rootCauses.map((rc) => (
                <option key={rc} value={rc}>
                  {rc}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Resolution Summary & Technical Solution <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Detail the root cause diagnosis, remediation steps taken, and verification with the user..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              This summary will be visible to the requester and recorded in the audit history.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !notes.trim()}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-xs"
            >
              {loading ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
