import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Translations } from '../types';
import { translations, LanguageCode, languages } from '../translations';

// Create the context
export const LanguageContext = createContext<LanguageContextType>({
  language: 'ko',
  setLanguage: () => {},
  translations: translations.ko,
  languages: languages,
});

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  translations: Translations;
  languages: { code: string; name: string }[];
}

// Provider component
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // Try to get the stored language from localStorage
    const storedLanguage = localStorage.getItem('language');
    // Validate that the stored language is a valid LanguageCode
    if (storedLanguage && ['en', 'ko', 'zh', 'th'].includes(storedLanguage)) {
      return storedLanguage as LanguageCode;
    }
    return 'ko'; // Default to Korean if no valid language is stored
  });

  // Update translations when language changes
  const [translationsData, setTranslationsData] = useState<Translations>(translations[language]);

  const setLanguage = (newLanguage: LanguageCode) => {
    console.log("Setting language to:", newLanguage);
    localStorage.setItem('language', newLanguage);
    setLanguageState(newLanguage);
  };

  // Update translations when language changes
  useEffect(() => {
    console.log("Language changed in context, updating translations:", language);
    setTranslationsData(translations[language]);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      translations: translationsData,
      languages: languages 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
