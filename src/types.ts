export type UserRole = 'employee' | 'technician' | 'manager' | 'admin';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type TicketCategory =
  | 'Hardware'
  | 'Software'
  | 'Network'
  | 'Access'
  | 'Printer'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  jobTitle: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorDepartment: string;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeRole?: UserRole | null;
  assetTag?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionNotes?: string;
  rootCauseCategory?: string;
  reopenReason?: string;
  comments: TicketComment[];
  history: TicketHistoryEntry[];
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  criticalTickets: number;
  overdueTickets: number;
  avgResolutionHours: number;
  slaComplianceRate: number;
  priorityBreakdown: Record<TicketPriority, number>;
  categoryBreakdown: Record<TicketCategory, number>;
  statusBreakdown: Record<TicketStatus, number>;
  technicianWorkload: Array<{
    id: string;
    name: string;
    role: string;
    activeCount: number;
    resolvedCount: number;
  }>;
  recentActivity: TicketHistoryEntry[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetType: 'ticket' | 'user' | 'system';
  targetId: string;
  details: string;
}

export interface CreateTicketDTO {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  assetTag?: string;
  location?: string;
}

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigneeId?: string | null;
  resolutionNotes?: string;
  rootCauseCategory?: string;
}
