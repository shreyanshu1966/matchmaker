import type { Metadata } from "next";
import { Suspense } from "react";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/app/logo";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section
        aria-label="About TDC Matchmaker"
        className="brand-surface relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
      >
        <DecorativeRings />
        <Logo tone="light" className="relative" />

        <div className="relative max-w-lg">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-blush-100 ring-1 ring-white/15">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" /> For matchmakers
          </p>
          <h1 className="font-display text-4xl font-light leading-[1.1] tracking-tight xl:text-5xl">
            Thoughtful introductions,{" "}
            <span className="italic text-blush-200">made by people,</span> guided by data.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-plum-100/90">
            Every client gets a shortlist that respects what they told you, and what they didn&apos;t.
            The algorithm screens. You decide.
          </p>
        </div>

        <ul className="relative grid max-w-lg grid-cols-1 gap-3 text-sm text-plum-100/90 xl:grid-cols-2">
          <li className="flex items-start gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" aria-hidden="true" />
            <span>Reciprocal scoring: a match must work for both people.</span>
          </li>
          <li className="flex items-start gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blush-200" aria-hidden="true" />
            <span>AI that reads your notes, explains every suggestion and drafts the intro.</span>
          </li>
        </ul>
      </section>

      {/* Form */}
      <section className="relative flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-blush-50 to-transparent lg:hidden" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
            <p className="mt-4 font-display text-2xl font-light leading-snug text-plum-800">
              Thoughtful introductions, <span className="italic text-blush-500">made by people,</span> guided by data.
            </p>
          </div>
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink">Welcome back</h2>
          <p className="mt-1.5 text-sm text-ink-muted">Sign in to see your clients and today&apos;s introductions.</p>
          <div className="mt-8">
            <Suspense
              fallback={
                <div className="space-y-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-12 rounded-full" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}

function DecorativeRings() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -right-24 top-1/2 h-[560px] w-[560px] -translate-y-1/2 opacity-[0.14]"
      viewBox="0 0 400 400"
      fill="none"
    >
      <circle cx="160" cy="200" r="120" stroke="white" strokeWidth="1.5" />
      <circle cx="240" cy="200" r="120" stroke="#f6d0c9" strokeWidth="1.5" />
      <circle cx="160" cy="200" r="160" stroke="white" strokeWidth="0.75" strokeDasharray="2 6" />
      <circle cx="240" cy="200" r="160" stroke="#f6d0c9" strokeWidth="0.75" strokeDasharray="2 6" />
    </svg>
  );
}
