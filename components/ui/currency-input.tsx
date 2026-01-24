"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number | string;
  onValueChange?: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    }).format(num);
  };

  React.useEffect(() => {
      if (value !== undefined && value !== null && value !== "") {
        const num = typeof value === "string" ? parseFloat(value) : value;
        if (!isNaN(num)) {
          // Always format the value when it changes from external source
          setDisplayValue(formatNumber(num));
        }
      } else if (value === undefined || value === "") {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow only valid number characters
      if (!/^[0-9,.]*$/.test(inputValue)) {
        return;
      }

      // Prevent multiple decimals
      if ((inputValue.match(/\./g) || []).length > 1) {
        return;
      }

      setDisplayValue(inputValue);

      const rawValue = inputValue.replace(/,/g, "");
      const numberValue = rawValue === "" ? undefined : parseFloat(rawValue);
      
      if (onValueChange) {
        onValueChange(isNaN(numberValue as number) ? undefined : numberValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const rawValue = displayValue.replace(/,/g, "");
      const numberValue = parseFloat(rawValue);
      if (!isNaN(numberValue) && numberValue !== 0) {
        setDisplayValue(formatNumber(numberValue));
      }
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
          ₹
        </div>
        <Input
          {...props}
          ref={ref}
          type="text"
          className={cn("pl-7", className)}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
