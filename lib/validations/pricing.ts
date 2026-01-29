import { z } from "zod";
import { PricingPlanFeature } from "@/lib/types/pricing";

const pricingPlanFeatureSchema: z.ZodType<PricingPlanFeature> = z.object({
  name: z.string().min(1, "Feature name is required").max(100, "Feature name must be less than 100 characters"),
  included: z.boolean(),
});

export const createPricingPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  monthlyPrice: z.number().min(0, "Monthly price must be non-negative (INR)"),
  yearlyPrice: z.number().min(0, "Yearly price must be non-negative (INR)"),
  features: z.array(pricingPlanFeatureSchema).min(1, "At least one feature is required"),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0, "Sort order must be non-negative").optional().default(0),
});

export const updatePricingPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  monthlyPrice: z.number().min(0, "Monthly price must be non-negative (INR)").optional(),
  yearlyPrice: z.number().min(0, "Yearly price must be non-negative (INR)").optional(),
  features: z.array(pricingPlanFeatureSchema).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0, "Sort order must be non-negative").optional(),
});

export type CreatePricingPlanSchema = z.infer<typeof createPricingPlanSchema>;
export type UpdatePricingPlanSchema = z.infer<typeof updatePricingPlanSchema>;
