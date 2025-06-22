import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/settings';
import i18n from '@/lib/i18n';

/**
 * Component that synchronizes the i18n language with the language atom
 * This ensures that the stored language preference is applied on app startup
 */
export function LanguageSynchronizer() {
  const [language] = useAtom(languageAtom);

  useEffect(() => {
    // Only change language if it's different from current i18n language
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return null; // This component doesn't render anything
}
