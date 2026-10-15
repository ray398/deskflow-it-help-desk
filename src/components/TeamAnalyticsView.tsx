import React from 'react';
import { DashboardStats, User, Ticket } from '../types.ts';
import { StatusBadge, PriorityBadge } from './StatusBadge.tsx';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  Users,
  AlertTriangle,
  ArrowRight,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface TeamAnalyticsViewProps {
  stats: DashboardStats | null;
  tickets: Ticket[];
  currentUser: User;
  onOpenTicket: (ticketId: string) => void;
}

export function TeamAnalyticsView({
  stats,
  tickets,
  currentUser,
  onOpenTicket,
}: TeamAnalyticsViewProps) {
  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-400">Loading performance data...</div>
    );
  }

  const overdueTickets = tickets.filter((t) => {
    if (t.status === 'resolved' || t.status === 'closed') return false;
    return new Date(t.dueDate) < new Date();
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Team Performance & SLA Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational KPIs, technician resolution throughput, and SLA compliance metrics.
          </p>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">SLA Compliance Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.slaComplianceRate}%
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <span>Target: &gt; 90% Enterprise Benchmark</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Mean Time to Resolution</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.avgResolutionHours} hrs
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Calculated across resolved tickets
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Active Queue Load</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.openTickets + stats.inProgressTickets}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.openTickets} open triage, {stats.inProgressTickets} investigating
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Total Resolved / Closed</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.resolvedTickets + stats.closedTickets}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Completed service tickets
          </div>
        </div>
      </div>

      {/* Technician Workload & Capacity Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Technician Capacity & Ticket Allocation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live distribution of active versus completed tickets per specialist
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Technician Name</th>
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">Active Cases</th>
                <th className="py-3 px-4">Resolved Cases</th>
                <th className="py-3 px-4">Capacity Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.technicianWorkload.map((tech) => {
                const total = tech.activeCount + tech.resolvedCount;
                const capacityPct = Math.min(100, tech.activeCount * 25);
                return (
                  <tr key={tech.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {tech.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{tech.role}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {tech.activeCount}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700">
                      {tech.resolvedCount}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              capacityPct > 75
                                ? 'bg-rose-500'
                                : capacityPct > 40
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {capacityPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue / Escalation List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              SLA Breach & Escalation Watchlist ({overdueTickets.length})
            </h2>
          </div>
        </div>

        {overdueTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No active tickets have breached their SLA target resolution deadlines.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {overdueTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onOpenTicket(t.id)}
                className="p-4 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-rose-700">{t.id}</span>
                    <PriorityBadge priority={t.priority} />
                    <span className="font-semibold text-slate-900">{t.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
                    <span>Assigned to: {t.assigneeName || 'Unassigned'}</span>
                    <span aria-hidden="true">·</span>
                    <span>Submitter: {t.creatorName}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-rose-600 font-mono font-bold block">
                    Target: {new Date(t.dueDate).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400">Click to escalate</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
