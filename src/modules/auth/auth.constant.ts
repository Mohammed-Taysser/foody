import { UserRole } from '@prisma/client';

const PERMISSION_ACTIONS: PermittedAction[] = [
  'add',
  'view',
  'update',
  'delete',
  'export',
  'import',
];
const PERMISSION_MODULES: PermittedModule[] = [
  'category',
  'menuItem',
  'restaurant',
  'user',
  'permission',
  'permissionGroup',
  'order',
];

const PERMISSION_IDS: PermittedId[] = PERMISSION_ACTIONS.flatMap((action) =>
  PERMISSION_MODULES.map((module) => `${action}:${module}` as PermittedId)
);

const PERMISSION_GROUPS: Record<string, PermittedId[]> = {
  SuperAdmin: [
    'view:category',
    'add:category',
    'update:category',
    'delete:category',
    'export:category',
    'import:category',
    'view:menuItem',
    'add:menuItem',
    'update:menuItem',
    'delete:menuItem',
    'export:menuItem',
    'import:menuItem',
    'view:restaurant',
    'add:restaurant',
    'update:restaurant',
    'delete:restaurant',
    'export:restaurant',
    'import:restaurant',
    'view:user',
    'add:user',
    'update:user',
    'delete:user',
    'export:user',
    'import:user',
    'view:permission',
    'add:permission',
    'update:permission',
    'delete:permission',
    'export:permission',
    'import:permission',
    'view:permissionGroup',
    'add:permissionGroup',
    'update:permissionGroup',
    'delete:permissionGroup',
    'export:permissionGroup',
    'import:permissionGroup',
    'view:order',
    'add:order',
    'update:order',
    'delete:order',
    'export:order',
    'import:order',
  ],

  'Category Manager': [
    'view:category',
    'add:category',
    'update:category',
    'delete:category',
    'export:category',
    'import:category',
  ],
  'Restaurant Manager': [
    'view:restaurant',
    'add:restaurant',
    'update:restaurant',
    'delete:restaurant',
    'export:restaurant',
    'import:restaurant',
  ],
  'Menu Manager': [
    'view:menuItem',
    'add:menuItem',
    'update:menuItem',
    'delete:menuItem',
    'export:menuItem',
    'import:menuItem',
  ],

  'Order Manager': [
    'view:order',
    'add:order',
    'update:order',
    'delete:order',
    'export:order',
    'import:order',
  ],
};

const DEFAULT_ROLE_PERMISSIONS: {
  [key in UserRole]: {
    groups: (keyof typeof PERMISSION_GROUPS)[];
    permissions: PermittedId[];
  };
} = {
  ADMIN: {
    groups: ['SuperAdmin'],
    permissions: [], // SuperAdmin already has all permissions
  },
  OWNER: {
    groups: ['Category Manager', 'Menu Manager', 'Restaurant Manager'],
    permissions: [], // Permissions are inherited from groups
  },
  CUSTOMER: {
    groups: ['Order Manager'],
    permissions: ['view:menuItem'], // Standalone permission
  },
};

export {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_ACTIONS,
  PERMISSION_GROUPS,
  PERMISSION_IDS,
  PERMISSION_MODULES,
};
