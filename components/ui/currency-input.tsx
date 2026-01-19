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

    React.useEffect(() => {
      if (value !== undefined && value !== null && value !== "") {
        const num = typeof value === "string" ? parseFloat(value) : value;
        if (!isNaN(num)) {
          // Check if we need to update based on creating a temporary raw value from current display
          // This avoids overwriting user input while they type if the parent re-renders
          const currentRaw = displayValue.replace(/,/g, "");
          const currentNum = parseFloat(currentRaw);
          
          if (currentNum !== num) {
             setDisplayValue(new Intl.NumberFormat("en-IN", {
                maximumFractionDigits: 2,
             }).format(num));
          }
        }
      } else if (value === undefined || value === "") {
        // If external value is cleared, clear display, but be careful not to clear while typing 0 or "."
        // Ideally we only clear if it really changed to undefined
        if (displayValue !== "") { 
            const currentRaw = displayValue.replace(/,/g, "");
            if (currentRaw !== "") {
                 setDisplayValue("");
            }
        }
      }
      // We explicitly don't depend on displayValue to avoid cycles
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!isNaN(numberValue)) {
        setDisplayValue(new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
        }).format(numberValue));
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
