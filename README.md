
# DeskFlow — Enterprise IT Help Desk System

DeskFlow is a full-stack IT help desk application designed to demonstrate how an organisation can manage internal IT support requests, track ticket progress, and coordinate support work across different user roles.

**Project status:** Working initial prototype; actively being developed.

## Overview

Organisations receive IT requests involving hardware, software, network access, printers, and user accounts. Without a central tracking system, requests can be difficult to prioritise, assign, and monitor.

DeskFlow provides a central interface for submitting support tickets, managing their status, recording communication, and reviewing support activity.

## Current Features

- Role-oriented experiences for Employees, Technicians, IT Managers, and Administrators.
- Dashboard with ticket summaries and support activity.
- IT ticket creation with categories and priorities.
- Ticket listing, searching, and filtering.
- Ticket details, comments, and status history.
- Ticket assignment and status workflow.
- Ticket resolution and reopening flows.
- User management interface.
- Team analytics and audit-log views.
- Responsive interface for different screen sizes.
- Express API server and file-based data persistence.

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express
- **Data storage:** JSON-file persistence in the current prototype
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Development tooling:** npm, Git, GitHub

## Getting Started

### Prerequisites

- Node.js and npm
- Git (optional if downloading the source ZIP)

### Installation

Clone the repository:

```bash
git clone https://github.com/ray398/deskflow-it-help-desk.git
cd deskflow-it-help-desk
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed in your terminal, if the application does not open automatically.

### Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Run the TypeScript compiler checks |
| `npm run preview` | Preview the built frontend |

## Current Limitations

DeskFlow is a development prototype, not a production-ready IT service management platform.

- Authentication and role enforcement require further security work.
- The current authentication mechanism is not suitable for real accounts or sensitive information.
- Data is stored in a JSON file rather than a production database.
- File-based persistence may not be durable in every hosting environment.
- Production deployment, automated tests, and security hardening remain part of the development roadmap.

Do not use real personal information, confidential company data, or production credentials with this prototype.

## Development Roadmap

- Implement secure authentication and server-side authorisation.
- Strengthen role-based access control.
- Introduce PostgreSQL and a structured data model.
- Add automated tests for key workflows and permissions.
- Improve validation, error handling, and auditability.
- Deploy a live demonstration environment.
- Document architecture and API endpoints.

## Project Background

DeskFlow is a personal software development portfolio project built with AI-assisted development and iterative testing. The code and features are being reviewed and improved as the project evolves.

The goal is to demonstrate practical skills in frontend development, backend APIs, data management, application design, debugging, and software engineering.

## Live Development

Google AI Studio project:
https://ai.studio/apps/beba9a81-9a6c-47ef-b1b0-cb4c22d8ed59 
