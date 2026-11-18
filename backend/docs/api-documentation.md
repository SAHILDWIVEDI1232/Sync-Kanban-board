
# SyncBoard API Documentation

Base URL: `http://localhost:5000/api`

Authentication: JWT stored in HTTP-only cookie.

## 1. Authentication APIs

Base route: `/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register user |
| POST | `/login` | Login user |
| POST | `/logout` | Logout user |
| GET | `/me` | Get logged-in user |

## 2. Organization APIs

Base route: `/organizations`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create organization |
| GET | `/` | Get user's organizations |
| GET | `/:id` | Get organization details |
| PUT | `/:id` | Update organization |
| DELETE | `/:id` | Delete organization |

## 3. Tenant APIs

Base route: `/tenants`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create tenant |
| GET | `/organization/:organizationId` | Get organization tenants |
| GET | `/:id` | Get tenant details |
| PUT | `/:id` | Update tenant |
| DELETE | `/:id` | Delete tenant |

## 4. Board APIs

Base route: `/boards`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create board |
| GET | `/tenant/:tenantId` | Get tenant boards |
| GET | `/:id` | Get board details |
| PUT | `/:id` | Update board |
| DELETE | `/:id` | Delete board |

## 5. Column APIs

Base route: `/columns`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create column |
| GET | `/board/:boardId` | Get board columns |
| GET | `/:id` | Get column details |
| PUT | `/:id` | Update column |
| DELETE | `/:id` | Delete column |

## 6. Task APIs

Base route: `/tasks`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create task |
| GET | `/board/:boardId` | Get board tasks |
| GET | `/:id` | Get task details |
| PUT | `/:id` | Update task |
| PATCH | `/:id/move` | Move task |
| DELETE | `/:id` | Delete task |

Task updates use version-based optimistic concurrency control.

## 7. Membership APIs

Base route: `/memberships`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Add organization or tenant member |
| GET | `/organization/:organizationId` | Get organization memberships |
| GET | `/tenant/:tenantId` | Get tenant memberships |
| PUT | `/:id` | Update membership |
| DELETE | `/:id` | Delete membership |

## 8. Activity Log APIs

Base route: `/activity-logs`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tenant/:tenantId` | Get tenant activity logs |

## 9. Authorization

All protected APIs require a valid login session.

Roles:

- ORG_ADMIN: Organization-level administration.
- TENANT_ADMIN: Tenant-level administration.
- MEMBER: Regular tenant member.

The backend checks membership and tenant access before allowing protected operations.

## 10. Error Responses

Example:

```json
{
  "message": "You are not authorized to perform this action"
}
```

Common HTTP status codes:

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | Access denied |
| 404 | Resource not found |
| 409 | Version conflict |
| 500 | Server error |

## 11. Security

- JWT-based authentication.
- HTTP-only authentication cookies.
- Role-based access control.
- Tenant-level data isolation.
- Version-based task conflict handling.
