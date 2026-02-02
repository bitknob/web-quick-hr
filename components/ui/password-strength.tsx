"use client";

import { useState, useMemo } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  regex: RegExp;
  text: string;
  met: boolean;
}

export function PasswordStrengthMeter({ password, showRequirements = true }: PasswordStrengthMeterProps) {
  const requirements = useMemo(() => [
    { regex: /.{8,}/, text: "At least 8 characters", met: false },
    { regex: /[A-Z]/, text: "One uppercase letter", met: false },
    { regex: /[a-z]/, text: "One lowercase letter", met: false },
    { regex: /\d/, text: "One number", met: false },
    { regex: /[!@#$%^&*(),.?":{}|<>]/, text: "One special character", met: false },
  ].map(req => ({
    ...req,
    met: req.regex.test(password)
  })), [password]);

  const getStrength = () => {
    const metCount = requirements.filter(req => req.met).length;
    if (metCount === 0) return { strength: 0, color: "bg-gray-200", text: "Very Weak" };
    if (metCount <= 2) return { strength: 25, color: "bg-red-500", text: "Weak" };
    if (metCount <= 3) return { strength: 50, color: "bg-orange-500", text: "Fair" };
    if (metCount <= 4) return { strength: 75, color: "bg-yellow-500", text: "Good" };
    return { strength: 100, color: "bg-green-500", text: "Strong" };
  };

  const strength = getStrength();

  return (
    <div className="space-y-2">
      {/* Strength Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${strength.strength}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength.strength === 0 ? "text-gray-500" :
          strength.strength <= 25 ? "text-red-500" :
          strength.strength <= 50 ? "text-orange-500" :
          strength.strength <= 75 ? "text-yellow-500" :
          "text-green-500"
        }`}>
          {strength.text}
        </span>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1">
          {requirements.map((requirement, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {requirement.met ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <X className="w-3 h-3 text-gray-400" />
              )}
              <span className={requirement.met ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                {requirement.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  showStrengthMeter?: boolean;
  showRequirements?: boolean;
  className?: string;
  id?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "Enter password",
  error,
  showStrengthMeter = true,
  showRequirements = true,
  className = "",
  id = "password"
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          } ${className}`}
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isVisible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      
      {showStrengthMeter && value && (
        <PasswordStrengthMeter 
          password={value} 
          showRequirements={showRequirements}
        />
      )}
    </div>
  );
}
