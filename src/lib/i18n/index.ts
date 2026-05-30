import en from "./en.json";
import ar from "./ar.json";

export const translations = {
	en,
	ar,
} as const;

export type TranslationKeys = typeof translations.en & Record<string, any>;

// i18n configuration for English and Arabic support
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
	en: "English",
	ar: "العربية",
};

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
	en: "ltr",
	ar: "rtl",
};

export function getDirection(locale: string): "ltr" | "rtl" {
	return localeDirection[locale as Locale] || "ltr";
}
