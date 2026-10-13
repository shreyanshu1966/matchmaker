"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/ui/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const DEMO_ACCOUNTS = [
  { username: "priya", name: "Priya Sharma" },
  { username: "arjun", name: "Arjun Mehta" },
];

function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) return "/dashboard";
  return next;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorId = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth/login", { username: username.trim(), password }, { redirectOn401: false });
      router.push(safeNext(params.get("next")));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "That username and password don't match. Please try again."
          : errorMessage(err, "Couldn't sign you in."),
      );
      setLoading(false);
    }
  }

  function fillDemo(u: string) {
    setUsername(u);
    setPassword("demo123");
    setError(null);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && (
        <div
          id={errorId}
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-blush-50 px-3.5 py-3 text-sm text-blush-700 ring-1 ring-blush-200 animate-fade-in"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-12 text-[15px]"
          placeholder="e.g. priya"
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-12 pr-12 text-[15px]"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-ink-muted transition hover:bg-plum-50 hover:text-plum-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
        {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </Button>

      <div className="rounded-2xl bg-cream/70 p-4 ring-1 ring-line">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          <KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Demo accounts
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          Password <code className="rounded bg-white px-1.5 py-0.5 font-mono text-plum-700">demo123</code>. Tap one to fill in.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.username}
              type="button"
              onClick={() => fillDemo(a.username)}
              className="rounded-xl bg-white px-3 py-2 text-left text-sm ring-1 ring-line transition hover:ring-plum-300 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
            >
              <span className="block font-medium text-ink">{a.name}</span>
              <span className="block font-mono text-xs text-ink-muted">{a.username}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
