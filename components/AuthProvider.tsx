"use client";

import { devBypassEnabled, getClientAuth } from "@/lib/firebase/client";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

const DEV_USER_KEY = "mw.devUser";

export type SessionUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  firebaseReady: boolean;
  devBypass: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDev: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: User): SessionUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const auth = getClientAuth();
    setFirebaseReady(auth !== null);
    if (!auth) {
      if (devBypassEnabled) {
        const raw = localStorage.getItem(DEV_USER_KEY);
        if (raw) {
          try {
            setUser(JSON.parse(raw) as SessionUser);
          } catch {
            localStorage.removeItem(DEV_USER_KEY);
          }
        }
      }
      setReady(true);
      return;
    }

    return onAuthStateChanged(auth, (next) => {
      if (next) {
        setUser(mapUser(next));
      } else if (devBypassEnabled) {
        const raw = localStorage.getItem(DEV_USER_KEY);
        if (raw) {
          try {
            setUser(JSON.parse(raw) as SessionUser);
          } catch {
            localStorage.removeItem(DEV_USER_KEY);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setReady(true);
    });
  }, []);

  async function signInWithGoogle() {
    const auth = getClientAuth();
    if (!auth) {
      throw new Error("Firebase 환경변수가 없습니다.");
    }
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  function signInDev() {
    if (!devBypassEnabled) return;
    const session: SessionUser = {
      uid: "dev-local",
      displayName: "로컬 미리보기",
      email: null,
      photoURL: null,
    };
    localStorage.setItem(DEV_USER_KEY, JSON.stringify(session));
    setUser(session);
  }

  async function logout() {
    const auth = getClientAuth();
    if (auth) await signOut(auth);
    localStorage.removeItem(DEV_USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        firebaseReady,
        devBypass: devBypassEnabled,
        signInWithGoogle,
        signInDev,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider가 필요합니다.");
  return value;
}
