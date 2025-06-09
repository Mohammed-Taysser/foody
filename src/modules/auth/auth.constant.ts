import { Role } from '@prisma/client';

const PERMISSION_ACTIONS: PermittedAction[] = ['add', 'view', 'update', 'delete'];
const PERMISSION_MODULES: PermittedModule[] = [
  'category',
  'menuItem',
  'restaurant',
  'user',
  'permission',
  'permissionGroup',
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
    'view:menuItem',
    'add:menuItem',
    'update:menuItem',
    'delete:menuItem',
    'view:restaurant',
    'add:restaurant',
    'update:restaurant',
    'delete:restaurant',
    'view:user',
    'add:user',
    'update:user',
    'delete:user',
    'view:permission',
    'add:permission',
    'update:permission',
    'delete:permission',
    'view:permissionGroup',
    'add:permissionGroup',
    'update:permissionGroup',
    'delete:permissionGroup',
  ],

  'Category Manager': ['view:category', 'add:category', 'update:category', 'delete:category'],
  'Restaurant Manager': [
    'view:restaurant',
    'add:restaurant',
    'update:restaurant',
    'delete:restaurant',
  ],
  'Menu Manager': ['view:menuItem', 'add:menuItem', 'update:menuItem', 'delete:menuItem'],
};

const DEFAULT_ROLE_PERMISSIONS: {
  [key in Role]: {
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
    groups: [],
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
