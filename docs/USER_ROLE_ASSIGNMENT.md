# User Role Assignment API - Integration Guide

## Overview

The User Role Assignment API has been successfully integrated into the web-quick-hr application. This guide provides information on how to use the API and the UI components.

## API Endpoints

All endpoints are available through the `authApi` service located at `/lib/api/auth.ts`.

### 1. Assign Role to User

Assigns a specific role to a user. Requires admin privileges.

**Function:** `authApi.assignRole(userId: string, role: string)`

**Parameters:**

- `userId` (string, required) - UUID of the user to assign the role to
- `role` (string, required) - Role to assign (must be a valid UserRole)

**Returns:** `Promise<ApiResponse<User>>`

**Example:**

```typescript
import { authApi } from "@/lib/api/auth";

try {
  const response = await authApi.assignRole("user-uuid-here", "company_admin");
  console.log("Role assigned:", response.response);
} catch (error) {
  console.error("Failed to assign role:", error);
}
```

**Required Permissions:**

- `super_admin` or `provider_admin` to assign any role
- Only `super_admin` can assign the `super_admin` role

---

### 2. Get User Role by User ID

Retrieves role information for a specific user by their user ID.

**Function:** `authApi.getUserRole(userId: string)`

**Parameters:**

- `userId` (string, required) - User UUID

**Returns:** `Promise<ApiResponse<User>>`

**Example:**

```typescript
import { authApi } from "@/lib/api/auth";

try {
  const response = await authApi.getUserRole("user-uuid-here");
  console.log("User role:", response.response.role);
} catch (error) {
  console.error("Failed to get user role:", error);
}
```

**Access Control:**

- Users can view their own role
- Admins can view any user's role

---

### 3. Get User Role by Email

Retrieves role information for a specific user by their email address.

**Function:** `authApi.getUserRoleByEmail(email: string)`

**Parameters:**

- `email` (string, required) - User email address

**Returns:** `Promise<ApiResponse<User>>`

**Example:**

```typescript
import { authApi } from "@/lib/api/auth";

try {
  const response = await authApi.getUserRoleByEmail("user@example.com");
  console.log("User role:", response.response.role);
} catch (error) {
  console.error("Failed to get user role:", error);
}
```

**Required Permissions:**

- `super_admin`, `provider_admin`, or `provider_hr_staff`

---

## Available Roles

The system supports the following roles (in hierarchical order):

1. **super_admin** - Full system access
2. **provider_admin** - Provider-level administration
3. **provider_hr_staff** - Provider HR operations
4. **hrbp** - HR Business Partner
5. **company_admin** - Company-level administration
6. **department_head** - Department management
7. **manager** - Team management
8. **employee** - Basic employee access

All roles are defined in the `UserRole` type at `/lib/types.ts`.

---

## UI Components

### User Role Assignment Page

**Location:** `/app/dashboard/user-roles/page.tsx`

**Route:** `/dashboard/user-roles`

**Features:**

- Search users by User ID or Email
- View current user role and details
- Assign new roles to users
- Visual role hierarchy display
- Permission-based access control
- Real-time validation and error handling

**Usage:**

1. Navigate to `/dashboard/user-roles`
2. Select search type (User ID or Email)
3. Enter search value and click "Search User"
4. Select desired role from the list
5. Click "Assign Role" to update

**Permissions Required:**

- Must be logged in as `super_admin` or `provider_admin`
- Only `super_admin` can assign `super_admin` role

---

### User Role Card Component

**Location:** `/components/user-roles/UserRoleCard.tsx`

**Purpose:** Reusable component for displaying user information and managing roles in a compact card format.

**Props:**

```typescript
interface UserRoleCardProps {
  user: User;
  onAssignRole: (userId: string, role: UserRole) => void;
  canAssignSuperAdmin: boolean;
  loading: boolean;
}
```

**Example Usage:**

```typescript
import UserRoleCard from "@/components/user-roles/UserRoleCard";

<UserRoleCard
  user={userObject}
  onAssignRole={handleAssignRole}
  canAssignSuperAdmin={currentUser?.role === "super_admin"}
  loading={isLoading}
/>;
```

