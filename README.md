# Quick HR - Enterprise HR Management System

A modern, enterprise-level HR management web application built with Next.js, React, and TypeScript. Quick HR provides comprehensive human resources management capabilities including employee management, company management, department organization, leave management, approvals, and attendance tracking.

## Features

### Core Functionality
- **Employee Management**: Create, view, update, and manage employee records with profile images, job details, and organizational hierarchy
- **Company Management**: Manage multiple companies with company profiles, codes, descriptions, and status tracking
- **Department Management**: Organize employees into departments with department heads and company-scoped access
- **Leave Management**: Request, track, and manage employee leave requests with approval workflows
- **Approvals System**: Multi-step approval workflows for various request types (leave, employee changes, transfers, etc.)
- **Attendance Tracking**: Monitor and track employee attendance records
- **Notifications**: Real-time notification system for important updates and approvals
- **Role-Based Access Control**: Dynamic menu system based on user roles

### User Roles
- Super Admin
- Provider Admin
- Provider HR Staff
- HRBP (HR Business Partner)
- Company Admin
- Department Head
- Manager
- Employee

### Technical Features
- **Modern UI/UX**: Clean, responsive design with dark mode support
- **Dynamic Menu**: Role-based navigation menu fetched from API
- **Form Validation**: Robust form validation using react-hook-form and zod
- **State Management**: Zustand for global state management
- **Animations**: Smooth animations powered by framer-motion
- **Type Safety**: Full TypeScript support for type-safe development
- **API Integration**: RESTful API integration with axios
- **Search & Filter**: Advanced search and filtering capabilities
- **Pagination**: Efficient data pagination for large datasets

## Tech Stack

### Frontend
- **Framework**: Next.js 16.0.10 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.1
- **Styling**: Tailwind CSS 4
- **Form Handling**: React Hook Form 7.68.0 + Zod 4.2.1
- **State Management**: Zustand 5.0.9
- **HTTP Client**: Axios 1.13.2
- **Icons**: Lucide React 0.561.0
- **Animations**: Framer Motion 12.23.26

### Development Tools
- ESLint for code linting
- TypeScript for type checking
- Next.js built-in optimization

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web-quick-hr
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:9400
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:9420`

2. Build for production:
```bash
npm run build
```

3. Start production server:
```bash
npm start
```

## Project Structure

```
web-quick-hr/
├── app/                      # Next.js App Router pages
│   ├── dashboard/           # Dashboard pages
│   │   ├── companies/       # Company management
│   │   ├── employees/       # Employee management
│   │   ├── departments/     # Department management
│   │   ├── leave/           # Leave management
│   │   ├── approvals/       # Approval workflows
│   │   ├── attendance/      # Attendance tracking
│   │   ├── notifications/   # Notification center
│   │   ├── profile/         # User profile
│   │   └── settings/        # Application settings
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── layout/              # Layout components (Header, Sidebar)
│   ├── ui/                  # Reusable UI components
│   └── auth/                # Authentication components
├── lib/                     # Utility libraries
│   ├── api/                 # API client modules
│   ├── store/               # Zustand stores
│   ├── hooks/               # Custom React hooks
│   ├── types.ts             # TypeScript type definitions
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
```

## API Integration

The application integrates with a RESTful backend API. All API endpoints are configured through the `lib/api-client.ts` module. Key API modules include:

- **Authentication API** (`lib/api/auth.ts`): Login, signup, token management, menu fetching
- **Employees API** (`lib/api/employees.ts`): Employee CRUD operations, search, hierarchy
- **Companies API** (`lib/api/companies.ts`): Company management
- **Departments API** (`lib/api/departments.ts`): Department management
- **Approvals API** (`lib/api/approvals.ts`): Approval workflow management
- **Notifications API** (`lib/api/notifications.ts`): Notification management

## Key Components

### UI Components
- `Button`: Reusable button component with variants
- `Input`: Form input component
- `Card`: Card container component
- `Select`: Dropdown select component
- `Autocomplete`: Searchable autocomplete with image support
- `Dropdown`: Dropdown menu component
- `Skeleton`: Loading skeleton components
- `Toast`: Toast notification system

### Layout Components
- `Sidebar`: Dynamic sidebar navigation with role-based menu
- `Header`: Top navigation bar with search and user menu
- `DashboardLayout`: Main dashboard layout wrapper

## Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations
- Use TypeScript interfaces for type safety

### State Management
- Use Zustand for global state (auth, theme)
- Use React hooks (useState, useEffect) for local state
- Use React Hook Form for form state management

### API Calls
- All API calls go through the centralized `apiClient`
- Handle errors gracefully with user-friendly messages
- Show loading states during API calls
- Use toast notifications for user feedback

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API base URL (default: http://localhost:9400)

## Contributing

1. Follow the existing code style and patterns
2. Ensure TypeScript types are properly defined
3. Test all functionality before submitting
4. Handle errors appropriately
5. Maintain consistent UI/UX patterns

## License

Private project
