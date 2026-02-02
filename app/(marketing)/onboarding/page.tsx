"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PasswordInput } from "@/components/ui/password-strength";
import { Check, AlertCircle, Building2, Briefcase, User } from "lucide-react";
import { onboardingApi } from "@/lib/api/onboarding";
import { OnboardingRequest, OnboardingUserData, OnboardingCompanyData, OnboardingEmployeeData } from "@/lib/types/onboarding";
import { useAuthStore } from "@/lib/store/auth-store";
import { subscriptionApi } from "@/lib/api/subscriptions";

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscriptionId");
  const { setUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  // Form states
  const [userData, setUserData] = useState<OnboardingUserData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    address: "",
  });

  const [companyData, setCompanyData] = useState<OnboardingCompanyData>({
    name: "",
    code: "",
    description: "",
    industry: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  const [employeeData, setEmployeeData] = useState<OnboardingEmployeeData>({
    department: "Management",
    designation: "Company Administrator",
    workLocation: "Office",
    employmentType: "full-time",
    dateOfJoining: new Date().toISOString().split('T')[0],
    workEmail: "",
    workPhone: "",
  });

  useEffect(() => {
    if (!subscriptionId) {
      setError("Missing subscription information. Please start from the pricing page.");
      return;
    }

    // Check onboarding status first
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch(`http://localhost:9400/api/onboarding/status/${subscriptionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        console.log("Onboarding status response:", data);
        
        if (data.response && data.response.onboarding && data.response.onboarding.isOnboarded) {
          // User is already onboarded, show their existing data or redirect
          console.log("User is already onboarded");
          
          // Pre-populate form with existing data
          const { user, employee, company } = data.response;
          
          if (user && employee) {
            setUserData(prev => ({
              ...prev,
              firstName: employee.firstName || prev.firstName,
              lastName: employee.lastName || prev.lastName,
              email: user.email || prev.email,
              phone: employee.workPhone || prev.phone,
            }));
          }
          
          if (company) {
            setCompanyData(prev => ({
              ...prev,
              name: company.name || prev.name,
              code: company.code || prev.code,
              email: employee?.workEmail || prev.email,
            }));
          }
          
          if (employee) {
            setEmployeeData(prev => ({
              ...prev,
              department: employee.department || prev.department,
              designation: employee.designation || prev.designation,
              workEmail: employee.workEmail || prev.workEmail,
              workPhone: employee.workPhone || prev.workPhone,
            }));
          }
          
          // Show onboarding completion message with progress
          const onboardingProgress = data.response.onboarding;
          setDialogMessage(`You have already completed onboarding (${onboardingProgress.progress}% complete). Your information has been pre-filled below. You can update any details if needed.`);
          setShowSuccessDialog(true);
        } else {
          // User is not onboarded, read customer data from URL parameters and pre-populate form
          const firstName = searchParams.get("firstName");
          const lastName = searchParams.get("lastName");
          const email = searchParams.get("email");
          const phone = searchParams.get("phone");
          const companyName = searchParams.get("companyName");
          const companyCode = searchParams.get("companyCode");
          const companyEmail = searchParams.get("companyEmail");

          // Pre-populate user data if available
          if (firstName || lastName || email || phone) {
            setUserData(prev => ({
              ...prev,
              firstName: firstName || prev.firstName,
              lastName: lastName || prev.lastName,
              email: email || prev.email,
              phone: phone || prev.phone,
            }));
          }

          // Pre-populate company data if available
          if (companyName || companyCode || companyEmail) {
            setCompanyData(prev => ({
              ...prev,
              name: companyName || prev.name,
              code: companyCode || prev.code,
              email: companyEmail || prev.email,
            }));
          }

          console.log("Pre-populated form with URL parameters:", {
            firstName, lastName, email, phone, companyName, companyCode, companyEmail
          });
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        
        // Fallback to URL parameters if API fails
        const firstName = searchParams.get("firstName");
        const lastName = searchParams.get("lastName");
        const email = searchParams.get("email");
        const phone = searchParams.get("phone");
        const companyName = searchParams.get("companyName");
        const companyCode = searchParams.get("companyCode");
        const companyEmail = searchParams.get("companyEmail");

        if (firstName || lastName || email || phone) {
          setUserData(prev => ({
            ...prev,
            firstName: firstName || prev.firstName,
            lastName: lastName || prev.lastName,
            email: email || prev.email,
            phone: phone || prev.phone,
          }));
        }

        if (companyName || companyCode || companyEmail) {
          setCompanyData(prev => ({
            ...prev,
            name: companyName || prev.name,
            code: companyCode || prev.code,
            email: companyEmail || prev.email,
          }));
        }
      }
    };

    checkOnboardingStatus();
  }, [subscriptionId, searchParams]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(userData.firstName && userData.lastName && userData.email && userData.password && userData.password.length >= 6);
      case 2:
        return !!(companyData.name && companyData.code && companyData.email);
      case 3:
        return true; // Employee data is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!subscriptionId || !validateStep(2)) return;

    setIsLoading(true);
    setError(null);

    try {
      const onboardingData: OnboardingRequest = {
        subscriptionId: parseInt(subscriptionId),
        userData,
        companyData,
        employeeData,
      };

      const response = await onboardingApi.completeOnboarding(onboardingData);
      
      // Create user object that matches the expected User type
      const userForAuthStore = {
        id: response.user.id,
        email: response.user.email,
        phoneNumber: response.user.phone,
        role: "company_admin" as const, // Default role for onboarding
        isEmailVerified: true,
        mustChangePassword: false,
        profileImageUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Set user in auth store
      setUser(userForAuthStore);
      
      // Store token and company data in localStorage for now
      // TODO: Update auth store to handle company data and tokens
      localStorage.setItem("accessToken", response.token);
      localStorage.setItem("company", JSON.stringify(response.company));

      // Show success dialog
      setDialogMessage("Your account has been successfully set up! You will be redirected to your dashboard.");
      setShowSuccessDialog(true);
      
      // Redirect to dashboard after dialog confirmation
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (error: unknown) {
      setDialogMessage((error as Error).message || "Failed to complete onboarding. Please try again.");
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !subscriptionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/pricing")}>
              Back to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Complete Your Setup
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Let&apos;s get your Quick HR account configured in just a few steps
            </p>
            
            {/* Progress */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Form Steps */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {currentStep === 1 && <User className="w-6 h-6 text-blue-600" />}
                  {currentStep === 2 && <Building2 className="w-6 h-6 text-blue-600" />}
                  {currentStep === 3 && <Briefcase className="w-6 h-6 text-blue-600" />}
                  <CardTitle>
                    {currentStep === 1 && "Personal Information"}
                    {currentStep === 2 && "Company Details"}
                    {currentStep === 3 && "Employee Information"}
                  </CardTitle>
                </div>
                <CardDescription>
                  {currentStep === 1 && "Tell us about yourself to create your account"}
                  {currentStep === 2 && "Set up your company profile"}
                  {currentStep === 3 && "Configure your employee role (optional)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: User Information */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={userData.firstName}
                        onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={userData.lastName}
                        onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                        placeholder="Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Business Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        placeholder="john@company.com"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Business email only (no Gmail, Yahoo, etc.)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <PasswordInput
                        value={userData.password}
                        onChange={(value) => setUserData({ ...userData, password: value })}
                        placeholder="Create a strong password"
                        showStrengthMeter={true}
                        showRequirements={true}
                        id="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        placeholder="+919876543210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={userData.dateOfBirth}
                        onChange={(e) => setUserData({ ...userData, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={userData.gender} 
                        onChange={(e) => setUserData({ ...userData, gender: e.target.value as 'male' | 'female' | 'other' })}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={userData.address}
                        onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                        placeholder="123 Main Street, City"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Company Information */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={companyData.name}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                        placeholder="Acme Corporation"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyCode">Company Code *</Label>
                      <Input
                        id="companyCode"
                        value={companyData.code}
                        onChange={(e) => setCompanyData({ ...companyData, code: e.target.value.toUpperCase() })}
                        placeholder="ACME2024"
                        required
                      />
                      <p className="text-xs text-gray-500">Unique identifier for your company (min. 2 characters, no maximum limit)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Company Email *</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                        placeholder="contact@company.com"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Business email only (no Gmail, Yahoo, etc.)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={companyData.website}
                        onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                        placeholder="https://company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyDescription">Description</Label>
                      <Textarea
                        id="companyDescription"
                        value={companyData.description}
                        onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                        placeholder="Brief description of your company"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Company Address</Label>
                      <Textarea
                        id="address"
                        value={companyData.address}
                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                        placeholder="456 Business Ave, Tech City"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={companyData.city}
                        onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                        placeholder="Bangalore"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={companyData.state}
                        onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                        placeholder="Karnataka"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={companyData.country}
                        onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                        placeholder="India"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={companyData.postalCode}
                        onChange={(e) => setCompanyData({ ...companyData, postalCode: e.target.value })}
                        placeholder="560001"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Employee Information */}
                {currentStep === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={employeeData.department}
                        onChange={(e) => setEmployeeData({ ...employeeData, department: e.target.value })}
                        placeholder="Management"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input
                        id="designation"
                        value={employeeData.designation}
                        onChange={(e) => setEmployeeData({ ...employeeData, designation: e.target.value })}
                        placeholder="Company Administrator"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workLocation">Work Location</Label>
                      <Input
                        id="workLocation"
                        value={employeeData.workLocation}
                        onChange={(e) => setEmployeeData({ ...employeeData, workLocation: e.target.value })}
                        placeholder="Office"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select 
                        value={employeeData.employmentType} 
                        onChange={(e) => setEmployeeData({ ...employeeData, employmentType: e.target.value as 'full-time' | 'part-time' | 'contract' | 'intern' })}
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfJoining">Date of Joining</Label>
                      <Input
                        id="dateOfJoining"
                        type="date"
                        value={employeeData.dateOfJoining}
                        onChange={(e) => setEmployeeData({ ...employeeData, dateOfJoining: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workEmail">Work Email</Label>
                      <Input
                        id="workEmail"
                        type="email"
                        value={employeeData.workEmail || userData.email}
                        onChange={(e) => setEmployeeData({ ...employeeData, workEmail: e.target.value })}
                        placeholder="john@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workPhone">Work Phone</Label>
                      <Input
                        id="workPhone"
                        value={employeeData.workPhone || userData.phone}
                        onChange={(e) => setEmployeeData({ ...employeeData, workPhone: e.target.value })}
                        placeholder="+919876543210"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-3">
                    {currentStep < totalSteps ? (
                      <Button
                        onClick={handleNext}
                        disabled={!validateStep(currentStep)}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={!validateStep(2) || isLoading}
                      >
                        {isLoading ? "Setting up your account..." : "Complete Setup"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Success Dialog */}
      <ConfirmDialog
        open={showSuccessDialog}
        title="Setup Complete!"
        message={dialogMessage}
        confirmText="Continue to Dashboard"
        onConfirm={() => {
          setShowSuccessDialog(false);
          router.push("/dashboard");
        }}
        onOpenChange={(open) => !open && setShowSuccessDialog(false)}
      />

      {/* Error Dialog */}
      <ConfirmDialog
        open={showErrorDialog}
        title="Setup Failed"
        message={dialogMessage}
        confirmText="Try Again"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          setShowErrorDialog(false);
          setError(null);
        }}
        onOpenChange={(open) => !open && setShowErrorDialog(false)}
      />
    </>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto"></div>
        </div>
      </div>
    }>
      <OnboardingPageContent />
    </Suspense>
  );
}
