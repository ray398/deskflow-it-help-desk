import React, { useState } from 'react';
import { TicketCategory, TicketPriority, CreateTicketDTO, User } from '../types.ts';
import { X, AlertCircle, HelpCircle } from 'lucide-react';

interface CreateTicketModalProps {
  currentUser: User;
  onClose: () => void;
  onSubmit: (dto: CreateTicketDTO) => Promise<void>;
}

export function CreateTicketModal({
  currentUser,
  onClose,
  onSubmit,
}: CreateTicketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Hardware');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [assetTag, setAssetTag] = useState('');
  const [location, setLocation] = useState(
    currentUser.department.includes('Finance')
      ? 'HQ Tower A, Floor 7'
      : 'HQ Tower B'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const categories: TicketCategory[] = [
    'Hardware',
    'Software',
    'Network',
    'Access',
    'Printer',
    'Other',
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Please provide a clear ticket title.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please provide detailed steps or symptoms.';
    } else if (description.trim().length < 15) {
      newErrors.description = 'Description must be at least 15 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        assetTag: assetTag.trim() || undefined,
        location: location.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to submit ticket' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Submit IT Support Request</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Initiate a ticket for hardware, software, or account provisioning assistance
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {errors.form && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Ticket Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Unable to connect to VPN from remote office"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full p-2.5 rounded-md border text-xs focus:outline-none focus:ring-1 ${
                errors.title
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 focus:ring-indigo-500'
              } text-slate-900`}
            />
            {errors.title && (
              <p className="text-rose-600 text-[11px]">{errors.title}</p>
            )}
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full p-2.5 rounded-md border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Priority & SLA
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full p-2.5 rounded-md border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 capitalize"
              >
                <option value="low">Low (72h SLA)</option>
                <option value="medium">Medium (24h SLA)</option>
                <option value="high">High (8h SLA)</option>
                <option value="critical">Critical (4h SLA Outage)</option>
              </select>
            </div>
          </div>

          {/* Asset Tag & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Asset / Device Tag (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., LPT-8891, MON-440"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                className="w-full p-2.5 rounded-md border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Location / Workstation
              </label>
              <input
                type="text"
                placeholder="e.g., Tower A Floor 7 Desk 712"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 rounded-md border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe the issue in detail, error codes, steps already taken, and business impact..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-2.5 rounded-md border text-xs focus:outline-none focus:ring-1 ${
                errors.description
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 focus:ring-indigo-500'
              } text-slate-900`}
            />
            {errors.description && (
              <p className="text-rose-600 text-[11px]">{errors.description}</p>
            )}
          </div>

          {/* SLA info note */}
          <div className="p-3 rounded bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              Tickets are routed automatically to the on-duty support triage queue.
              Enterprise response times are tracked against department Service Level
              Agreements.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
