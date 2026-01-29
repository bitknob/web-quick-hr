# Pricing Plans API Implementation

This document outlines the complete frontend implementation for the Pricing Plans API as specified.

## Overview

The Pricing Plans API provides endpoints to manage subscription pricing plans for the HRM system. The frontend implementation includes:

- TypeScript types and interfaces
- Validation schemas using Zod
- API client with full CRUD operations
- React components with loading and error states
- INR currency formatting

## Implementation Files

### 1. Types and Interfaces
**File:** `/lib/types/pricing.ts`

Defines all TypeScript interfaces for the API:
- `PricingPlan` - Main pricing plan data structure
- `PricingPlanFeature` - Individual feature structure
- `CreatePricingPlanRequest` - Request type for creating plans
- `UpdatePricingPlanRequest` - Request type for updating plans
- `PricingPlansResponse` - Response type for multiple plans
- `PricingPlanResponse` - Response type for single plan
- `ApiResponse` - Generic API response structure

### 2. Validation Schemas
**File:** `/lib/validations/pricing.ts`

Zod validation schemas for:
- `createPricingPlanSchema` - Validates plan creation requests
- `updatePricingPlanSchema` - Validates plan update requests

All prices are validated as INR (non-negative numbers).

### 3. API Client
**File:** `/lib/api/pricing.ts`

Complete API client implementation with:
- `getPricingPlans()` - Fetch all plans (with activeOnly filter)
- `getPricingPlan(id)` - Fetch specific plan by ID
- `createPricingPlan(plan)` - Create new plan (admin only)
- `updatePricingPlan(id, plan)` - Update existing plan (admin only)
- `deletePricingPlan(id)` - Delete plan (admin only)
- `togglePricingPlanStatus(id)` - Toggle active status (admin only)
- `formatPrice(price)` - Format price as INR currency
- `validatePricingPlan(plan)` - Client-side validation helper

### 4. Frontend Integration
**File:** `/app/(marketing)/pricing/page.tsx`

Updated pricing page with:
- Dynamic data fetching from API
- Loading skeleton states
- Error handling with fallback to static data
- INR currency display
- Responsive design maintained

## API Endpoints

### Base URL
```
/api/pricing-plans
```

### Available Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/pricing-plans` | Get all pricing plans | No |
| GET | `/api/pricing-plans?id={id}` | Get specific plan | No |
| POST | `/api/pricing-plans` | Create new plan | Yes (Admin) |
| PUT | `/api/pricing-plans/{id}` | Update plan | Yes (Admin) |
| DELETE | `/api/pricing-plans/{id}` | Delete plan | Yes (Admin) |
| PATCH | `/api/pricing-plans/{id}/toggle` | Toggle status | Yes (Admin) |

## Data Model

### PricingPlan

```typescript
interface PricingPlan {
  id: number;
  name: string;
  description: string;
  monthlyPrice: number; // INR
  yearlyPrice: number; // INR
  features: PricingPlanFeature[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

### PricingPlanFeature

```typescript
interface PricingPlanFeature {
  name: string;
  included: boolean;
}
```

## Usage Examples

### Fetching Pricing Plans

```typescript
import { pricingApi } from '@/lib/api/pricing';

// Get all active plans
const plans = await pricingApi.getPricingPlans(true);

// Get specific plan
const plan = await pricingApi.getPricingPlan(1);

// Format price
const formattedPrice = pricingApi.formatPrice(2499); // "₹2,499"
```

### Creating a Pricing Plan (Admin)

```typescript
const newPlan = await pricingApi.createPricingPlan({
  name: "Professional",
  description: "For growing businesses",
  monthlyPrice: 6499,
  yearlyPrice: 64990,
  features: [
    { name: "Up to 100 employees", included: true },
    { name: "Advanced analytics", included: true }
  ],
  isActive: true,
  sortOrder: 2
});
```

### Updating a Pricing Plan (Admin)

```typescript
const updatedPlan = await pricingApi.updatePricingPlan(1, {
  monthlyPrice: 2999,
  yearlyPrice: 29990
});
```

### Client-Side Validation

```typescript
const errors = pricingApi.validatePricingPlan({
  name: "Test Plan",
  monthlyPrice: -100, // This will cause an error
  yearlyPrice: 1200,
  features: []
});

// errors will contain: ["Monthly price must be non-negative", "At least one feature is required"]
```

## Error Handling

The API client includes comprehensive error handling:

- **Network Errors**: Caught and logged to console
- **Validation Errors**: Client-side validation before API calls
- **API Errors**: Proper error response handling
- **Fallback Data**: Static plans used when API is unavailable

## Currency Formatting

All prices are formatted as INR using the `formatPrice` helper:

```typescript
pricingApi.formatPrice(2499); // "₹2,499"
pricingApi.formatPrice(64999); // "₹64,999"
```

## Backend Implementation Notes

The backend should implement the following:

1. **Database Schema**: Pricing plans table with JSONB for features
2. **Authentication**: Admin role validation for protected endpoints
3. **Validation**: Server-side validation matching client schemas
4. **Error Responses**: Consistent error format as specified
5. **Sorting**: Plans ordered by `sortOrder` ascending, then by name

## Port Configuration

The API is configured to run on port **9404** as specified in the documentation.

## Security Considerations

- All admin endpoints require authentication
- Input validation on both client and server
- Rate limiting recommended for public endpoints
- HTTPS required for production

## Testing

The implementation includes:

- TypeScript type safety
- Zod validation schemas
- Error boundary handling
- Loading states for better UX
- Fallback data for resilience

## Future Enhancements

Potential improvements:
- Real-time updates for pricing changes
- Caching strategy for pricing data
- A/B testing for pricing displays
- Multi-currency support
- Promo code integration
