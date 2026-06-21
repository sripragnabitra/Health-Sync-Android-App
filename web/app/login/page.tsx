"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = mode === "login" ? await api.login(email, password) : await api.signup(email, password, fullName || undefined);
      login(result.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-ink text-ink-onDark">
            <Activity size={20} />
          </span>
          <h1 className="font-serif text-[26px] text-ink-2">Health Sync</h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">Your steps, sleep, and heart rate, synced from your phone.</p>
        </div>

        <div className="mb-5 flex rounded-full border border-border bg-surface-muted p-0.5">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-1.5 text-[13.5px] font-semibold capitalize transition-colors ${
                mode === m ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
              }`}
            >
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="rounded-card border border-border bg-surface p-6">
          {mode === "signup" && (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wide text-ink-muted">Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
                placeholder="Optional"
              />
            </label>
          )}

          <label className="mb-3 block">
            <span className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wide text-ink-muted">Email</span>
            <input
              type="email"
              required
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
            />
          </label>

          <label className="mb-1 block">
            <span className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wide text-ink-muted">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
            />
          </label>

          {error && (
            <p className="mt-3 rounded-lg border border-denial-bd bg-denial-bg px-3 py-2 text-[13px] text-denial-fg">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full rounded-full bg-ink py-2.5 text-[14px] font-semibold text-ink-onDark transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
