import path from 'path';

import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';

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
  });

export default i18next;
