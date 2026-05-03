// Firebase configuration for Rapid Aid
// Admin authentication + Firestore for alert management
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, type User } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  type Unsubscribe,
} from "firebase/firestore";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// ─── Firebase Config ────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

let app: FirebaseApp | null = null;

function getApp() {
  if (!app && firebaseConfig.apiKey) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Firebase init failed:", e);
    }
  }
  return app;
}

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
}

// ─── Auth ───────────────────────────────────────────────────────────
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const fbApp = getApp();
  if (!fbApp) throw new Error("Firebase not configured");
  const auth = getAuth(fbApp);
  // Use redirect as fallback if popup is blocked
  try {
    return await signInWithPopup(auth, provider);
  } catch (err: any) {
    console.error("Google sign-in error:", err);
    throw err;
  }
}

export async function signOutUser() {
  const fbApp = getApp();
  if (!fbApp) return;
  const auth = getAuth(fbApp);
  return fbSignOut(auth);
}

// Admin emails — if not set, any authenticated user is admin
const ADMIN_EMAILS = [
  import.meta.env.VITE_ADMIN_EMAIL ?? "",
];

export function isAdmin(user: User | null): boolean {
  if (!user?.email) return false;
  if (!ADMIN_EMAILS[0]) return true;
  return ADMIN_EMAILS.includes(user.email);
}

// ─── Alert Types ────────────────────────────────────────────────────
export interface AlertData {
  id: string;
  title: string;
  body: string;
  level: "high" | "info" | "ok";
  createdAt: any;
}

// ─── Firestore Alert CRUD ───────────────────────────────────────────
export async function createAlert(data: Omit<AlertData, "id" | "createdAt">) {
  const fbApp = getApp();
  if (!fbApp) throw new Error("Firebase not configured");
  const db = getFirestore(fbApp);
  return addDoc(collection(db, "alerts"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateAlert(id: string, data: Partial<Omit<AlertData, "id" | "createdAt">>) {
  const fbApp = getApp();
  if (!fbApp) throw new Error("Firebase not configured");
  const db = getFirestore(fbApp);
  return updateDoc(doc(db, "alerts", id), data);
}

export async function deleteAlert(id: string) {
  const fbApp = getApp();
  if (!fbApp) throw new Error("Firebase not configured");
  const db = getFirestore(fbApp);
  return deleteDoc(doc(db, "alerts", id));
}

export function subscribeToAlerts(callback: (alerts: AlertData[]) => void, onError?: (err: Error) => void): Unsubscribe {
  const fbApp = getApp();
  if (!fbApp) {
    callback([]);
    return () => {};
  }
  const db = getFirestore(fbApp);
  const q = query(collection(db, "alerts"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const alerts: AlertData[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AlertData[];
      callback(alerts);
    },
    (err) => {
      console.error("Firestore subscription error:", err);
      if (onError) onError(err);
      // Return empty alerts on error so UI doesn't get stuck
      callback([]);
    }
  );
}

// Also provide a one-time fetch fallback
export async function fetchAlerts(): Promise<AlertData[]> {
  const fbApp = getApp();
  if (!fbApp) return [];
  const db = getFirestore(fbApp);
  try {
    const q = query(collection(db, "alerts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as AlertData[];
  } catch (err) {
    console.error("Firestore fetch error:", err);
    return [];
  }
}

// ─── Auth Context ───────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdminUser: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdminUser: false,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  authError: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const fbApp = getApp();
    if (!fbApp) {
      setLoading(false);
      return;
    }
    const auth = getAuth(fbApp);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/unauthorized-domain") {
        setAuthError("This domain is not authorized. Go to Firebase Console → Authentication → Settings → Authorized domains and add 'localhost'.");
      } else if (code === "auth/popup-blocked") {
        setAuthError("Popup was blocked by your browser. Please allow popups for this site.");
      } else if (code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in was cancelled.");
      } else if (code === "auth/operation-not-allowed") {
        setAuthError("Google sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method → Enable Google.");
      } else {
        setAuthError(err.message || "Sign-in failed. Check browser console for details.");
      }
      console.error("Sign in failed:", err);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const fbApp = getApp();
      if (!fbApp) throw new Error("Firebase not configured");
      const auth = getAuth(fbApp);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setAuthError("Invalid email or password.");
      } else {
        setAuthError(err.message || "Sign in failed.");
      }
      console.error("Email sign in failed:", err);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const fbApp = getApp();
      if (!fbApp) throw new Error("Firebase not configured");
      const auth = getAuth(fbApp);
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setAuthError("Email is already registered. Try logging in.");
      } else if (err.code === "auth/weak-password") {
        setAuthError("Password should be at least 6 characters.");
      } else {
        setAuthError(err.message || "Sign up failed.");
      }
      console.error("Email sign up failed:", err);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutUser();
      setAuthError(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdminUser: isAdmin(user),
        signIn,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
