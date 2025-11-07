import path from 'node:path';

const ADMIN_EMAIL = 'admin@demo.com';

const OWNER_EMAIL = 'owner-1@demo.com';
const OWNER_2_EMAIL = 'owner-2@demo.com';

const CUSTOMER_EMAIL = 'customer-1@demo.com';
const CUSTOMER_2_EMAIL = 'customer-2@demo.com';

const MOCK_IMAGE_PATH = path.join(__dirname, '../public/avatar.jpg');
const MOCK_BINARY_PATH = path.join(__dirname, '../public/DINNextLTArabic.ttf');

export {
  ADMIN_EMAIL,
  CUSTOMER_2_EMAIL,
  CUSTOMER_EMAIL,
  MOCK_IMAGE_PATH,
  OWNER_2_EMAIL,
  OWNER_EMAIL,
  MOCK_BINARY_PATH,
};
