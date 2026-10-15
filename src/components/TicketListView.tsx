import React, { useState } from 'react';
import {
  Ticket,
  User,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '../types.ts';
import { StatusBadge, PriorityBadge } from './StatusBadge.tsx';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';

interface TicketListViewProps {
  tickets: Ticket[];
  totalTickets: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  currentUser: User;
  usersList: User[];
  onOpenTicket: (ticketId: string) => void;
  onOpenCreateTicket: () => void;
  filters: {
    search: string;
    status: string;
    category: string;
    priority: string;
    assigneeId: string;
    slaStatus: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onFilterChange: (key: string, value: any) => void;
  onResetFilters: () => void;
}

export function TicketListView({
  tickets,
  totalTickets,
  currentPage,
  totalPages,
  onPageChange,
  currentUser,
  usersList,
  onOpenTicket,
  onOpenCreateTicket,
  filters,
  onFilterChange,
  onResetFilters,
}: TicketListViewProps) {
  const [exporting, setExporting] = useState(false);

  const role = currentUser.role;

  const categories: TicketCategory[] = [
    'Hardware',
    'Software',
    'Network',
    'Access',
    'Printer',
    'Other',
  ];

  const priorities: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

  const statusTabs: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Statuses' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'closed', label: 'Closed' },
  ];

  const handleExportCsv = () => {
    setExporting(true);
    try {
      const headers = [
        'Ticket ID',
        'Title',
        'Category',
        'Priority',
        'Status',
        'Submitter',
        'Department',
        'Assignee',
        'Asset Tag',
        'Created At',
        'Target Due Date',
        'Resolved At',
      ];

      const rows = tickets.map((t) => [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.priority.toUpperCase(),
        t.status.toUpperCase(),
        `"${t.creatorName}"`,
        `"${t.creatorDepartment}"`,
        `"${t.assigneeName || 'Unassigned'}"`,
        `"${t.assetTag || ''}"`,
        t.createdAt,
        t.dueDate,
        t.resolvedAt || '',
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `DeskFlow_Tickets_Export_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const getSlaIndicator = (ticket: Ticket) => {
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return (
        <span className="text-[11px] text-emerald-700 flex items-center gap-1">
          <span>Resolved</span>
        </span>
      );
    }

    const now = new Date();
    const due = new Date(ticket.dueDate);
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return (
        <span className="text-[11px] font-medium text-rose-600 flex items-center gap-1 font-mono">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Overdue ({Math.abs(Math.round(diffHours))}h)</span>
        </span>
      );
    } else if (diffHours <= 4) {
      return (
        <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>Due in {Math.round(diffHours)}h</span>
        </span>
      );
    }

    return (
      <span className="text-[11px] text-slate-500 font-mono">
        {Math.round(diffHours / 24)}d left
      </span>
    );
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.priority !== 'all' ||
    filters.assigneeId !== 'all' ||
    filters.slaStatus !== 'all';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {role === 'employee' ? 'My IT Support Requests' : 'Service Desk Ticket Queue'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {role === 'employee'
              ? 'View status updates, submit additional notes, or reopen completed tickets.'
              : 'Enterprise triage queue with SLA tracking, assignment controls, and lifecycle transitions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting || tickets.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
            title="Download CSV export of active view"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateTicket}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {statusTabs.map((tab) => {
            const isActive = filters.status === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange('status', tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, ID, asset tag, submitter..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange('search', '')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange('priority', e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* SLA Filter */}
          <div>
            <select
              value={filters.slaStatus}
              onChange={(e) => onFilterChange('slaStatus', e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All SLA Timers</option>
              <option value="overdue">Overdue Only</option>
              <option value="due_soon">Due in &lt; 4h</option>
            </select>
          </div>

          {/* Assignee Filter (for IT staff) */}
          {role !== 'employee' && (
            <div>
              <select
                value={filters.assigneeId}
                onChange={(e) => onFilterChange('assigneeId', e.target.value)}
                className="w-full py-2 px-2.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {usersList
                  .filter((u) => u.role !== 'employee')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Filtering active ({tickets.length} of {totalTickets} matching)
            </span>
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tickets Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() =>
                    onFilterChange(
                      'sortOrder',
                      filters.sortBy === 'id' && filters.sortOrder === 'asc'
                        ? 'desc'
                        : 'asc'
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Ticket ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Title & Classification</th>
                <th className="py-3 px-4">Submitter</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() => {
                    onFilterChange('sortBy', 'priority');
                    onFilterChange(
                      'sortOrder',
                      filters.sortOrder === 'asc' ? 'desc' : 'asc'
                    );
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assignee</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() => {
                    onFilterChange('sortBy', 'dueDate');
                    onFilterChange(
                      'sortOrder',
                      filters.sortOrder === 'asc' ? 'desc' : 'asc'
                    );
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>SLA Target</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-slate-700 font-medium text-sm">
                        No tickets match the selected filters.
                      </p>
                      <p className="text-slate-400 text-xs">
                        Try resetting your search query, or submit a new support request.
                      </p>
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => onOpenTicket(ticket.id)}
                    className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                  >
                    {/* Ticket ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                      {ticket.id}
                    </td>

                    {/* Title & Classification */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {ticket.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-600">{ticket.category}</span>
                        {ticket.assetTag && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-400">{ticket.assetTag}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Submitter */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{ticket.creatorName}</div>
                      <div className="text-[11px] text-slate-500">{ticket.creatorDepartment}</div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={ticket.status} />
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ticket.assigneeName ? (
                        <div className="font-medium text-slate-800">
                          {ticket.assigneeName}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* SLA Target */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSlaIndicator(ticket)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTicket(ticket.id);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{tickets.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalTickets}</span> tickets
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-mono tabular-nums">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
