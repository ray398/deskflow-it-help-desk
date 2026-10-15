import React, { useState } from 'react';
import { X, RotateCcw, AlertCircle } from 'lucide-react';

interface ReopenModalProps {
  ticketId: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function ReopenModal({
  ticketId,
  onClose,
  onConfirm,
}: ReopenModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a specific reason for reopening (min 5 characters).');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reopen ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
        <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-200" />
            <h2 className="text-sm font-bold">Reopen Ticket {ticketId}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-amber-200 hover:text-white hover:bg-amber-700"
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
              Reason for Reopening <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain why the solution was incomplete or if the symptom recurred..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-400">
              This will transition the ticket back to &quot;In Progress&quot; and notify the assigned IT specialist.
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
              disabled={loading || !reason.trim()}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors shadow-xs"
            >
              {loading ? 'Processing...' : 'Reopen Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
