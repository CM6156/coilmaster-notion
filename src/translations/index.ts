
import { Translations } from '../types';
import { enTranslations } from './en';
import { koTranslations } from './ko';
import { zhTranslations } from './zh';
import { thTranslations } from './th';

export type LanguageCode = 'en' | 'ko' | 'zh' | 'th';

export const translations: Record<LanguageCode, Translations> = {
  en: enTranslations,
  ko: koTranslations,
  zh: zhTranslations,
  th: thTranslations,
};

export const languages = [
  { code: "ko", name: "한국어" },
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
  { code: "th", name: "ไทย" }
];
