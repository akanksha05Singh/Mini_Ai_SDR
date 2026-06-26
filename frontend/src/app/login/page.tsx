"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check auth state on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all input fields.");
      setLoading(false);
      return;
    }

    if (isRegister && password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Register API Call
        const { error: registerError } = await apiRequest("/auth/register", "POST", {
          email: email.trim(),
          password: password.trim()
        });

        if (registerError) {
          setError(registerError);
          setLoading(false);
          return;
        }

        setSuccess("Registration successful! Logging you in now...");
      }

      // Login API Call
      const { data, error: loginError } = await apiRequest<{
        access_token: string;
        token_type: string;
      }>("/auth/login", "POST", {
        email: email.trim(),
        password: password.trim()
      });

      if (loginError) {
        setError(loginError);
        setLoading(false);
        return;
      }

      if (data && data.access_token) {
        // Save Bearer token in localStorage
        localStorage.setItem("token", data.access_token);
        // Force redirect to dashboard workspace
        router.push("/dashboard");
      } else {
        setError("Login response did not yield authentication token.");
      }

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "An authentication error occurred.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Login Card Container */}
      <div className="relative w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300">
        
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-inner">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Mini AI SDR Platform</h1>
          <p className="text-xs text-slate-400 mt-1.5">Outbound Sales Intelligence & Lead Automation</p>
        </div>

        {/* Dynamic State Info alerts */}
        {error && (
          <div className="mb-5 p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 p-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
            {success}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-4 py-2.5 text-sm text-slate-200 bg-slate-950/40 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/35 transition-all placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Account Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-sm text-slate-200 bg-slate-950/40 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/35 transition-all placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-6 inline-flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : isRegister ? (
              "Create Account & Login"
            ) : (
              "Sign In to Pipeline"
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSuccess(null);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors focus:outline-none"
          >
            {isRegister 
              ? "Already have an account? Sign in here" 
              : "Need a new workflow? Register test account"}
          </button>
        </div>
      </div>
    </main>
  );
}
