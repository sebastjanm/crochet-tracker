import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import en from '@/translations/en';
import sl from '@/translations/sl';
import ru from '@/translations/ru';
import de from '@/translations/de';

const i18n = new I18n({
  en,
  sl,
  ru,
  de,
});

i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

export type Language = 'en' | 'sl' | 'ru' | 'de';

// Supported languages for matching device locale
const SUPPORTED_LANGUAGES: Language[] = ['en', 'sl', 'ru', 'de'];

/**
 * Detect the best matching language from device settings.
 * Checks the user's preferred locales and returns the first supported match.
 * Falls back to English if no match found.
 */
function detectDeviceLanguage(): Language {
  try {
    const locales = getLocales();

    for (const locale of locales) {
      // Get the language code (e.g., "de" from "de-DE", "sl" from "sl-SI")
      const langCode = locale.languageCode?.toLowerCase();

      if (langCode && SUPPORTED_LANGUAGES.includes(langCode as Language)) {
        if (__DEV__) console.log('[Language] Detected device language:', langCode);
        return langCode as Language;
      }
    }

    if (__DEV__) console.log('[Language] No supported language found, using English');
    return 'en';
  } catch (error) {
    if (__DEV__) console.error('[Language] Error detecting device language:', error);
    return 'en';
  }
}

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');

      if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as Language)) {
        // User has a saved language preference
        setLanguage(savedLanguage as Language);
        i18n.locale = savedLanguage;
        if (__DEV__) console.log('[Language] Loaded saved language:', savedLanguage);
      } else {
        // First launch: detect device language
        const detectedLanguage = detectDeviceLanguage();
        setLanguage(detectedLanguage);
        i18n.locale = detectedLanguage;
        // Save it so we don't detect again next time
        await AsyncStorage.setItem('app_language', detectedLanguage);
        if (__DEV__) console.log('[Language] First launch, set to:', detectedLanguage);
      }
    } catch (error) {
      if (__DEV__) console.error('[Language] Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem('app_language', newLanguage);
      setLanguage(newLanguage);
      i18n.locale = newLanguage;
      if (__DEV__) console.log('[Language] Changed to:', newLanguage);
    } catch (error) {
      if (__DEV__) console.error('[Language] Error saving language:', error);
    }
  };

  const t = (key: string, options?: Record<string, unknown>) => {
    return i18n.t(key, options);
  };

  return {
    language,
    changeLanguage,
    t,
    isLoading,
    availableLanguages: SUPPORTED_LANGUAGES,
  };
});
