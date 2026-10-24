/**
 * GlucoTwin Authentication Context
 * Manages JWT session state, Firebase Authentication, Firestore profile synchronization,
 * localStorage persistence, and authorization guards.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';
import { auth, db, googleProvider, testFirestoreConnection } from '../firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
          if (userData) {
            setUser(userData);
            localStorage.setItem('glucotwin_user', JSON.stringify(userData));
          }
        } catch {
          // If token verification returned an error and not a firebase session
          if (!storedToken.startsWith('fb-') && storedToken.length < 50) {
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const clinicianUser: User = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Clinician',
            email: fbUser.email || 'clinician@hospital.org',
            role: 'doctor',
            firebase_uid: fbUser.uid,
          };

          // Save / merge profile to Firestore users collection
          try {
            await setDoc(
              doc(db, 'users', fbUser.uid),
              {
                userId: fbUser.uid,
                name: clinicianUser.name,
                email: clinicianUser.email,
                role: 'doctor',
                createdAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (fsErr) {
            console.warn('[FIRESTORE] Clinician profile sync notice:', fsErr);
          }

          setUser(clinicianUser);
          setToken(idToken);
          localStorage.setItem('glucotwin_user', JSON.stringify(clinicianUser));
          localStorage.setItem('glucotwin_token', idToken);
        } catch (err) {
          console.warn('[AUTH] Error resolving Firebase ID token:', err);
        }
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
    const idToken = await fbUser.getIdToken();

    const clinicianUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Dr. ' + (fbUser.email?.split('@')[0] || 'Clinician'),
      email: fbUser.email || 'doctor@hospital.org',
      role: 'doctor',
      firebase_uid: fbUser.uid,
    };

    // Sync to Firestore
    try {
      await setDoc(
        doc(db, 'users', fbUser.uid),
        {
          userId: fbUser.uid,
          name: clinicianUser.name,
          email: clinicianUser.email,
          role: 'doctor',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('[FIRESTORE] Syncing Google user to Firestore:', fsErr);
    }

    setUser(clinicianUser);
    setToken(idToken);
    localStorage.setItem('glucotwin_user', JSON.stringify(clinicianUser));
    localStorage.setItem('glucotwin_token', idToken);
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
