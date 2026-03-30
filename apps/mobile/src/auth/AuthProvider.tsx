import React, { createContext, useContext, useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import { MMKV } from "react-native-mmkv";

const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ""
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  idToken: string | null;
  orgId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const storage = new MMKV({ id: "auth-cache" });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Firebase
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);

    // Restore cached user if available
    const cachedUser = storage.getString("user");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
      } catch (e) {
        // Invalid cached data
      }
    }

    // Listen to auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const token = await currentUser.getIdToken();
        setIdToken(token);

        // Extract org ID from custom claims
        const decodedToken = await currentUser.getIdTokenResult();
        const org = decodedToken.claims.orgId as string | undefined;
        setOrgId(org || null);

        // Cache user for offline
        storage.set("user", JSON.stringify(currentUser.toJSON()));
        storage.set("orgId", org || "");
      } else {
        setUser(null);
        setIdToken(null);
        setOrgId(null);
        storage.delete("user");
        storage.delete("orgId");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);
    await signOut(auth);
    storage.clearAll();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, idToken, orgId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
