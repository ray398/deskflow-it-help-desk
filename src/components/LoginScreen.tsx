import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { SEED_USERS } from '../services/seedData.ts';
import {
  Layers,
  Shield,
  Briefcase,
  Wrench,
  User as UserIcon,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginWithUserId: (userId: string) => Promise<void>;
  onLoginWithEmail: (email: string) => Promise<void>;
}

export function LoginScreen({
  onLoginWithUserId,
  onLoginWithEmail,
}: LoginScreenProps) {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [error, setError] = useState('');

  const demoPersonas: Array<{
    user: User;
    description: string;
    capabilities: string[];
    roleBadgeClass: string;
  }> = [
    {
      user: SEED_USERS[0], // Sarah Chen - Employee
      description: 'Senior Financial Analyst in Finance & Accounting',
      capabilities: [
        'Submit hardware/access support requests',
        'Track own tickets & view technician updates',
        'Reopen tickets if issues recur',
      ],
      roleBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      user: SEED_USERS[1], // Alex Rivera - Technician
      description: 'Tier 2 Systems Specialist in IT Support & Infrastructure',
      capabilities: [
        'Claim unassigned support requests',
        'Progress workflow (Open → In Progress → Resolved)',
        'Add private internal technician diagnostics',
      ],
      roleBadgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      user: SEED_USERS[2], // Marcus Vance - IT Manager
      description: 'IT Operations & Service Desk Operations Manager',
      capabilities: [
        'Full team queue & technician capacity oversight',
        'Monitor SLA breaches & MTTR analytics',
        'Reassign tickets across specialists',
      ],
      roleBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      user: SEED_USERS[3], // Elena Rostova - Admin
      description: 'Lead Enterprise Systems & IAM Administrator',
      capabilities: [
        'Provision corporate user accounts & roles',
        'Inspect immutable security audit logs',
        'Full system access and data configuration',
      ],
      roleBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  const handleSelectPersona = async (userId: string) => {
    setLoadingUser(userId);
    setError('');
    try {
      await onLoginWithUserId(userId);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoadingUser(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please enter a corporate email address.');
      return;
    }
    setLoadingUser('form');
    setError('');
    try {
      await onLoginWithEmail(emailInput.trim());
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoadingUser(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'manager':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'technician':
        return <Wrench className="w-4 h-4 text-indigo-600" />;
      case 'employee':
      default:
        return <UserIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 text-slate-100 select-none">
      {/* Background decoration */}
      <div className="max-w-4xl w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg mb-2">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            DeskFlow Enterprise IT Help Desk
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Corporate IT Service Management & Engineering Ticketing Platform. Choose a role
            below for instant sandbox evaluation, or log in with corporate credentials.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5 max-w-xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Personas Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-slate-300">
              Select Demo Persona (1-Click Instant Sign-In)
            </span>
            <span>Role-Based Access Control</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoPersonas.map(({ user, description, capabilities, roleBadgeClass }) => {
              const isLoading = loadingUser === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectPersona(user.id)}
                  className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-xl p-5 cursor-pointer transition-all hover:shadow-xl group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-300 group-hover:bg-indigo-950 transition-colors">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                            {user.name}
                          </div>
                          <div className="text-xs text-slate-400">{user.jobTitle}</div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border capitalize ${roleBadgeClass}`}
                      >
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">{description}</div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      {capabilities.map((cap, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-[11px] text-slate-400"
                        >
                          <CheckCircle className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <span>{isLoading ? 'Authenticating...' : `Enter as ${user.name}`}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Traditional Corporate Login Form Accordion */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 max-w-md mx-auto space-y-3">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Or Sign In with Corporate Email
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="block text-slate-400 font-medium">Enterprise Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  placeholder="e.g. sarah.chen@enterprise.corp"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-400 font-medium">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingUser === 'form'}
              className="w-full py-2.5 rounded-md font-semibold bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow-md transition-colors disabled:opacity-50"
            >
              {loadingUser === 'form' ? 'Signing in...' : 'Sign In with SSO / LDAP'}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          DeskFlow Enterprise Help Desk · Demo Sandbox Environment · ISO 27001 & SOC 2 Type II Certified Process
        </div>
      </div>
    </div>
  );
}
