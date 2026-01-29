"use client";

import { useState } from "react";
import { Building2, Edit, Trash2, Users, Calendar, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Company } from "@/lib/types";
import { companiesApi } from "@/lib/api/companies";
import { useToast } from "@/components/ui/toast";

interface CompanyCardProps {
  company: Company;
  onEdit?: (company: Company) => void;
  onDelete?: (company: Company) => void;
  onView?: (company: Company) => void;
  showActions?: boolean;
}

export function CompanyCard({ 
  company, 
  onEdit, 
  onDelete, 
  onView, 
  showActions = true 
}: CompanyCardProps) {
  const [imageError, setImageError] = useState(false);
  const { addToast } = useToast();

  const handleImageError = () => {
    setImageError(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const isExpiringSoon = companiesApi.isSubscriptionExpiringSoon(company.subscriptionEndsAt);
  const daysUntilExpiry = companiesApi.getDaysUntilExpiry(company.subscriptionEndsAt);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with profile image */}
      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-4 left-4">
          {company.profileImageUrl && !imageError ? (
            <img
              src={company.profileImageUrl}
              alt={company.name}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white/90 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          )}
        </div>
        
        {/* Status badge */}
        <div className="absolute top-4 right-4">
          <Badge className={getStatusColor(company.status)}>
            {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {company.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Code: {company.code}
          </p>
          {company.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
              {company.description}
            </p>
          )}
        </div>

        {/* Subscription Status */}
        {company.subscriptionStatus && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Subscription
              </span>
              <Badge className={companiesApi.getSubscriptionStatusColor(company.subscriptionStatus)}>
                {companiesApi.formatSubscriptionStatus(company.subscriptionStatus)}
              </Badge>
            </div>
            
            {company.subscriptionEndsAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Ends: {new Date(company.subscriptionEndsAt).toLocaleDateString()}
                </span>
                {isExpiringSoon && (
                  <Badge className="text-orange-600 bg-orange-100 border-orange-600">
                    {daysUntilExpiry} days left
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* HRBP */}
        {company.hrbpId && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>HRBP Assigned</span>
            </div>
          </div>
        )}

        {/* Warning for expired/expiring subscriptions */}
        {company.subscriptionStatus === 'expired' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Subscription Expired</span>
            </div>
          </div>
        )}

        {isExpiringSoon && company.subscriptionStatus !== 'expired' && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Subscription expires in {daysUntilExpiry} days
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(company)}
                className="flex-1"
              >
                View Details
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(company)}
                className="flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(company)}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
