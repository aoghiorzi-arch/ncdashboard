import { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'admin' | 'member' | 'stakeholder';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USER: User = {
  id: '1',
  name: 'Alex Rivera',
  email: 'alex@agile.io',
  role: 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER);

  const hasRole = (...roles: UserRole[]) =>
    user !== null && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null), hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
