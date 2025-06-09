interface UserTokenPayload {
  id: string;
  email: string;
  role: Role;
}

type AppModules = 'auth' | 'user' | 'restaurant' | 'menu' | 'category';

type PermittedAction = 'add' | 'view' | 'update' | 'delete';
type PermittedModule =
  | 'category'
  | 'menuItem'
  | 'restaurant'
  | 'user'
  | 'permission'
  | 'permissionGroup';

type AdditionalPermissions = 'custom_permission';
type PermittedId = `${PermittedAction}:${PermittedModule}` | AdditionalPermissions;
