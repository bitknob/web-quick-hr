# User Role Assignment - Navigation & Integration Guide

## ✅ What's New

We've enhanced the User Role Assignment feature with seamless navigation from the Employee Details page!

## 🎯 How Users Navigate to Role Assignment

### Method 1: From Employee Details Page (NEW!)

1. **Navigate to any employee**: Go to `/dashboard/employees/[id]`
2. **View User Role Information**: A new blue gradient card displays:
   - User ID
   - Current Role (with badge)
   - Email Verification Status
   - Account Creation Date
3. **Click "Manage User Role"** button
4. **Automatically redirected** to `/dashboard/user-roles` with:
   - User information pre-filled
   - Search automatically executed
   - User details displayed
   - Ready to assign new role

### Method 2: Direct Navigation

1. Navigate directly to `/dashboard/user-roles`
2. Manually search by User ID or Email
3. Select role and assign

## 🔄 Navigation Flow

```
Employee List Page
    ↓
Click on Employee
    ↓
Employee Details Page
    ↓
[User Role Information Card Displayed]
    ↓
Click "Manage User Role" Button
    ↓
User Roles Page (Auto-populated & Searched)
    ↓
Select New Role
    ↓
Assign Role
    ↓
Success! ✓
```

## 📦 Files Modified

### 1. Employee Details Page (`/app/dashboard/employees/[id]/page.tsx`)

**Added:**

- Import `authApi` and `User` type
- Import `Shield` and `UserCog` icons
- State for user information (`user`, `isLoadingUser`)
- `fetchUserRole()` function to get user role data
- New "User Role Information" card with:
  - User ID display
  - Current role badge
  - Email verification status
  - Account creation date
  - "Manage User Role" button
  - Info banner with instructions

**Features:**

- Automatically fetches user role when employee is loaded
- Beautiful gradient blue card design
- Responsive grid layout
- Loading state while fetching user data
- Graceful handling when no user account exists

### 2. User Roles Page (`/app/dashboard/user-roles/page.tsx`)

**Added:**

- Import `useSearchParams` from Next.js
- URL parameter detection (`userId`, `email`)
- `handleSearchWithValue()` helper function
- Auto-search functionality when URL parameters present
- 500ms delay to ensure component is ready

**Features:**

- Accepts `?userId=xxx` or `?email=xxx` URL parameters
- Automatically populates search field
- Automatically triggers search
- Displays user information immediately
- Ready for role assignment

## 🎨 UI Enhancements

### Employee Details Page - User Role Card

**Design:**

- **Background**: Gradient from blue-50 to indigo-50 (light mode)
- **Border**: Blue-200 border for visual distinction
- **Layout**: 2x2 grid of information boxes
- **Icons**: Shield icon for title, UserCog for button
- **Info Banner**: Blue background with helpful text
- **Loading State**: Spinner animation while fetching
- **Error State**: Yellow warning banner if no user account

**Information Displayed:**

1. **User ID**: Monospace font for UUID
2. **Current Role**: Gradient badge (blue to indigo)
3. **Email Verified**: Green/Red indicator with text
4. **Account Created**: Formatted date

### Navigation Button

**"Manage User Role" Button:**

- Outline variant for subtle appearance
- Small size for compact design
- UserCog icon for visual clarity
- Positioned in card header (top right)
- Navigates with URL parameters

## 🔗 URL Parameter Format

When clicking "Manage User Role" from employee page:

```
/dashboard/user-roles?userId={userId}&email={email}
```

**Example:**

```
/dashboard/user-roles?userId=abc123-def456-ghi789&email=john.doe@company.com
```

## 💡 User Experience Flow

### Scenario: HR Admin Wants to Change Employee Role

1. **Start**: HR admin views employee list
2. **Select**: Clicks on "John Doe"
3. **View**: Employee details page loads
4. **Notice**: Blue "User Role Information" card shows current role: "employee"
5. **Action**: Clicks "Manage User Role" button
6. **Navigate**: Redirected to role assignment page
7. **Auto-load**: User information automatically loaded
8. **Review**: Current role displayed: "employee"
9. **Select**: Chooses new role: "manager"
10. **Assign**: Clicks "Assign Role"
11. **Success**: Role updated to "manager"
12. **Return**: Can navigate back to employee details to verify

## 🎯 Benefits

### For Users:

- **Seamless Navigation**: One-click access to role management
- **Context Preserved**: User information automatically loaded
- **Time Saved**: No manual searching required
- **Clear Visual**: Role information prominently displayed
- **Intuitive Flow**: Natural progression from employee to role management

### For Developers:

- **URL Parameters**: Clean, RESTful approach
- **Reusable Components**: Modular design
- **Type Safety**: Full TypeScript support
- **Error Handling**: Graceful degradation
- **Maintainable**: Clear separation of concerns

## 🔐 Security & Permissions

- **View Role Info**: Any authenticated user can view employee details
- **Manage Roles**: Only `super_admin` and `provider_admin` can assign roles
- **Super Admin Role**: Only `super_admin` can assign `super_admin` role
- **API Protection**: All endpoints require authentication
- **Permission Checks**: UI disables buttons for unauthorized users

## 📱 Responsive Design

- **Desktop**: 2-column grid for information boxes
- **Tablet**: Responsive grid adjusts to screen size
- **Mobile**: Single column layout for better readability
- **Touch-Friendly**: Large click targets for buttons

## 🧪 Testing Checklist

- [x] Navigate to employee details page
- [x] Verify User Role Information card displays
- [x] Verify user role data loads correctly
- [x] Click "Manage User Role" button
- [x] Verify navigation to role assignment page
- [x] Verify URL parameters are set correctly
- [x] Verify auto-search executes
- [x] Verify user information displays
- [x] Assign new role
- [x] Verify success message
- [x] Navigate back to employee details
- [x] Verify role updated in User Role Information card

## 🎨 Visual Preview

The employee details page now features:

1. **Header Section**: Employee name and ID
2. **User Role Information Card** (NEW!):
   - Gradient blue background
   - Shield icon
   - 4 information boxes
   - "Manage User Role" button
   - Info banner
3. **Employee Information Card**: Standard employee form

## 🚀 Quick Start

### To View User Role on Employee Page:

```bash
# Navigate to any employee
/dashboard/employees/{employee-id}

# The User Role Information card will automatically display
```

### To Manage User Role from Employee Page:

```bash
# 1. View employee details
/dashboard/employees/{employee-id}

# 2. Click "Manage User Role" button
# Automatically navigates to:
/dashboard/user-roles?userId={user-id}&email={email}

# 3. Role assignment page loads with user pre-selected
# 4. Select new role and assign
```

## 📊 Data Flow

```
Employee API
    ↓
Employee Data (includes userId)
    ↓
User Role API (using userId)
    ↓
User Data (includes role, verification, etc.)
    ↓
Display in UI
    ↓
"Manage User Role" Button
    ↓
Navigate with URL Parameters
    ↓
Role Assignment Page
    ↓
Auto-search using URL Parameters
    ↓
Display User & Allow Role Assignment
```

## ✨ Summary

The User Role Assignment feature is now fully integrated into the employee workflow! Users can:

1. ✅ View user role information directly on employee details page
2. ✅ Navigate seamlessly to role management with one click
3. ✅ Have user information automatically loaded
4. ✅ Assign roles without manual searching
5. ✅ Return to employee page to verify changes

This creates a smooth, intuitive experience for HR administrators managing user roles across the organization!
