import React, { useState } from 'react';
import {
  Ticket,
  User,
  TicketStatus,
  TicketPriority,
  UserRole,
} from '../types.ts';
import { StatusBadge, PriorityBadge } from './StatusBadge.tsx';
import {
  X,
  Clock,
  UserCheck,
  Send,
  Lock,
  MessageSquare,
  History,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket;
  currentUser: User;
  usersList: User[];
  onClose: () => void;
  onUpdateStatus: (
    status: TicketStatus,
    resolutionNotes?: string,
    rootCauseCategory?: string
  ) => Promise<void>;
  onAssignTicket: (assigneeId: string | null) => Promise<void>;
  onChangePriority: (priority: TicketPriority) => Promise<void>;
  onAddComment: (content: string, isInternal: boolean) => Promise<void>;
  onReopenTicket: (reason: string) => Promise<void>;
  onOpenResolveModal: () => void;
  onOpenReopenModal: () => void;
}

export function TicketDetailModal({
  ticket,
  currentUser,
  usersList,
  onClose,
  onUpdateStatus,
  onAssignTicket,
  onChangePriority,
  onAddComment,
  onOpenResolveModal,
  onOpenReopenModal,
}: TicketDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const role = currentUser.role;
  const isITStaff = role === 'technician' || role === 'manager' || role === 'admin';
  const isCreator = ticket.creatorId === currentUser.id;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await onAddComment(commentText, isInternalComment);
      setCommentText('');
      setIsInternalComment(false);
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleClaim = async () => {
    setActionLoading(true);
    try {
      await onAssignTicket(currentUser.id);
    } catch (err: any) {
      alert(err.message || 'Failed to claim ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartProgress = async () => {
    setActionLoading(true);
    try {
      await onUpdateStatus('in_progress');
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (confirm('Are you sure you want to officially close this ticket?')) {
      setActionLoading(true);
      try {
        await onUpdateStatus('closed');
      } catch (err: any) {
        alert(err.message || 'Failed to close ticket');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const technicians = usersList.filter(
    (u) => u.role === 'technician' || u.role === 'manager' || u.role === 'admin'
  );

  const isOverdue =
    (ticket.status === 'open' || ticket.status === 'in_progress') &&
    new Date(ticket.dueDate) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden z-10">
        {/* Header Ribbon */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs text-slate-400 font-medium">
                {ticket.category}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white pt-1">
              {ticket.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Lifecycle Action Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">Workflow Actions:</span>

            {/* If Open and IT staff -> Start Progress */}
            {ticket.status === 'open' && isITStaff && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleStartProgress}
                className="px-2.5 py-1.5 rounded font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Start Investigation (In Progress)
              </button>
            )}

            {/* If In Progress and IT staff -> Resolve */}
            {ticket.status === 'in_progress' && isITStaff && (
              <button
                type="button"
                onClick={onOpenResolveModal}
                className="px-2.5 py-1.5 rounded font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark as Resolved</span>
              </button>
            )}

            {/* If Resolved and (Staff or Manager) -> Close */}
            {ticket.status === 'resolved' && (isITStaff || isCreator) && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCloseTicket}
                className="px-2.5 py-1.5 rounded font-medium bg-slate-700 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                Confirm & Close Ticket
              </button>
            )}

            {/* Reopen Action (If resolved or closed) */}
            {(ticket.status === 'resolved' || ticket.status === 'closed') && (
              <button
                type="button"
                onClick={onOpenReopenModal}
                className="px-2.5 py-1.5 rounded font-medium bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Ticket</span>
              </button>
            )}

            {/* Claim button for technicians if unassigned */}
            {!ticket.assigneeId && isITStaff && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleClaim}
                className="px-2.5 py-1.5 rounded font-medium bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign to Me</span>
              </button>
            )}
          </div>

          {/* SLA target note */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">SLA Due:</span>
            <span
              className={`font-mono font-medium ${
                isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'
              }`}
            >
              {new Date(ticket.dueDate).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isOverdue && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                OVERDUE
              </span>
            )}
          </div>
        </div>

        {/* Modal Body: Split view (Left details, Right activity & comments) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Ticket Specifications & Resolution */}
          <div className="lg:col-span-6 p-4 sm:p-6 space-y-5 overflow-y-auto">
            {/* Description Card */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Issue Description
              </h3>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {/* Resolution Box if Resolved or Closed */}
            {(ticket.status === 'resolved' || ticket.status === 'closed') &&
              ticket.resolutionNotes && (
                <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Resolution Summary & Findings</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed whitespace-pre-wrap">
                    {ticket.resolutionNotes}
                  </p>
                  {ticket.rootCauseCategory && (
                    <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-700 flex items-center justify-between">
                      <span>Root Cause:</span>
                      <span className="font-medium text-emerald-900 font-mono">
                        {ticket.rootCauseCategory}
                      </span>
                    </div>
                  )}
                </div>
              )}

            {/* Reopen note if present */}
            {ticket.reopenReason && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recent Reopen Reason</span>
                </div>
                <p className="text-xs text-amber-900">{ticket.reopenReason}</p>
              </div>
            )}

            {/* Detailed Properties Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                System Context & Metadata
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Submitter</span>
                  <span className="font-semibold text-slate-900">{ticket.creatorName}</span>
                  <span className="text-slate-500 block text-[11px]">{ticket.creatorDepartment}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Assignee</span>
                  {isITStaff ? (
                    <select
                      value={ticket.assigneeId || ''}
                      onChange={(e) =>
                        onAssignTicket(e.target.value === '' ? null : e.target.value)
                      }
                      className="mt-0.5 w-full py-1 px-2 text-xs rounded border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.jobTitle})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-900">
                      {ticket.assigneeName || 'Pending Assignment'}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Asset / System Tag</span>
                  <span className="font-mono text-slate-700">
                    {ticket.assetTag || 'None Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Office / Desk Location</span>
                  <span className="text-slate-700">{ticket.location || 'HQ Facility'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Submitted Timestamp</span>
                  <span className="font-mono text-slate-700">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Priority Level</span>
                  {isITStaff ? (
                    <select
                      value={ticket.priority}
                      onChange={(e) => onChangePriority(e.target.value as TicketPriority)}
                      className="mt-0.5 w-full py-1 px-2 text-xs rounded border border-slate-300 bg-white font-medium text-slate-800 capitalize focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  ) : (
                    <span className="font-semibold capitalize text-slate-900">
                      {ticket.priority}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Discussion & Audit Trail */}
          <div className="lg:col-span-6 flex flex-col h-full bg-slate-50/50">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-slate-200 bg-white px-4 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments & Updates ({ticket.comments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'history'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Timeline Audit Log ({ticket.history.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {activeTab === 'comments' ? (
                ticket.comments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No replies or technician notes recorded yet.
                  </div>
                ) : (
                  ticket.comments.map((comm) => (
                    <div
                      key={comm.id}
                      className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                        comm.isInternal
                          ? 'bg-amber-50/80 border-amber-200 text-slate-800'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">
                            {comm.authorName}
                          </span>
                          <span className="text-[11px] text-slate-400 capitalize">
                            ({comm.authorRole})
                          </span>
                          {comm.isInternal && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                              <Lock className="w-3 h-3" />
                              <span>Internal IT Note</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(comm.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                        {comm.content}
                      </p>
                    </div>
                  ))
                )
              ) : (
                <div className="space-y-3">
                  {ticket.history.map((hist) => (
                    <div
                      key={hist.id}
                      className="flex items-start gap-2.5 text-xs bg-white p-3 rounded-md border border-slate-200"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {hist.action}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(hist.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          by <span className="font-medium text-slate-700">{hist.actorName}</span>{' '}
                          ({hist.actorRole})
                        </div>
                        <p className="text-slate-600 mt-1 text-[11px]">{hist.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Composer */}
            {activeTab === 'comments' && (
              <form
                onSubmit={handlePostComment}
                className="p-3 bg-white border-t border-slate-200 space-y-2 shrink-0"
              >
                <textarea
                  rows={2}
                  placeholder={
                    isInternalComment
                      ? 'Add private IT technician diagnostic note (visible only to support staff)...'
                      : 'Type a message to the requester...'
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                />

                <div className="flex items-center justify-between">
                  {isITStaff ? (
                    <label className="flex items-center gap-1.5 text-xs text-amber-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Private Internal IT Note</span>
                      </span>
                    </label>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Your note will notify the IT support team.
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Note</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
