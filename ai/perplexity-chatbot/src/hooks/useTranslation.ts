'use client';

import { useTheme } from './useTheme';
import { getTranslation, type Translations } from '@/lib/translations';

export const useTranslation = () => {
  const { language } = useTheme();

  const t = (key: keyof Translations): string => {
    return getTranslation(language, key);
  };

  return { t, language };
};
