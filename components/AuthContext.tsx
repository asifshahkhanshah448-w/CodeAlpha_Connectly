'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/client/src/api/apiClient';

export interface UserType {
  id: string;
  _id: string;
  username: string;
  email: string;
  name: string;
  bio: string;
  avatar: string;
  location?: string;
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

interface AuthContextType {
  user: UserType | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    name: string;
    bio?: string;
    avatar?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<UserType>) => void;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    let isMounted = true;
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('connectly_token') : null;
    if (!storedToken) {
      Promise.resolve().then(() => {
        if (isMounted) setIsLoading(false);
      });
      return;
    }

    api.setToken(storedToken);
    api
      .getMe()
      .then((res) => {
        if (isMounted) {
          if (res.success && res.user) {
            setUser(res.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem('connectly_token');
            setToken(null);
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          localStorage.removeItem('connectly_token');
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: { identifier: string; password: string }) => {
    const res = await api.login(credentials);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      api.setToken(res.token);
      setIsAuthModalOpen(false);
    } else {
      throw new Error(res.message || 'Login failed.');
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    name: string;
    bio?: string;
    avatar?: string;
  }) => {
    const res = await api.register(data);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      api.setToken(res.token);
      setIsAuthModalOpen(false);
    } else {
      throw new Error(res.message || 'Registration failed.');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    api.removeToken();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData: Partial<UserType>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
