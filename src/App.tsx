import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Ticket,
  DashboardStats,
  AuditLog,
  CreateTicketDTO,
  TicketPriority,
  TicketStatus,
} from './types.ts';
import { api } from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { TicketListView } from './components/TicketListView.tsx';
import { TicketDetailModal } from './components/TicketDetailModal.tsx';
import { CreateTicketModal } from './components/CreateTicketModal.tsx';
import { ResolveModal } from './components/ResolveModal.tsx';
import { ReopenModal } from './components/ReopenModal.tsx';
import { TeamAnalyticsView } from './components/TeamAnalyticsView.tsx';
import { UserManagementView } from './components/UserManagementView.tsx';
import { AuditLogsView } from './components/AuditLogsView.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Data states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  // Ticket filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
    priority: 'all',
    assigneeId: 'all',
    slaStatus: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  // Fetch tickets & stats
  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch tickets with filters
      const ticketResult = await api.getTickets({
        ...filters,
        page: currentPage,
        limit: 10,
      });
      setTickets(ticketResult.tickets);
      setTotalTickets(ticketResult.pagination.total);
      setTotalPages(ticketResult.pagination.totalPages);

      // 2. Fetch stats
      const statsResult = await api.getStats();
      setStats(statsResult);

      // 3. Fetch users if authorized
      const users = await api.getUsers();
      setUsersList(users);

      // 4. Fetch audit logs if manager or admin
      if (currentUser.role === 'manager' || currentUser.role === 'admin') {
        try {
          const logs = await api.getAuditLogs();
          setAuditLogs(logs);
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters, currentPage]);

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  // Auth handlers
  const handleLoginWithUserId = async (userId: string) => {
    setLoading(true);
    const user = await api.login(userId);
    setCurrentUser(user);
    setCurrentTab('dashboard');
    setCurrentPage(1);
  };

  const handleLoginWithEmail = async (email: string) => {
    setLoading(true);
    const user = await api.loginWithEmail(email);
    setCurrentUser(user);
    setCurrentTab('dashboard');
    setCurrentPage(1);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setSelectedTicketId(null);
  };

  const handleSwitchUser = async (userId: string) => {
    await handleLoginWithUserId(userId);
  };

  const handleResetData = async () => {
    try {
      await api.resetData();
      await refreshData();
      setSelectedTicketId(null);
    } catch (e: any) {
      alert(e.message || 'Failed to reset data');
    }
  };

  // Ticket actions
  const handleOpenTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
  };

  const handleCloseTicketModal = () => {
    setSelectedTicketId(null);
    setShowResolveModal(false);
    setShowReopenModal(false);
  };

  const handleCreateTicketSubmit = async (dto: CreateTicketDTO) => {
    const newTicket = await api.createTicket(dto);
    await refreshData();
    setSelectedTicketId(newTicket.id);
  };

  const handleUpdateStatus = async (
    newStatus: TicketStatus,
    resolutionNotes?: string,
    rootCauseCategory?: string
  ) => {
    if (!selectedTicketId) return;
    await api.updateTicket(selectedTicketId, {
      status: newStatus,
      resolutionNotes,
      rootCauseCategory,
    });
    await refreshData();
  };

  const handleAssignTicket = async (assigneeId: string | null) => {
    if (!selectedTicketId) return;
    await api.updateTicket(selectedTicketId, {
      assigneeId,
    });
    await refreshData();
  };

  const handleChangePriority = async (priority: TicketPriority) => {
    if (!selectedTicketId) return;
    await api.updateTicket(selectedTicketId, {
      priority,
    });
    await refreshData();
  };

  const handleAddComment = async (content: string, isInternal: boolean) => {
    if (!selectedTicketId) return;
    await api.addComment(selectedTicketId, content, isInternal);
    await refreshData();
  };

  const handleReopenTicket = async (reason: string) => {
    if (!selectedTicketId) return;
    await api.reopenTicket(selectedTicketId, reason);
    await refreshData();
  };

  // Filter updates
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      priority: 'all',
      assigneeId: 'all',
      slaStatus: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
  };

  // Dashboard quick navigations
  const handleDashboardNavigate = (filterStatus?: string, filterPriority?: string) => {
    setFilters((prev) => ({
      ...prev,
      status: filterStatus || 'all',
      priority: filterPriority || 'all',
    }));
    setCurrentPage(1);
    setCurrentTab('tickets');
  };

  // User management actions
  const handleCreateUser = async (userData: any) => {
    await api.createUser(userData);
    const users = await api.getUsers();
    setUsersList(users);
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    await api.updateUser(id, updates);
    const users = await api.getUsers();
    setUsersList(users);
  };

  // If not logged in, render corporate login screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginWithUserId={handleLoginWithUserId}
        onLoginWithEmail={handleLoginWithEmail}
      />
    );
  }

  const selectedTicket = selectedTicketId
    ? tickets.find((t) => t.id === selectedTicketId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Enterprise Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        onResetData={handleResetData}
        onToggleMobileNav={() => setMobileNavOpen(true)}
      />

      <div className="flex-1 flex">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          onOpenCreateTicket={() => setShowCreateModal(true)}
          ticketCounts={{
            total: stats?.totalTickets || 0,
            open: stats?.openTickets || 0,
            inProgress: stats?.inProgressTickets || 0,
            overdue: stats?.overdueTickets || 0,
          }}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              recentTickets={tickets}
              currentUser={currentUser}
              onOpenTicket={handleOpenTicket}
              onOpenCreateTicket={() => setShowCreateModal(true)}
              onNavigateToTickets={handleDashboardNavigate}
            />
          )}

          {currentTab === 'tickets' && (
            <TicketListView
              tickets={tickets}
              totalTickets={totalTickets}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              currentUser={currentUser}
              usersList={usersList}
              onOpenTicket={handleOpenTicket}
              onOpenCreateTicket={() => setShowCreateModal(true)}
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          )}

          {currentTab === 'analytics' && (
            <TeamAnalyticsView
              stats={stats}
              tickets={tickets}
              currentUser={currentUser}
              onOpenTicket={handleOpenTicket}
            />
          )}

          {currentTab === 'users' && currentUser.role === 'admin' && (
            <UserManagementView
              users={usersList}
              currentUser={currentUser}
              onRefreshUsers={refreshData}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {currentTab === 'audit' &&
            (currentUser.role === 'admin' || currentUser.role === 'manager') && (
              <AuditLogsView logs={auditLogs} currentUser={currentUser} />
            )}
        </main>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          currentUser={currentUser}
          usersList={usersList}
          onClose={handleCloseTicketModal}
          onUpdateStatus={handleUpdateStatus}
          onAssignTicket={handleAssignTicket}
          onChangePriority={handleChangePriority}
          onAddComment={handleAddComment}
          onReopenTicket={handleReopenTicket}
          onOpenResolveModal={() => setShowResolveModal(true)}
          onOpenReopenModal={() => setShowReopenModal(true)}
        />
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTicketSubmit}
        />
      )}

      {/* Resolve Ticket Modal */}
      {showResolveModal && selectedTicket && (
        <ResolveModal
          ticketId={selectedTicket.id}
          onClose={() => setShowResolveModal(false)}
          onConfirm={async (notes, rootCause) => {
            await handleUpdateStatus('resolved', notes, rootCause);
            setShowResolveModal(false);
          }}
        />
      )}

      {/* Reopen Ticket Modal */}
      {showReopenModal && selectedTicket && (
        <ReopenModal
          ticketId={selectedTicket.id}
          onClose={() => setShowReopenModal(false)}
          onConfirm={async (reason) => {
            await handleReopenTicket(reason);
            setShowReopenModal(false);
          }}
        />
      )}
    </div>
  );
}
