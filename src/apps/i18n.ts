import path from 'path';

import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';

import logger from '@/utils/logger.utils';

i18next
  .use(Backend) // Connects the file system backend
  .use(middleware.LanguageDetector) // Enables automatic language detection
  .init({
    lng: 'en',
    fallbackLng: 'en',
    preload: ['en', 'ar'], // Preload languages
    ns: ['errors'], // Namespaces for translations
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: path.join(process.cwd(), 'locales', '{{lng}}', '{{ns}}.json'),
    },
    detection: {
      order: ['querystring', 'cookie', 'header'],
      caches: false,
    },
    saveMissing: true, // logs missing keys
    missingKeyHandler: function (lng, ns, key) {
      logger.warn(`[i18n] MISSING: ${lng}:${ns}:${key}`);
      return key;
    },
  });

export default i18next;