---

## Error Handling

All API calls return standardized error responses:

```typescript
interface ApiError {
  header: {
    responseCode: number;
    responseMessage: string;
    responseDetail: string;
  };
  response: null;
}
```

**Common Error Codes:**

- **400** - Invalid request (e.g., invalid user ID format)
- **403** - Insufficient permissions
- **404** - User not found
- **500** - Internal server error

**Example Error Handling:**

```typescript
import { AxiosError } from "axios";
import { ApiError } from "@/lib/api-client";

try {
  await authApi.assignRole(userId, role);
} catch (error) {
  const axiosError = error as AxiosError<ApiError>;
  const errorMessage =
    axiosError.response?.data?.header?.responseMessage || "An error occurred";
  console.error(errorMessage);
}
```

---

## Best Practices

### 1. Principle of Least Privilege

Always assign the minimum role necessary for the user to perform their job.

### 2. Validate Before Assigning

Check if the user already has the desired role before making the API call:

```typescript
if (user.role === newRole) {
  console.log("User already has this role");
  return;
}
```

### 3. Handle Permissions Gracefully

Always check user permissions before showing role assignment UI:

```typescript
const canAssignRoles =
  currentUser?.role === "super_admin" || currentUser?.role === "provider_admin";

if (!canAssignRoles) {
  // Show permission denied message
  return;
}
```

### 4. Provide User Feedback

Always show loading states and success/error messages:

```typescript
setLoading(true);
try {
  await authApi.assignRole(userId, role);
  setMessage({ type: "success", text: "Role assigned successfully" });
} catch (error) {
  setMessage({ type: "error", text: "Failed to assign role" });
} finally {
  setLoading(false);
}
```

### 5. Log Role Changes

The API automatically logs all role changes for audit purposes. No additional logging is required on the frontend.

---

## Integration Checklist

- [x] API endpoints added to `authApi` service
- [x] User Role Assignment page created
- [x] UserRoleCard component created
- [x] TypeScript types defined
- [x] Error handling implemented
- [x] Permission checks implemented
- [x] UI with modern design and animations
- [x] Documentation created

---

## Testing

### Manual Testing Steps

1. **Test Search by User ID:**

   - Navigate to `/dashboard/user-roles`
   - Select "User ID" search type
   - Enter a valid user UUID
   - Verify user information is displayed

2. **Test Search by Email:**

   - Select "Email" search type
   - Enter a valid email address
   - Verify user information is displayed

3. **Test Role Assignment:**

   - Search for a user
   - Select a different role
   - Click "Assign Role"
   - Verify success message and updated role

4. **Test Permission Checks:**

   - Log in as different user roles
   - Verify only admins can access the page
   - Verify only super_admin can assign super_admin role

5. **Test Error Handling:**
   - Search for non-existent user
   - Try to assign role without searching
   - Verify appropriate error messages

---

## API Configuration

The API base URL is configured in `/lib/api-client.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9400";
```

Make sure to set the `NEXT_PUBLIC_API_URL` environment variable in your `.env` file:

```
NEXT_PUBLIC_API_URL=http://localhost:9400
```

---

## Support

For issues or questions:

1. Check the API documentation
2. Review error messages in the browser console
3. Check the network tab for API request/response details
4. Verify authentication token is valid
5. Ensure user has required permissions

---

## Future Enhancements

Potential improvements for future versions:

1. **Bulk Role Assignment** - Assign roles to multiple users at once
2. **Role History** - View history of role changes for a user
3. **Role Templates** - Create and apply role templates
4. **Advanced Filters** - Filter users by role, verification status, etc.
5. **Export Functionality** - Export user role data to CSV/Excel
6. **Role Analytics** - Dashboard showing role distribution and statistics

---

## Changelog

### Version 1.0.0 (2026-01-11)

- Initial implementation of User Role Assignment API
- Created User Role Assignment page
- Created UserRoleCard component
- Added comprehensive error handling
- Implemented permission-based access control
- Added modern UI with gradients and animations
