import { translations, Translations, Language } from "./translations";

const defaultLanguage: Language = "en";

let currentLanguage: Language = defaultLanguage;

// Load language from localStorage if available
if (typeof window !== "undefined") {
  const savedLang = localStorage.getItem("app-language") as Language | null;
  if (savedLang && translations[savedLang]) {
    currentLanguage = savedLang;
  }
}

export function setLanguage(lang: Language): void {
  if (translations[lang]) {
    currentLanguage = lang;
    if (typeof window !== "undefined") {
      localStorage.setItem("app-language", lang);
    }
  } else {
    console.warn(`Language "${lang}" not found, falling back to "en".`);
    currentLanguage = "en";
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: string, lang?: Language): string {
  const language = lang || currentLanguage;
  const translation = translations[language];
  if (!translation) {
    console.warn(`Language "${language}" not found, falling back to "en".`);
    return t(key, "en");
  }
  const keys = key.split(".");
  let value: unknown = translation;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
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
}

export function getTranslations(lang?: Language): Translations {
  const language = lang || currentLanguage;
  const translation = translations[language];
  if (!translation) {
    return translations.en!;
  }
  return translation;
}

export { translations };

