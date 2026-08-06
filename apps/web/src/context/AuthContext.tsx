import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { UserAccount, AuthResponse, ApiResponse } from '@laps/shared';
import { apiClient } from '../lib/api';
import { setAccessToken } from '../lib/tokenStore';

export interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, passwordPlain: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  refreshProfile: () => Promise<UserAccount | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (): Promise<UserAccount | null> => {
    try {
      const res = await apiClient.get<ApiResponse<{ user: UserAccount }>>('/auth/me');
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
        return res.data.data.user;
      }
      return null;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
      const newToken = res.data?.data?.accessToken;
      if (newToken) {
        setAccessToken(newToken);
        await fetchProfile();
        return true;
      }
      setAccessToken(null);
      setUser(null);
      return false;
    } catch {
      setAccessToken(null);
      setUser(null);
      return false;
    }
  }, [fetchProfile]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await refreshSession();
      if (isMounted) {
        setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  const login = async (identifier: string, passwordPlain: string): Promise<void> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      identifier,
      password: passwordPlain,
    });
    const token = res.data?.data?.accessToken;
    if (token) {
      setAccessToken(token);
      if (res.data.data.user) {
        setUser(res.data.data.user);
      } else {
        await fetchProfile();
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const logoutAll = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout-all');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        logoutAll,
        refreshSession,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
