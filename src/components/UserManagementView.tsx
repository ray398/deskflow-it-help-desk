import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  Wrench,
  User as UserIcon,
  Check,
  X,
  Search,
  AlertCircle,
} from 'lucide-react';

interface UserManagementViewProps {
  users: User[];
  currentUser: User;
  onRefreshUsers: () => Promise<void>;
  onCreateUser: (userData: {
    name: string;
    email: string;
    role: string;
    department: string;
    jobTitle: string;
    phone?: string;
  }) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<User>) => Promise<void>;
}

export function UserManagementView({
  users,
  currentUser,
  onCreateUser,
  onUpdateUser,
}: UserManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [newDept, setNewDept] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [createError, setCreateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newDept.trim() || !newJobTitle.trim()) {
      setCreateError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setCreateError('');
    try {
      await onCreateUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        department: newDept.trim(),
        jobTitle: newJobTitle.trim(),
        phone: newPhone.trim() || undefined,
      });
      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
      setNewDept('');
      setNewJobTitle('');
      setNewPhone('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            User Directory & Role Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage corporate employees, IT technicians, managers, and system administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision User</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-medium">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-1.5 px-3 rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="employee">Employee</option>
            <option value="technician">Technician</option>
            <option value="manager">IT Manager</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Department & Title</th>
                <th className="py-3 px-4">Role Privileges</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{user.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-900 font-medium">{user.jobTitle}</div>
                    <div className="text-[11px] text-slate-500">{user.department}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        disabled={user.id === currentUser.id}
                        onChange={(e) =>
                          onUpdateUser(user.id, { role: e.target.value as UserRole })
                        }
                        className="py-1 px-2 rounded border border-slate-300 bg-white text-xs text-slate-800 capitalize font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="employee">Employee</option>
                        <option value="technician">Technician</option>
                        <option value="manager">IT Manager</option>
                        <option value="admin">Administrator</option>
                      </select>
                      {getRoleIcon(user.role)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {user.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateUser(user.id, { isActive: !user.isActive })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          user.isActive
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowCreateModal(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-sm font-bold">Provision New Enterprise User</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 text-xs">
              {createError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Lin"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="maya.lin@enterprise.corp"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="technician">Technician</option>
                    <option value="manager">IT Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloud Operations"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SRE Platform Engineer"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Desk Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
