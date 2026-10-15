import React from 'react';
import { DashboardStats, Ticket, User, TicketPriority } from '../types.ts';
import { StatusBadge, PriorityBadge } from './StatusBadge.tsx';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck,
  Plus,
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  recentTickets: Ticket[];
  currentUser: User;
  onOpenTicket: (ticketId: string) => void;
  onOpenCreateTicket: () => void;
  onNavigateToTickets: (filterStatus?: string, filterPriority?: string) => void;
}

export function DashboardView({
  stats,
  recentTickets,
  currentUser,
  onOpenTicket,
  onOpenCreateTicket,
  onNavigateToTickets,
}: DashboardViewProps) {
  if (!stats) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-slate-200 animate-pulse rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const role = currentUser.role;

  const priorityOrder: TicketPriority[] = ['critical', 'high', 'medium', 'low'];
  const totalWithPriorities =
    Object.values(stats.priorityBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {role === 'employee' ? 'My IT Support Overview' : 'IT Service Operations Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {role === 'employee'
              ? `Welcome back, ${currentUser.name}. Track your open support requests and enterprise service status.`
              : `Operational status overview for ${currentUser.department}.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateTicket}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Ticket</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTickets()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <span>Browse All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Critical / Overdue alert banner if any */}
      {stats.overdueTickets > 0 && role !== 'employee' && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-rose-100 text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-rose-900">
                {stats.overdueTickets} Ticket{stats.overdueTickets > 1 ? 's' : ''} Exceeded Target SLA
              </h2>
              <p className="text-xs text-rose-700 mt-0.5">
                Resolution target deadlines passed without ticket resolution. Immediate technician escalation advised.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTickets(undefined, undefined)}
            className="self-start sm:self-auto px-3 py-1.5 rounded text-xs font-medium bg-rose-700 text-white hover:bg-rose-800 transition-colors"
          >
            Review Overdue Queue
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => onNavigateToTickets()}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Tickets</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalTickets}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {role === 'employee' ? 'Submitted by you' : 'In corporate registry'}
          </div>
        </div>

        {/* Open */}
        <div
          onClick={() => onNavigateToTickets('open')}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-medium">Open / Unassigned</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.openTickets}
          </div>
          <div className="text-[11px] text-amber-600 mt-1">
            Awaiting triage or pick-up
          </div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => onNavigateToTickets('in_progress')}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-medium">In Progress</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.inProgressTickets}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1">
            Actively being investigated
          </div>
        </div>

        {/* Resolved */}
        <div
          onClick={() => onNavigateToTickets('resolved')}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-medium">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.resolvedTickets}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            Solution delivered
          </div>
        </div>

        {/* Critical */}
        <div
          onClick={() => onNavigateToTickets(undefined, 'critical')}
          className="bg-white p-4 rounded-lg border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-medium">Critical Priority</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.criticalTickets}
          </div>
          <div className="text-[11px] text-rose-600 mt-1">
            High business urgency
          </div>
        </div>
      </div>

      {/* Middle Grid: Operational Breakdowns & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Priority Breakdown</h2>
            <span className="text-xs text-slate-400">By Severity</span>
          </div>
          <div className="space-y-3">
            {priorityOrder.map((pri) => {
              const count = stats.priorityBreakdown[pri] || 0;
              const pct = Math.round((count / totalWithPriorities) * 100);
              const barColors: Record<TicketPriority, string> = {
                critical: 'bg-rose-600',
                high: 'bg-orange-500',
                medium: 'bg-blue-500',
                low: 'bg-slate-400',
              };
              return (
                <div key={pri} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize font-medium text-slate-700">{pri}</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColors[pri]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>SLA Target Adherence</span>
            <span className="font-semibold text-emerald-600 font-mono">
              {stats.slaComplianceRate}%
            </span>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Service Category Distribution</h2>
            <span className="text-xs text-slate-400">Classifications</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(stats.categoryBreakdown).map(([cat, count]) => {
              return (
                <div
                  key={cat}
                  className="p-3 rounded-md bg-slate-50 border border-slate-100 flex flex-col justify-between"
                >
                  <span className="text-slate-600 font-medium">{cat}</span>
                  <span className="text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Mean Time to Resolution (MTTR)</span>
            <span className="font-semibold text-slate-900 font-mono">
              {stats.avgResolutionHours} hrs
            </span>
          </div>
        </div>

        {/* Technician Workload / Status for Managers & Technicians */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {role === 'employee' ? 'IT Service Commitments' : 'Technician Active Workload'}
            </h2>
            <span className="text-xs text-slate-400">Capacity</span>
          </div>

          {role === 'employee' ? (
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded bg-slate-50 border border-slate-100 space-y-1">
                <div className="font-semibold text-slate-900">Critical Outages: &lt; 4 Hours</div>
                <p className="text-slate-500">VPN disruptions, core server outages, line-of-business software.</p>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-100 space-y-1">
                <div className="font-semibold text-slate-900">High Priority: &lt; 8 Hours</div>
                <p className="text-slate-500">Account access locks, department software errors, faulty docks.</p>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-100 space-y-1">
                <div className="font-semibold text-slate-900">Standard Requests: 24 - 72 Hours</div>
                <p className="text-slate-500">Hardware provisioning, peripheral setups, routine software seats.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.technicianWorkload.slice(0, 4).map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-medium text-xs">
                      {tech.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-900">{tech.name}</div>
                      <div className="text-[11px] text-slate-400">{tech.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 font-mono tabular-nums">
                      {tech.activeCount}
                    </span>
                    <span className="text-[11px] text-slate-400 block">active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Recent Tickets & Chronological Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {role === 'employee' ? 'My Recent Tickets' : 'Latest Ticket Stream'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Most recently updated service requests
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTickets()}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Title & Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No active tickets found.
                    </td>
                  </tr>
                ) : (
                  recentTickets.slice(0, 6).map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => onOpenTicket(ticket.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-indigo-700 font-medium whitespace-nowrap">
                        {ticket.id}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">
                          {ticket.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{ticket.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ticket.creatorName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {ticket.assigneeName || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chronological Activity Feed */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Service Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live operational audit trail</p>
          </div>

          <div className="space-y-3.5">
            {stats.recentActivity.slice(0, 6).map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-slate-900 truncate">
                      {act.actorName}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium text-[11px]">
                    {act.action}
                  </div>
                  <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">
                    {act.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
