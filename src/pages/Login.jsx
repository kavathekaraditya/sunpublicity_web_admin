import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getUserProfile, syncGoogleUser } from "../utils/createUserDocument";
import React, { useState } from "react";
import Navbar from "../component/Navbar";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectAfterLogin = (profile) => {
    const role = profile?.role?.toLowerCase();

    if (!role) {
      throw new Error("Login successful, but this account has no user profile role. Please add this account in Firestore users collection as admin, user, or customer.");
    }

    if (role === "admin" || role === "user") {
      const adminUrl =
        window.location.hostname === "localhost"
          ? "http://localhost:3000/admin/home"
          : "/admin/home";

      window.location.assign(adminUrl);
      return;
    }

    if (role !== "customer") {
      throw new Error(`This account role (${profile.role}) is not allowed to login here.`);
    }

    const from = location.state?.from || "/";
    const item = location.state?.item;
    navigate(from, item ? { state: { item } } : undefined);
  };

  const getErrorMessage = (err) => {
    // Map Firebase error codes to user-friendly messages
    switch (err.code) {
      case "auth/user-not-found":
        return "User does not exist. Please sign up first.";
      case "auth/wrong-password":
        return "Invalid password. Please try again.";
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      default:
        // If it's a generic invalid credential error which sometimes masks user-not-found
        if (err.message && err.message.includes("invalid-credential")) {
          return "Invalid email or password.";
        }
        return err.message || "Login failed. Please try again.";
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await login(form);
      redirectAfterLogin(result.profile);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncGoogleUser(result.user, result.providerId);
      const profile = await getUserProfile(result.user.uid);
      redirectAfterLogin(profile);
    } catch (e) {
      console.error("Google Sign-in Error:", e);
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded-xl shadow">
          <h1 className="text-2xl font-bold mb-4">Login</h1>

          {error && (
            <div className={`mb-3 text-sm p-3 rounded-md border ${error.includes("sign up")
              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
              : "bg-red-50 border-red-200 text-red-600"
              }`}>
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </>
            ) : "Login"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition duration-200 disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          <p className="text-sm text-center text-gray-600 mt-6">
            New here? <Link to="/register" className="text-blue-600 font-medium hover:underline">Register</Link>
          </p>
        </form>
      </main>
    </>
  );
}
