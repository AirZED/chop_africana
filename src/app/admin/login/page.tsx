"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { restaurant } from "@/lib/menu-data";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/products";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="animate-pop-in flex size-16 items-center justify-center">
        <Image src="/logo.png" alt={restaurant.name} width={64} height={64} className="rounded-full shadow-lg" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-stone-900">{restaurant.name} Admin</h1>
      <p className="mt-1 text-sm text-stone-500">Sign in to manage products and view analytics.</p>

      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-600">Email</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
            placeholder="you@chopafricana.com"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-stone-600">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
            placeholder="••••••••"
          />
        </label>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="tap-press mt-4 w-full rounded-xl bg-[#A61400] px-6 py-3 font-semibold text-white shadow-lg shadow-red-900/20 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
