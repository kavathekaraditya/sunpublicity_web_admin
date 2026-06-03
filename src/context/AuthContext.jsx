import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { createUserDocument, getUserProfile } from "../utils/createUserDocument";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setUserProfile(currentUser ? await getUserProfile(currentUser.uid) : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async ({ name, email, password }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update display name
    await updateProfile(userCredential.user, {
      displayName: name,
    });
    await createUserDocument(userCredential.user);
    // Force refresh user to get updated display name
    setUser({ ...userCredential.user, displayName: name });
    setUserProfile(await getUserProfile(userCredential.user.uid));
    return userCredential.user;
  };

  const login = async ({ email, password }) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(userCredential.user.uid);
    setUserProfile(profile);
    return {
      user: userCredential.user,
      profile,
      role: profile?.role || "customer",
      isDashboardUser: profile?.role === "admin" || profile?.role === "user",
    };
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    userProfile,
    userRole: userProfile?.role || null,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
