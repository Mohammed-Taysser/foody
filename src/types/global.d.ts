interface UserTokenPayload {
  id: string;
  email: string;
  role: Role;
}

type AppModules = 'auth' | 'user' | 'restaurant' | 'menu' | 'category';
