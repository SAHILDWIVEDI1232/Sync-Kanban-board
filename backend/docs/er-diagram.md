
# SyncBoard – Entity Relationship Diagram

## Database Collections

SyncBoard uses MongoDB with the following collections:

1. User
2. Organization
3. Tenant
4. Membership
5. Board
6. Column
7. Task
8. ActivityLog

## ER Diagram

```mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ TENANT : contains
    ORGANIZATION ||--o{ MEMBERSHIP : manages
    TENANT ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ BOARD : owns
    TENANT ||--o{ BOARD : contains
    BOARD ||--o{ COLUMN : contains
    COLUMN ||--o{ TASK : contains
    BOARD ||--o{ TASK : contains
    USER ||--o{ TASK : creates
    USER ||--o{ TASK : updates
    USER ||--o{ TASK : assigned
    TENANT ||--o{ ACTIVITYLOG : records
    ORGANIZATION ||--o{ ACTIVITYLOG : records
    USER ||--o{ ACTIVITYLOG : performs

    USER {
        ObjectId _id PK
        string name
        string email
        string password
    }

    ORGANIZATION {
        ObjectId _id PK
        string name
        ObjectId createdBy FK
    }

    TENANT {
        ObjectId _id PK
        string name
        ObjectId organizationId FK
    }

    MEMBERSHIP {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId organizationId FK
        ObjectId tenantId FK
        string role
        string status
    }

    BOARD {
        ObjectId _id PK
        string title
        ObjectId organizationId FK
        ObjectId tenantId FK
        ObjectId createdBy FK
    }

    COLUMN {
        ObjectId _id PK
        string title
        ObjectId boardId FK
        ObjectId tenantId FK
        number position
    }

    TASK {
        ObjectId _id PK
        string title
        ObjectId boardId FK
        ObjectId columnId FK
        ObjectId tenantId FK
        ObjectId assignedTo FK
        ObjectId createdBy FK
        number position
        number version
    }

    ACTIVITYLOG {
        ObjectId _id PK
        ObjectId organizationId FK
        ObjectId tenantId FK
        ObjectId userId FK
        string action
        string entityType
        ObjectId entityId
    }
```

## Relationship Explanation

- One organization can contain multiple tenants.
- One user can have multiple memberships.
- Membership defines the user's role and access status.
- One tenant can contain multiple boards.
- One board can contain multiple columns and tasks.
- One column can contain multiple tasks.
- Tasks can be assigned to users.
- Activity logs record actions performed within a tenant.

## Multi-Tenant Isolation

Every tenant-specific board, column and task is associated with a `tenantId`.

The backend validates tenant membership before allowing access to tenant data.
