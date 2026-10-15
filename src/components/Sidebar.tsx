import React from 'react';
import { User, UserRole } from '../types.ts';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BarChart3,
  Users,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'tickets' | 'analytics' | 'users' | 'audit';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  onOpenCreateTicket: () => void;
  ticketCounts?: {
    total: number;
    open: number;
    inProgress: number;
    overdue: number;
  };
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenCreateTicket,
  ticketCounts,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const role = currentUser.role;

  const getTicketsLabel = (r: UserRole) => {
    switch (r) {
      case 'employee':
        return 'My Requests';
      case 'technician':
        return 'Assigned Queue';
      case 'manager':
      case 'admin':
      default:
        return 'Ticket Registry';
    }
  };

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      roles: ['employee', 'technician', 'manager', 'admin'],
    },
    {
      id: 'tickets' as NavTab,
      label: getTicketsLabel(role),
      icon: Ticket,
      roles: ['employee', 'technician', 'manager', 'admin'],
      count: ticketCounts?.open,
    },
    {
      id: 'analytics' as NavTab,
      label: 'Team Performance & SLA',
      icon: BarChart3,
      roles: ['technician', 'manager', 'admin'],
    },
    {
      id: 'users' as NavTab,
      label: 'User & Role Directory',
      icon: Users,
      roles: ['admin'],
    },
    {
      id: 'audit' as NavTab,
      label: 'Security Audit Log',
      icon: ShieldCheck,
      roles: ['manager', 'admin'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const content = (
    <div className="h-full flex flex-col justify-between p-4 bg-slate-900 border-r border-slate-800 text-slate-300">
      <div className="space-y-6">
        {/* Mobile Header Close */}
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-white">DeskFlow Menu</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <div>
          <button
            type="button"
            onClick={() => {
              onOpenCreateTicket();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Ticket</span>
          </button>
        </div>

        {/* Navigation list */}
        <div>
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 px-3">
            Navigation
          </div>
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Operational Telemetry Summary */}
        {ticketCounts && (
          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              {role === 'employee' ? 'My Activity' : 'Queue Health'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{ticketCounts.open} Open</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-300">
                <Headphones className="w-3.5 h-3.5" />
                <span>{ticketCounts.inProgress} Active</span>
              </div>
            </div>
            {ticketCounts.overdue > 0 && (
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-rose-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{ticketCounts.overdue} SLA Overdue</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Footer Card */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Session Scope:</span>
          <span className="capitalize font-semibold text-slate-200">{role}</span>
        </div>
        <div className="text-slate-300 leading-normal">
          {role === 'employee' && 'Viewing self-submitted service tickets and private updates.'}
          {role === 'technician' && 'Authorized to claim tickets, update status, and log resolution notes.'}
          {role === 'manager' && 'Full IT operational view, workload distribution, and SLA analytics.'}
          {role === 'admin' && 'Enterprise administrator privileges with user provisioning.'}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
