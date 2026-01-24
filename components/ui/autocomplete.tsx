"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, Loader2, X } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

import { useDebounce } from "@/lib/hooks/use-debounce";

export interface AutocompleteOption {
  id: string;
  label: string;
  subtitle?: string;
  imageUrl?: string;
}

export interface AutocompleteProps {
  value?: string;
  options: AutocompleteOption[];
  onSelect: (option: AutocompleteOption | null) => void;
  onSearch?: (term: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function Autocomplete({
  value,
  options,
  onSelect,
  onSearch,
  placeholder = "Search...",
  label,
  required = false,
  error,
  isLoading = false,
  disabled = false,
  className,
  emptyMessage = "No results found",
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [internalValue, setInternalValue] = useState<string | undefined>(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const onSearchRef = useRef(onSearch);
  
  // Update the ref when onSearch changes
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Derive selected option from value prop
  const selectedOption = useMemo(() => {
    const currentValue = value ?? internalValue;
    if (currentValue && options.length > 0) {
      return options.find((opt) => opt.id === currentValue) || null;
    }
    return null;
  }, [value, internalValue, options]);

  // Sync internal value when external value changes
  useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
      const option = options.find((opt) => opt.id === value);
      if (option) {
        setSearchTerm(option.label);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Only sync when external value changes

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  // Handle search with debounce
  useEffect(() => {
    const currentOnSearch = onSearchRef.current;
    if (currentOnSearch && debouncedSearchTerm && debouncedSearchTerm !== selectedOption?.label) {
      currentOnSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, selectedOption?.label]);

  const handleSelect = useCallback(
    (option: AutocompleteOption) => {
      setInternalValue(option.id);
      setSearchTerm(option.label);
      setIsOpen(false);
      onSelect(option);
      inputRef.current?.blur();
    },
    [onSelect]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setInternalValue(undefined);
      setSearchTerm("");
      setIsOpen(true);
      onSelect(null);
      inputRef.current?.focus();
    },
    [onSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    setFocusedIndex(-1);
    if (!value) {
      onSelect(null);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && options[focusedIndex]) {
        handleSelect(options[focusedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [focusedIndex]);

  const filteredOptions = options.filter((option) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      option.label.toLowerCase().includes(search) ||
      option.subtitle?.toLowerCase().includes(search) ||
      option.id.toLowerCase().includes(search)
    );
  });

  const displayOptions = onSearch ? options : filteredOptions;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "pl-10 pr-10 border-0 shadow-none bg-transparent",
              error && "border-red-500",
              selectedOption && "pr-10"
            )}
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            )}
            {selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-60 overflow-hidden"
            >
              {isLoading && displayOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : displayOptions.length > 0 ? (
                <ul
                  ref={listRef}
                  className="max-h-60 overflow-y-auto py-1"
                  role="listbox"
                >
                  {displayOptions.map((option, index) => (
                    <li
                      key={option.id}
                      role="option"
                      aria-selected={focusedIndex === index}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "px-4 py-2 cursor-pointer transition-colors flex items-center gap-3",
                        focusedIndex === index
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800",
                        selectedOption?.id === option.id && "bg-blue-100 dark:bg-blue-900/30"
                      )}
                    >
                      {option.imageUrl ? (
                        <div className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <Image
                            src={option.imageUrl}
                            alt={option.label}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {getInitials(option.label)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {option.label}
                        </div>
                        {option.subtitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {option.subtitle}
                          </div>
                        )}
                      </div>
                      {selectedOption?.id === option.id && (
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}


function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
