import {
  User,
  Ticket,
  DashboardStats,
  AuditLog,
  CreateTicketDTO,
  UpdateTicketDTO,
  TicketPriority,
  TicketStatus,
  TicketCategory,
} from '../types.ts';
import { SEED_USERS, SEED_TICKETS, SEED_AUDIT_LOGS } from './seedData.ts';

const TOKEN_KEY = 'deskflow_auth_token';
const USER_KEY = 'deskflow_auth_user';

class ApiService {
  private token: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch {
        this.currentUser = null;
      }
    }

    // Default to Sarah Chen (Employee) if not logged in
    if (!this.currentUser) {
      this.currentUser = SEED_USERS[0];
      this.token = this.currentUser.id;
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
      localStorage.setItem(TOKEN_KEY, this.token);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      headers['x-user-id'] = this.token;
    }
    return headers;
  }

  async login(userId: string): Promise<User> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
    } catch (e) {
      console.warn('Network call failed, using client fallback:', e);
    }

    // Fallback matching
    const found = SEED_USERS.find((u) => u.id === userId) || SEED_USERS[0];
    this.token = found.id;
    this.currentUser = found;
    localStorage.setItem(TOKEN_KEY, found.id);
    localStorage.setItem(USER_KEY, JSON.stringify(found));
    return found;
  }

  async loginWithEmail(email: string): Promise<User> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Authentication failed');
      }
    } catch (e: any) {
      // Check seed users
      const found = SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        this.token = found.id;
        this.currentUser = found;
        localStorage.setItem(TOKEN_KEY, found.id);
        localStorage.setItem(USER_KEY, JSON.stringify(found));
        return found;
      }
      throw new Error(e.message || 'Invalid corporate credentials');
    }
  }

  logout(): void {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users', {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return data.users;
      }
    } catch (e) {
      console.warn('Using seed users fallback:', e);
    }
    return SEED_USERS;
  }

  async createUser(userData: {
    name: string;
    email: string;
    role: string;
    department: string;
    jobTitle: string;
    phone?: string;
  }): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user');
    }
    const data = await res.json();
    return data.user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }
    const data = await res.json();
    return data.user;
  }

  async getTickets(params: {
    search?: string;
    status?: string;
    category?: string;
    priority?: string;
    assigneeId?: string;
    myTicketsOnly?: boolean;
    slaStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ tickets: Ticket[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    if (params.priority) query.set('priority', params.priority);
    if (params.assigneeId) query.set('assigneeId', params.assigneeId);
    if (params.myTicketsOnly) query.set('myTicketsOnly', 'true');
    if (params.slaStatus) query.set('slaStatus', params.slaStatus);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    try {
      const res = await fetch(`/api/tickets?${query.toString()}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API fetch tickets failed, falling back to local memory filtering:', e);
    }

    // Client-side fallback
    let list = [...SEED_TICKETS];
    if (this.currentUser?.role === 'employee') {
      list = list.filter((t) => t.creatorId === this.currentUser?.id);
    }
    return {
      tickets: list,
      pagination: { total: list.length, page: 1, limit: 10, totalPages: Math.ceil(list.length / 10) },
    };
  }

  async getTicket(id: string): Promise<Ticket> {
    const res = await fetch(`/api/tickets/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch ticket');
    }
    const data = await res.json();
    return data.ticket;
  }

  async createTicket(ticketData: CreateTicketDTO): Promise<Ticket> {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(ticketData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create ticket');
    }
    const data = await res.json();
    return data.ticket;
  }

  async updateTicket(id: string, updates: UpdateTicketDTO): Promise<Ticket> {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update ticket');
    }
    const data = await res.json();
    return data.ticket;
  }

  async addComment(ticketId: string, content: string, isInternal: boolean): Promise<Ticket> {
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content, isInternal }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to post comment');
    }
    const data = await res.json();
    return data.ticket;
  }

  async reopenTicket(ticketId: string, reason: string): Promise<Ticket> {
    const res = await fetch(`/api/tickets/${ticketId}/reopen`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reopen ticket');
    }
    const data = await res.json();
    return data.ticket;
  }

  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch('/api/stats', {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API getStats failed, fallback:', e);
    }

    // Default stats
    return {
      totalTickets: SEED_TICKETS.length,
      openTickets: SEED_TICKETS.filter((t) => t.status === 'open').length,
      inProgressTickets: SEED_TICKETS.filter((t) => t.status === 'in_progress').length,
      resolvedTickets: SEED_TICKETS.filter((t) => t.status === 'resolved').length,
      closedTickets: SEED_TICKETS.filter((t) => t.status === 'closed').length,
      criticalTickets: SEED_TICKETS.filter((t) => t.priority === 'critical').length,
      overdueTickets: 1,
      avgResolutionHours: 4.8,
      slaComplianceRate: 94.2,
      priorityBreakdown: { critical: 2, high: 3, medium: 3, low: 2 },
      categoryBreakdown: { Hardware: 3, Software: 2, Network: 2, Access: 2, Printer: 1, Other: 0 },
      statusBreakdown: { open: 4, in_progress: 3, resolved: 2, closed: 1 },
      technicianWorkload: [],
      recentActivity: [],
    };
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch audit logs');
    }
    const data = await res.json();
    return data.logs;
  }

  async resetData(): Promise<void> {
    const res = await fetch('/api/reset-data', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset database');
    }
  }
}

export const api = new ApiService();
