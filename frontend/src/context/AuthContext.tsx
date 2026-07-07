import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  isAnonymous: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  workspaceName: string;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  login: (token: string, workspaceName: string) => void;
  register: (token: string, workspaceName: string) => void;
  loginAsGuest: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [workspaceName, setWorkspaceName] = useState<string>(() => localStorage.getItem('workspaceName') || 'My Workspace');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(() => localStorage.getItem('isAnonymous') === 'true');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('workspaceName', workspaceName);
      localStorage.setItem('isAnonymous', isAnonymous ? 'true' : 'false');
      
      // Setup mock or actual user profile on mount
      setUser({
        id: isAnonymous ? 'guest-id' : 'user-id',
        name: isAnonymous ? 'Guest User' : 'Workspace Member',
        email: isAnonymous ? 'guest@vibeui.com' : 'user@vibeui.com',
        isAnonymous,
      });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('workspaceName');
      localStorage.removeItem('isAnonymous');
      setUser(null);
    }
  }, [token, workspaceName, isAnonymous]);

  const login = (newToken: string, name: string) => {
    setIsAnonymous(false);
    setWorkspaceName(name);
    setToken(newToken);
  };

  const register = (newToken: string, name: string) => {
    setIsAnonymous(false);
    setWorkspaceName(name);
    setToken(newToken);
  };

  const loginAsGuest = (newToken: string) => {
    setIsAnonymous(true);
    setWorkspaceName('Guest Workspace');
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setIsAnonymous(false);
    setWorkspaceName('My Workspace');
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      workspaceName,
      isAnonymous,
      isAuthenticated: !!token,
      login,
      register,
      loginAsGuest,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
