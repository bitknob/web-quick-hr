"use client";

import { useState, useEffect, useMemo } from "react";
import { getTranslations, Translations, setLanguage, getLanguage, Language } from "@/lib/i18n";

export function useTranslations(lang?: string): Translations {
  const [currentLang, setCurrentLang] = useState<Language>(getLanguage());

  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLang(getLanguage());
    };

    // Listen for language changes via custom event
    window.addEventListener("languagechange", handleLanguageChange);
    
    // Initial load
    handleLanguageChange();

    return () => {
      window.removeEventListener("languagechange", handleLanguageChange);
    };
  }, []);

  const translations = useMemo(() => {
    if (lang) {
      setLanguage(lang as Language);
      setCurrentLang(lang as Language);
    }
    return getTranslations(currentLang);
  }, [lang, currentLang]);

  return translations;
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(getLanguage());

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setLanguageState(lang);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("app-language", lang);
    }
    // Dispatch custom event to notify all components
    window.dispatchEvent(new Event("languagechange"));
  };

  useEffect(() => {
    // Load language from localStorage on mount
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("app-language") as Language | null;
      if (savedLang && savedLang !== language) {
        changeLanguage(savedLang);
      }
    }
  }, []);

  return { language, changeLanguage };
}

export function useT() {
  const translations = useTranslations();
  
  return (key: string): string => {
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== "string") {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    return value;
  };
}

