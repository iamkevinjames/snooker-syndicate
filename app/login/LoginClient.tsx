"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

function sanitizeNextPath(value: string | null) {
  if (value && value.startsWith("/")) {
    return value;
  }

  return "/";
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuthContext();
  const nextPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, nextPath, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace(nextPath);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-green-800/30 bg-[#111d15] p-8 shadow-2xl shadow-black/30 sm:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-green-300">
            Account access
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Login
          </h1>
          <p className="mt-4 text-[#cbd8c2]">
            Sign in to update scores and manage tournament results.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm text-[#dff5d6]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="mt-1 h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
              />
            </label>

            <label className="block text-sm text-[#dff5d6]">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="mt-1 h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-red-700/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="text-sm font-semibold text-[#9fb59d] transition hover:text-white"
              >
                Back home
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
