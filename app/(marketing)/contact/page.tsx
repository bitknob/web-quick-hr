"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore"];
const roles = ["HR Manager", "IT Administrator", "Founder/CEO", "Finance Manager", "Other"];
const levels = ["C-Level", "VP", "Director", "Manager", "Individual Contributor"];
const interests = ["Payroll", "Attendance", "Performance Management", "Full Suite", "Other"];

export default function ContactPage() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "India",
    phone: "",
    company: "",
    role: "",
    level: "",
    interest: "",
    newsletter: false,
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.firstName) newErrors.firstName = true;
    if (!formData.lastName) newErrors.lastName = true;
    if (!formData.email) newErrors.email = true;
    if (!formData.company) newErrors.company = true;
    if (!formData.role) newErrors.role = true;
    if (!formData.level) newErrors.level = true;
    if (!formData.interest) newErrors.interest = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
       addToast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    addToast({
      title: "Message Sent",
      description: "Thanks for reaching out! Our sales team will contact you shortly.",
      variant: "success",
    });
    
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      country: "India",
      phone: "",
      company: "",
      role: "",
      level: "",
      interest: "",
      newsletter: false,
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-12 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Say hello to our sales team.
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            All fields are required.
          </p>
        </motion.div>

        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label 
                  htmlFor="firstName" 
                  className={`block text-sm font-medium mb-1 transition-colors ${
                      errors.firstName ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                  }`}
              >
                  First name
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName) setErrors({...errors, firstName: false});
                }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    errors.firstName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
              />
            </div>
            <div>
              <label 
                  htmlFor="lastName" 
                  className={`block text-sm font-medium mb-1 transition-colors ${
                      errors.lastName ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                  }`}
              >
                  Last name
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (errors.lastName) setErrors({...errors, lastName: false});
                }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    errors.lastName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
              />
            </div>
          </div>

          <div className="relative">
            <label 
                htmlFor="email" 
                className={`block text-sm font-medium mb-1 transition-colors ${
                    errors.email ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                }`}
            >
                Business email
            </label>
            <div className="relative">
                <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({...errors, email: false});
                    }}
                    className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.email ? "border-red-500 pr-10" : "border-gray-300 dark:border-gray-600"
                    }`}
                />
                {errors.email && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5 pointer-events-none" />
                )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country/Territory
            </label>
            <div className="relative">
                <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                >
                {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                    {/* Optional check icon if valid, or standard chevron */}
                    <Check className="w-4 h-4 text-green-600" />
                </div>
            </div>
          </div>

          <div>
             <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone number
             </label>
             <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
             />
          </div>

          <div className="relative">
            <label 
                htmlFor="company" 
                className={`block text-sm font-medium mb-1 transition-colors ${
                    errors.company ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                }`}
            >
                Company name
            </label>
            <input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => {
                    setFormData({ ...formData, company: e.target.value });
                    if (errors.company) setErrors({...errors, company: false});
                }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    errors.company ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
            />
          </div>

          <div className="relative">
             <label className={`block text-sm font-medium mb-1 ${errors.role ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
                Functional role
             </label>
             <select
                value={formData.role}
                onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value });
                    if (errors.role) setErrors({...errors, role: false});
                }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none ${
                    errors.role ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
             >
                <option value="">-- Select role --</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
             </select>
          </div>

          <div className="relative">
             <label className={`block text-sm font-medium mb-1 ${errors.level ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
                Job level
             </label>
             <select
                value={formData.level}
                onChange={(e) => {
                    setFormData({ ...formData, level: e.target.value });
                    if (errors.level) setErrors({...errors, level: false});
                }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none ${
                     errors.level ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
             >
                <option value="">-- Select level --</option>
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
             </select>
          </div>

          <div className="relative">
             <label className={`block text-sm font-medium mb-1 ${errors.interest ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
                Area of interest
             </label>
             <div className="relative">
                <select
                    value={formData.interest}
                    onChange={(e) => {
                        setFormData({ ...formData, interest: e.target.value });
                        if (errors.interest) setErrors({...errors, interest: false});
                    }}
                    className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none ${
                        errors.interest ? "border-red-500 pr-10" : "border-gray-300 dark:border-gray-600"
                    }`}
                >
                    <option value="">-- Select area --</option>
                    {interests.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                 {errors.interest && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                        <AlertCircle className="text-red-500 w-5 h-5" />
                    </div>
                )}
             </div>
          </div>

          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center h-5">
                <input
                id="newsletter"
                type="checkbox"
                checked={formData.newsletter}
                onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                />
            </div>
            <label htmlFor="newsletter" className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">
                Yes, please email me with occasional updates about products, services and events from Quick HR. I can unsubscribe at any time.
            </label>
          </div>

          <div className="pt-4">
            <Button 
                type="submit" 
                size="lg" 
                className="w-full text-base py-6 font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-full"
                isLoading={isSubmitting}
            >
                Contact Sales
            </Button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            Personal data will be handled in accordance with the Quick HR <Link href="#" className="underline hover:text-gray-900 dark:hover:text-white">Privacy Statement</Link>.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
