
# SyncBoard – WebSocket Events Documentation

## 1. Overview

SyncBoard uses Socket.IO for real-time communication between users.

Real-time updates include:

- Board creation, update and deletion
- Column creation, update and deletion
- Task creation, update, movement and deletion
- Membership changes
- Tenant-based online user presence

## 2. Connection

The Socket.IO server runs on the same backend server as the Express API.

### Authentication

Socket connections are authenticated using the JWT token stored in the `token` cookie.

The client must send cookies with the connection.

Example:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  withCredentials: true
});
```

Unauthenticated connections are rejected.

## 3. Socket Rooms

SyncBoard uses two types of rooms.

### User Room

Format:

```text
user:<userId>
```

Each authenticated user automatically joins their private user room.

This room is used for membership notifications.

### Tenant Room

Format:

```text
tenant:<tenantId>
```

Users must have active membership or active Org Admin access to join a tenant room.

Tenant-specific events are broadcast only to users in that tenant room.

## 4. Client-to-Server Events

### 4.1 join-tenant

Joins an authorized tenant room.

```javascript
socket.emit("join-tenant", tenantId);
```

The server checks:

- Tenant exists.
- User has active Org Admin access or active tenant membership.
- User is authorized to access the tenant.

Successful response:

```javascript
{
  success: true,
  tenantId: "TENANT_ID"
}
```

Event received:

```text
tenant-joined
```

### 4.2 leave-tenant

Leaves a tenant room.

```javascript
socket.emit("leave-tenant", tenantId);
```

Response event:

```text
tenant-left
```

## 5. Server-to-Client Events

### 5.1 tenant-joined

Sent when a user successfully joins a tenant room.

```javascript
{
  success: true,
  tenantId: "TENANT_ID"
}
```

### 5.2 tenant-left

Sent when a user leaves a tenant room.

```javascript
{
  success: true,
  tenantId: "TENANT_ID"
}
```

### 5.3 socket-error

Sent when authentication, tenant access or room joining fails.

```javascript
{
  message: "Error description"
}
```

### 5.4 presence-updated

Broadcast when users join, leave or disconnect from a tenant.

```javascript
{
  tenantId: "TENANT_ID",
  onlineUserIds: [
    "USER_ID_1",
    "USER_ID_2"
  ]
}
```

This event helps the frontend display online users.

## 6. Board Events

All board events are scoped to the relevant tenant room.

| Event | Description |
|---|---|
| board-created | A new board is created |
| board-updated | A board is updated |
| board-deleted | A board is deleted |

## 7. Column Events

All column events are scoped to the relevant tenant room.

| Event | Description |
|---|---|
| column-created | A new column is created |
| column-updated | A column is updated |
| column-deleted | A column is deleted |

## 8. Task Events

All task events are scoped to the relevant tenant room.

| Event | Description |
|---|---|
| task-created | A new task is created |
| task-updated | A task is updated |
| task-moved | A task is moved to another column |
| task-deleted | A task is deleted |

Task event payload:

```javascript
{
  success: true,
  task: {
    // Updated task information
  }
}
```

For task deletion, the payload contains the deleted task ID.

## 9. Membership Events

Membership notifications are sent to the affected user's private room.

| Event | Description |
|---|---|
| membership-created | User receives a new membership |
| membership-updated | User's membership is updated |
| membership-deleted | User's membership is deleted |
| tenant-access-revoked | User loses access to a tenant |

## 10. Security and Tenant Isolation

SyncBoard follows these security rules:

1. Socket connections require JWT authentication.
2. Users cannot join unauthorized tenant rooms.
3. Tenant events are emitted to tenant-specific rooms.
4. User notifications are emitted to private user rooms.
5. Membership status and role are checked before joining a tenant.
6. Unauthorized users cannot receive tenant room broadcasts.

## 11. Concurrency and Real-Time Updates

Task updates use version-based optimistic concurrency control.

If two users update the same task using an outdated version, the backend rejects the conflicting update.

Socket.IO broadcasts successful changes to other users in the tenant.

## 12. Presence Limitation

The current presence implementation uses active Socket.IO connections.

Presence is maintained in server memory through connected sockets. For a multi-server production deployment, a shared Socket.IO adapter such as Redis is recommended.

