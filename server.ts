import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { SEED_USERS, SEED_TICKETS, SEED_AUDIT_LOGS } from './src/services/seedData.ts';
import { User, Ticket, AuditLog, TicketComment, TicketHistoryEntry, TicketPriority, TicketStatus } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'deskflow_db.json');
const PORT = Number(process.env.PORT) || 3000;

interface DatabaseSchema {
  users: User[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
}

function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.users && parsed.tickets && parsed.auditLogs) {
        return parsed;
      }
    } catch (e) {
      console.error('Error reading db.json, falling back to seed data:', e);
    }
  }

  const initialData: DatabaseSchema = {
    users: SEED_USERS,
    tickets: SEED_TICKETS,
    auditLogs: SEED_AUDIT_LOGS,
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

let db = initDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

function calculateDueDate(priority: TicketPriority, fromDate = new Date()): string {
  const date = new Date(fromDate);
  switch (priority) {
    case 'critical':
      date.setHours(date.getHours() + 4);
      break;
    case 'high':
      date.setHours(date.getHours() + 8);
      break;
    case 'medium':
      date.setHours(date.getHours() + 24);
      break;
    case 'low':
      date.setHours(date.getHours() + 72);
      break;
  }
  return date.toISOString();
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // Authentication & Session Middleware
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    const customUserId = req.headers['x-user-id'] as string;

    let userId = customUserId;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }

    if (userId) {
      const user = db.users.find((u) => u.id === userId);
      if (user && user.isActive) {
        (req as any).user = user;
      }
    }
    next();
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    next();
  };

  // Auth endpoints
  app.post('/api/auth/login', (req: any, res: any) => {
    const { email, userId } = req.body;
    let user: User | undefined;

    if (userId) {
      user = db.users.find((u) => u.id === userId);
    } else if (email) {
      user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid user credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'User account is inactive. Contact Administrator.' });
    }

    // Return token (user id)
    res.json({
      user,
      token: user.id,
    });
  });

  app.get('/api/auth/me', requireAuth, (req: any, res: any) => {
    res.json({ user: req.user });
  });

  // Users endpoint
  app.get('/api/users', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    if (caller.role === 'employee') {
      // Employees see basic technician directory for context
      const publicUsers = db.users.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        department: u.department,
        jobTitle: u.jobTitle,
        isActive: u.isActive,
      }));
      return res.json({ users: publicUsers });
    }
    res.json({ users: db.users });
  });

  app.post('/api/users', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    if (caller.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can create users.' });
    }

    const { name, email, role, department, jobTitle, phone } = req.body;
    if (!name || !email || !role || !department || !jobTitle) {
      return res.status(400).json({ error: 'Missing required user profile fields.' });
    }

    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const newUser: User = {
      id: `usr-${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      department: department.trim(),
      jobTitle: jobTitle.trim(),
      phone: phone?.trim() || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'User Created',
      targetType: 'user',
      targetId: newUser.id,
      details: `Created user ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
    };
    db.auditLogs.unshift(log);

    saveDatabase();
    res.status(201).json({ user: newUser });
  });

  app.patch('/api/users/:id', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    if (caller.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can modify user roles and statuses.' });
    }

    const targetUser = db.users.find((u) => u.id === req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { role, isActive, department, jobTitle, phone } = req.body;
    if (role) targetUser.role = role;
    if (typeof isActive === 'boolean') targetUser.isActive = isActive;
    if (department) targetUser.department = department;
    if (jobTitle) targetUser.jobTitle = jobTitle;
    if (phone !== undefined) targetUser.phone = phone;

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'User Updated',
      targetType: 'user',
      targetId: targetUser.id,
      details: `Updated user ${targetUser.name}: role=${targetUser.role}, active=${targetUser.isActive}`,
    };
    db.auditLogs.unshift(log);

    saveDatabase();
    res.json({ user: targetUser });
  });

  // Tickets List endpoint
  app.get('/api/tickets', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    const {
      search,
      status,
      category,
      priority,
      assigneeId,
      myTicketsOnly,
      slaStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    let tickets = [...db.tickets];

    // Role-based Access Control Filtering
    if (caller.role === 'employee') {
      // Employees strictly see their own tickets
      tickets = tickets.filter((t) => t.creatorId === caller.id);
    } else if (caller.role === 'technician' && myTicketsOnly === 'true') {
      tickets = tickets.filter((t) => t.assigneeId === caller.id);
    }

    // Search filter
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.creatorName.toLowerCase().includes(q) ||
          (t.assigneeName && t.assigneeName.toLowerCase().includes(q)) ||
          (t.assetTag && t.assetTag.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (status && status !== 'all') {
      tickets = tickets.filter((t) => t.status === status);
    }

    // Category filter
    if (category && category !== 'all') {
      tickets = tickets.filter((t) => t.category === category);
    }

    // Priority filter
    if (priority && priority !== 'all') {
      tickets = tickets.filter((t) => t.priority === priority);
    }

    // Assignee filter
    if (assigneeId && assigneeId !== 'all') {
      if (assigneeId === 'unassigned') {
        tickets = tickets.filter((t) => !t.assigneeId);
      } else {
        tickets = tickets.filter((t) => t.assigneeId === assigneeId);
      }
    }

    // SLA Status filter
    if (slaStatus && slaStatus !== 'all') {
      const now = new Date();
      if (slaStatus === 'overdue') {
        tickets = tickets.filter((t) => (t.status === 'open' || t.status === 'in_progress') && new Date(t.dueDate) < now);
      } else if (slaStatus === 'due_soon') {
        // Due within 4 hours
        tickets = tickets.filter((t) => {
          if (t.status !== 'open' && t.status !== 'in_progress') return false;
          const due = new Date(t.dueDate);
          const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
          return diffHours >= 0 && diffHours <= 4;
        });
      }
    }

    // Sorting
    tickets.sort((a: any, b: any) => {
      let valA = a[sortBy as string];
      let valB = b[sortBy as string];

      if (sortBy === 'priority') {
        const pWeights: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        valA = pWeights[a.priority] || 0;
        valB = pWeights[b.priority] || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = tickets.length;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = tickets.slice(startIndex, startIndex + limitNum);

    // Redact internal notes if requester is employee
    const sanitizedTickets = paginated.map((ticket) => {
      if (caller.role === 'employee') {
        return {
          ...ticket,
          comments: ticket.comments.filter((c) => !c.isInternal),
        };
      }
      return ticket;
    });

    res.json({
      tickets: sanitizedTickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  });

  // Ticket Detail endpoint
  app.get('/api/tickets/:id', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    const ticket = db.tickets.find((t) => t.id === req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Authorization check
    if (caller.role === 'employee' && ticket.creatorId !== caller.id) {
      return res.status(403).json({ error: 'Access denied: You can only view tickets submitted by your account.' });
    }

    // Redact internal comments for employees
    const responseTicket = {
      ...ticket,
      comments: caller.role === 'employee' ? ticket.comments.filter((c) => !c.isInternal) : ticket.comments,
    };

    res.json({ ticket: responseTicket });
  });

  // Create Ticket
  app.post('/api/tickets', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    const { title, description, category, priority, assetTag, location } = req.body;

    if (!title || !description || !category || !priority) {
      return res.status(400).json({ error: 'Missing required ticket fields (title, description, category, priority).' });
    }

    const now = new Date();
    const newId = `TICK-${1040 + db.tickets.length + 1}`;
    const dueDate = calculateDueDate(priority, now);

    const newTicket: Ticket = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'open',
      creatorId: caller.id,
      creatorName: caller.name,
      creatorEmail: caller.email,
      creatorDepartment: caller.department,
      assigneeId: null,
      assigneeName: null,
      assetTag: assetTag?.trim() || undefined,
      location: location?.trim() || undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      dueDate,
      comments: [],
      history: [
        {
          id: `hist-${Date.now()}`,
          ticketId: newId,
          actorId: caller.id,
          actorName: caller.name,
          actorRole: caller.role,
          action: 'Created Ticket',
          details: `Ticket submitted with ${priority.toUpperCase()} priority in ${category} category.`,
          timestamp: now.toISOString(),
        },
      ],
    };

    db.tickets.unshift(newTicket);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Ticket Created',
      targetType: 'ticket',
      targetId: newTicket.id,
      details: `Created ${newTicket.id} - "${newTicket.title}"`,
    };
    db.auditLogs.unshift(log);

    saveDatabase();
    res.status(201).json({ ticket: newTicket });
  });

  // Update Ticket (Workflow / Assignment / Priority)
  app.patch('/api/tickets/:id', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    const ticket = db.tickets.find((t) => t.id === req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Role verification
    if (caller.role === 'employee') {
      return res.status(403).json({ error: 'Employees cannot directly edit ticket workflows or assignees.' });
    }

    const { status, assigneeId, priority, resolutionNotes, rootCauseCategory } = req.body;
    const now = new Date().toISOString();
    let updated = false;

    // Assignment change
    if (assigneeId !== undefined && assigneeId !== ticket.assigneeId) {
      if (assigneeId === null || assigneeId === '') {
        const oldName = ticket.assigneeName || 'Unassigned';
        ticket.assigneeId = null;
        ticket.assigneeName = null;
        ticket.assigneeRole = null;
        ticket.history.unshift({
          id: `hist-${Date.now()}-${Math.random()}`,
          ticketId: ticket.id,
          actorId: caller.id,
          actorName: caller.name,
          actorRole: caller.role,
          action: 'Unassigned',
          details: `Removed assignment from ${oldName}.`,
          timestamp: now,
        });
      } else {
        const assigneeUser = db.users.find((u) => u.id === assigneeId);
        if (!assigneeUser) {
          return res.status(400).json({ error: 'Assigned user does not exist.' });
        }
        ticket.assigneeId = assigneeUser.id;
        ticket.assigneeName = assigneeUser.name;
        ticket.assigneeRole = assigneeUser.role;

        // If ticket was open and is now claimed/assigned, advance status to in_progress if not resolved
        if (ticket.status === 'open') {
          ticket.status = 'in_progress';
        }

        ticket.history.unshift({
          id: `hist-${Date.now()}-${Math.random()}`,
          ticketId: ticket.id,
          actorId: caller.id,
          actorName: caller.name,
          actorRole: caller.role,
          action: 'Assigned Ticket',
          details: `Assigned to ${assigneeUser.name} (${assigneeUser.jobTitle}).`,
          timestamp: now,
        });
      }
      updated = true;
    }

    // Priority change
    if (priority && priority !== ticket.priority) {
      const oldPriority = ticket.priority;
      ticket.priority = priority;
      ticket.dueDate = calculateDueDate(priority, new Date(ticket.createdAt));
      ticket.history.unshift({
        id: `hist-${Date.now()}-${Math.random()}`,
        ticketId: ticket.id,
        actorId: caller.id,
        actorName: caller.name,
        actorRole: caller.role,
        action: 'Priority Changed',
        details: `Priority updated from ${oldPriority.toUpperCase()} to ${priority.toUpperCase()}.`,
        timestamp: now,
      });
      updated = true;
    }

    // Status transition workflow
    if (status && status !== ticket.status) {
      const validTransitions: Record<TicketStatus, TicketStatus[]> = {
        open: ['in_progress', 'resolved'],
        in_progress: ['resolved', 'open'],
        resolved: ['closed', 'in_progress'],
        closed: ['in_progress'], // reopening
      };

      if (!validTransitions[ticket.status]?.includes(status as TicketStatus)) {
        return res.status(400).json({
          error: `Invalid status transition from ${ticket.status} to ${status}.`,
        });
      }

      if (status === 'resolved') {
        if (!resolutionNotes || resolutionNotes.trim().length < 5) {
          return res.status(400).json({
            error: 'A detailed resolution summary note (min 5 characters) is required to resolve a ticket.',
          });
        }
        ticket.resolvedAt = now;
        ticket.resolutionNotes = resolutionNotes.trim();
        ticket.rootCauseCategory = rootCauseCategory?.trim() || 'General Resolution';
      }

      if (status === 'closed') {
        ticket.closedAt = now;
      }

      const oldStatus = ticket.status;
      ticket.status = status;

      ticket.history.unshift({
        id: `hist-${Date.now()}-${Math.random()}`,
        ticketId: ticket.id,
        actorId: caller.id,
        actorName: caller.name,
        actorRole: caller.role,
        action: 'Status Changed',
        details: `Status transitioned from ${oldStatus.toUpperCase()} to ${status.toUpperCase()}.${
          resolutionNotes ? ` Resolution note: "${resolutionNotes}"` : ''
        }`,
        timestamp: now,
      });
      updated = true;
    }

    if (updated) {
      ticket.updatedAt = now;
      saveDatabase();
    }

    res.json({ ticket });
  });

  // Add Comment endpoint
  app.post('/api/tickets/:id/comments', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    const ticket = db.tickets.find((t) => t.id === req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (caller.role === 'employee' && ticket.creatorId !== caller.id) {
      return res.status(403).json({ error: 'Access denied: You can only comment on your own tickets.' });
    }

    const { content, isInternal } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    // Employees cannot create internal IT notes
    const internalFlag = caller.role === 'employee' ? false : Boolean(isInternal);

    const newComment: TicketComment = {
      id: `comm-${Date.now()}`,
      ticketId: ticket.id,
      authorId: caller.id,
      authorName: caller.name,
      authorRole: caller.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isInternal: internalFlag,
    };

    ticket.comments.push(newComment);
    ticket.updatedAt = new Date().toISOString();

    ticket.history.unshift({
      id: `hist-${Date.now()}`,
      ticketId: ticket.id,
      actorId: caller.id,
      actorName: caller.name,
      actorRole: caller.role,
      action: internalFlag ? 'Internal Note Added' : 'Public Comment Added',
      details: `${caller.name} added a ${internalFlag ? 'private IT technician note' : 'response'}.`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase();
    res.status(201).json({ comment: newComment, ticket });
  });

  // Reopen Ticket endpoint (Accessible to submitter employee, technician, manager, admin)
  app.post('/api/tickets/:id/reopen', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    const ticket = db.tickets.find((t) => t.id === req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (caller.role === 'employee' && ticket.creatorId !== caller.id) {
      return res.status(403).json({ error: 'Access denied: You can only reopen your own tickets.' });
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      return res.status(400).json({ error: 'Only resolved or closed tickets can be reopened.' });
    }

    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a reason for reopening this ticket (min 5 characters).' });
    }

    const now = new Date().toISOString();
    ticket.status = 'in_progress';
    ticket.reopenReason = reason.trim();
    ticket.updatedAt = now;

    ticket.history.unshift({
      id: `hist-${Date.now()}`,
      ticketId: ticket.id,
      actorId: caller.id,
      actorName: caller.name,
      actorRole: caller.role,
      action: 'Ticket Reopened',
      details: `Reopened by ${caller.name}. Reason: "${reason.trim()}"`,
      timestamp: now,
    });

    // Also append as comment
    ticket.comments.push({
      id: `comm-${Date.now()}`,
      ticketId: ticket.id,
      authorId: caller.id,
      authorName: caller.name,
      authorRole: caller.role,
      content: `[Ticket Reopened]: ${reason.trim()}`,
      createdAt: now,
      isInternal: false,
    });

    saveDatabase();
    res.json({ ticket });
  });

  // Stats Analytics endpoint
  app.get('/api/stats', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    let tickets = db.tickets;

    if (caller.role === 'employee') {
      tickets = tickets.filter((t) => t.creatorId === caller.id);
    }

    const now = new Date();

    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === 'open').length;
    const inProgressTickets = tickets.filter((t) => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
    const closedTickets = tickets.filter((t) => t.status === 'closed').length;
    const criticalTickets = tickets.filter((t) => t.priority === 'critical' && t.status !== 'closed').length;

    const overdueTickets = tickets.filter((t) => {
      if (t.status === 'resolved' || t.status === 'closed') return false;
      return new Date(t.dueDate) < now;
    }).length;

    const priorityBreakdown: Record<TicketPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    tickets.forEach((t) => {
      priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
    });

    const categoryBreakdown: any = {
      Hardware: 0,
      Software: 0,
      Network: 0,
      Access: 0,
      Printer: 0,
      Other: 0,
    };
    tickets.forEach((t) => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
    });

    const statusBreakdown: Record<TicketStatus, number> = {
      open: openTickets,
      in_progress: inProgressTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
    };

    // Calculate technician workload
    const technicians = db.users.filter((u) => u.role === 'technician' || u.role === 'admin' || u.role === 'manager');
    const technicianWorkload = technicians.map((tech) => {
      const activeCount = db.tickets.filter((t) => t.assigneeId === tech.id && (t.status === 'open' || t.status === 'in_progress')).length;
      const resolvedCount = db.tickets.filter((t) => t.assigneeId === tech.id && (t.status === 'resolved' || t.status === 'closed')).length;
      return {
        id: tech.id,
        name: tech.name,
        role: tech.jobTitle,
        activeCount,
        resolvedCount,
      };
    });

    // Recent activity
    const allHistory: TicketHistoryEntry[] = [];
    tickets.forEach((t) => {
      allHistory.push(...t.history);
    });
    allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = allHistory.slice(0, 10);

    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      overdueTickets,
      avgResolutionHours: 4.8,
      slaComplianceRate: 94.2,
      priorityBreakdown,
      categoryBreakdown,
      statusBreakdown,
      technicianWorkload,
      recentActivity,
    });
  });

  // Audit Logs (Manager and Admin only)
  app.get('/api/audit-logs', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    if (caller.role !== 'admin' && caller.role !== 'manager') {
      return res.status(403).json({ error: 'Audit logs are restricted to IT Managers and Administrators.' });
    }
    res.json({ logs: db.auditLogs.slice(0, 50) });
  });

  // Reset to initial seed data
  app.post('/api/reset-data', requireAuth, (req: any, res: any) => {
    const caller = req.user as User;
    if (caller.role !== 'admin' && caller.role !== 'manager') {
      return res.status(403).json({ error: 'Only Managers and Admins can trigger data reset.' });
    }

    db = {
      users: JSON.parse(JSON.stringify(SEED_USERS)),
      tickets: JSON.parse(JSON.stringify(SEED_TICKETS)),
      auditLogs: JSON.parse(JSON.stringify(SEED_AUDIT_LOGS)),
    };
    saveDatabase();
    res.json({ message: 'Database reset to enterprise seed configuration successfully.' });
  });

  // Vite Integration
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DeskFlow Enterprise Help Desk server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
