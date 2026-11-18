
# SyncBoard – Real-Time Collaborative Kanban Board

SyncBoard is a multi-organization and multi-tenant task management application. It helps teams organize projects, manage tasks and collaborate in real time.

## Features

- User registration and login
- Multiple organizations
- Multiple tenants or branches
- Role-based access control
- Board management
- Column management
- Task management
- Task assignment
- Drag-and-drop task ordering (frontend integration pending)
- Real-time updates using Socket.IO
- Online user presence
- Activity logs
- Optimistic concurrency control
- Tenant-level data isolation

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT Authentication
- bcryptjs

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client
- dnd-kit

## Project Structure

```text
SyncBoard/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── utils/
│   ├── .env
│   └── server.js
│
├── frontend/
│
├── docs/
│   ├── er-diagram.md
│   ├── api-documentation.md
│   └── websocket-events.md
│
└── README.md
```

## Architecture

SyncBoard follows a client-server architecture.

1. React frontend sends requests to the Express backend.
2. Express routes handle incoming API requests.
3. Controllers execute business logic.
4. Mongoose communicates with MongoDB.
5. Middleware handles authentication and authorization.
6. Socket.IO broadcasts real-time updates to authorized tenant rooms.

## Multi-Tenant Architecture

The application supports multiple organizations.

Each organization can contain multiple tenants.

Users receive access through memberships and roles.

Tenant-specific resources are associated with a tenant ID. The backend validates access before returning or modifying tenant data.

## User Roles

| Role | Responsibility |
|---|---|
| ORG_ADMIN | Manages organization and memberships |
| TENANT_ADMIN | Manages a tenant and its members |
| MEMBER | Works with assigned tasks |

## Concurrency Handling

Tasks use version-based optimistic concurrency control.

When a user updates a task, the backend checks its expected version.

If another user has already changed the task, the outdated update is rejected with a conflict response.

## Real-Time Communication

Socket.IO provides:

- Tenant-specific rooms
- User-specific rooms
- Board events
- Column events
- Task events
- Membership notifications
- Online user presence

## Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd SyncBoard
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the backend folder.

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_SECRET_KEY
CLIENT_URL=http://localhost:5173
```

Replace placeholder values with your own credentials.

### 4. Start backend

```bash
npm run dev
```

If your project does not have a dev script, use:

```bash
node server.js
```

## API Documentation

Detailed API documentation:

`docs/api-documentation.md`

## WebSocket Documentation

Real-time event documentation:

`docs/websocket-events.md`

## ER Diagram

Database relationships:

`docs/er-diagram.md`

## Current Development Status

Backend APIs and core real-time functionality have been implemented.

Frontend development and final end-to-end integration are pending.

## Future Improvements

- Complete React frontend
- Drag-and-drop interface
- Real-time frontend synchronization
- Task comments and notifications
- Undo/redo functionality
- Redis adapter for multi-server Socket.IO deployment
- Automated testing

## License

This project is developed as a software engineering assignment.
