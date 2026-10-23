/**
 * GlucoTwin Authentication Context
 * Manages JWT session state, Firebase Authentication, persistence in localStorage, and auto-validation.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';
import { auth, googleProvider, testFirestoreConnection } from '../firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
  firebase_uid?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  quickDemoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('glucotwin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('glucotwin_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and validate session on mount
  useEffect(() => {
    testFirestoreConnection().catch(console.warn);

    const verifySession = async () => {
      const storedToken = localStorage.getItem('glucotwin_token');
      if (storedToken) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
          localStorage.setItem('glucotwin_user', JSON.stringify(userData));
        } catch {
          // If stored token failed and not a firebase mock session, clear it
          if (!storedToken.startsWith('fb-')) {
            localStorage.removeItem('glucotwin_token');
            localStorage.removeItem('glucotwin_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    verifySession();

    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const clinicianUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Clinician',
          email: fbUser.email || 'clinician@hospital.org',
          role: 'doctor',
          firebase_uid: fbUser.uid,
        };
        const fbToken = `fb-${fbUser.uid}`;
        setUser(clinicianUser);
        setToken(fbToken);
        localStorage.setItem('glucotwin_user', JSON.stringify(clinicianUser));
        localStorage.setItem('glucotwin_token', fbToken);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    const { access_token, user: userData } = data;
    localStorage.setItem('glucotwin_token', access_token);
    localStorage.setItem('glucotwin_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const clinicianUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Dr. ' + (fbUser.email?.split('@')[0] || 'Specialist'),
      email: fbUser.email || 'doctor@hospital.org',
      role: 'doctor',
      firebase_uid: fbUser.uid,
    };
    const fbToken = `fb-${fbUser.uid}`;
    setUser(clinicianUser);
    setToken(fbToken);
    localStorage.setItem('glucotwin_user', JSON.stringify(clinicianUser));
    localStorage.setItem('glucotwin_token', fbToken);
  };

  const register = async (name: string, email: string, password: string, role = 'doctor') => {
    const data = await authAPI.register(name, email, password, role);
    const { access_token, user: userData } = data;
    if (access_token) {
      localStorage.setItem('glucotwin_token', access_token);
      localStorage.setItem('glucotwin_user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('glucotwin_token');
    localStorage.removeItem('glucotwin_user');
    setToken(null);
    setUser(null);
    firebaseSignOut(auth).catch(console.warn);
  };

  const quickDemoLogin = async () => {
    await login('doctor@demo.com', 'Demo@1234');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        quickDemoLogin,
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
