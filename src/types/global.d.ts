type ReportFormat = 'pdf' | 'csv' | 'json';
type ReportType = 'daily' | 'weekly' | 'monthly';

interface UserTokenPayload {
  id: string;
  email: string;
  role: Role;
}

type AppModules = 'auth' | 'user' | 'restaurant' | 'menu' | 'category' | 'audit_log' | 'order';

type PermittedAction = 'add' | 'view' | 'update' | 'delete';
type PermittedModule =
  | 'category'
  | 'menuItem'
  | 'restaurant'
  | 'user'
  | 'order'
  | 'permission'
  | 'permissionGroup';

type AdditionalPermissions = 'custom_permission';
type PermittedId = `${PermittedAction}:${PermittedModule}` | AdditionalPermissions;
