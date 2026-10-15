import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { SEED_USERS } from '../services/seedData.ts';
import {
  Layers,
  ChevronDown,
  RotateCcw,
  LogOut,
  User as UserIcon,
  Shield,
  Briefcase,
  Wrench,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
  onResetData: () => void;
  onToggleMobileNav: () => void;
}

export function Navbar({
  currentUser,
  onSwitchUser,
  onLogout,
  onResetData,
  onToggleMobileNav,
}: NavbarProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-purple-600" />;
      case 'manager':
        return <Briefcase className="w-3.5 h-3.5 text-blue-600" />;
      case 'technician':
        return <Wrench className="w-3.5 h-3.5 text-indigo-600" />;
      case 'employee':
      default:
        return <UserIcon className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'technician':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'employee':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleReset = async () => {
    if (confirm('Reset database tickets and status logs to initial default seed state?')) {
      setResetting(true);
      await onResetData();
      setResetting(false);
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 select-none">
      {/* Brand & Mobile toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-bold tracking-wider shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-white tracking-tight">DeskFlow</span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-indigo-300 tracking-wide bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
                ITSM v2.4
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-normal">
              Enterprise IT Service Management
            </p>
          </div>
        </div>
      </div>

      {/* Right controls: Role switcher & User info */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Role Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-colors"
            title="Switch demo persona to test different role permissions"
          >
            <span className="text-slate-400 hidden sm:inline">Role View:</span>
            <span className="capitalize font-semibold text-white">{currentUser.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setRoleMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-30 text-slate-900">
                <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Demo Persona
                </div>
                <div className="py-1">
                  {SEED_USERS.slice(0, 4).map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          onSwitchUser(user.id);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-indigo-50/60 font-medium' : ''
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-semibold">{user.name}</span>
                          <span className="text-slate-500 text-[11px]">{user.jobTitle}</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] border capitalize ${getRoleBadgeStyle(
                            user.role
                          )}`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-[11px] text-slate-400">
                  Switching personas dynamically updates permissions and views.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Reset Seed Data */}
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          title="Reset sample tickets to default"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>Reset Data</span>
        </button>

        {/* Current User Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-indigo-300">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200 leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[11px] text-slate-400 leading-tight">
              {currentUser.department}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
