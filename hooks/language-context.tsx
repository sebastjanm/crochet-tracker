import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage === 'sl' || savedLanguage === 'en' || savedLanguage === 'ru' || savedLanguage === 'de') {
        setLanguage(savedLanguage);
        i18n.locale = savedLanguage;
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem('app_language', newLanguage);
      setLanguage(newLanguage);
      i18n.locale = newLanguage;
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string, options?: any) => {
    return i18n.t(key, options);
  };

  return {
    language,
    changeLanguage,
    t,
    isLoading,
  };
});