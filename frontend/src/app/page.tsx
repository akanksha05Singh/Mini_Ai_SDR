"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root Landing Route Redirect Guard.
 * Checks for user session tokens on mount, pushing users to /dashboard or /login.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-sans">
      <div className="flex flex-col items-center space-y-3.5">
        <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 animate-pulse">Loading Workspace...</span>
      </div>
    </main>
  );
}
