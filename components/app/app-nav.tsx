"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/ui/api";
import { cn } from "@/lib/ui/cn";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "./logo";
import { useSession } from "./session-provider";

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const clientsActive = pathname.startsWith("/dashboard") || pathname.startsWith("/customers");

  async function logout() {
    setLoggingOut(true);
    try {
      await api.post("/api/auth/logout");
      router.replace("/login");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't sign you out."));
      setLoggingOut(false);
    }
  }

  return (
    <NavFrame>
      <nav aria-label="Main" className="flex items-center gap-1">
        <Link
          href="/dashboard"
          aria-current={clientsActive ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
            clientsActive ? "bg-plum-50 text-plum-800" : "text-ink-soft hover:bg-plum-50/60 hover:text-plum-800",
          )}
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          Clients
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {loading ? (
          <Skeleton className="h-9 w-32 rounded-full" />
        ) : user ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} seed={user.id} size="sm" />
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="text-xs text-ink-muted">Matchmaker</p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-blush-50 hover:text-blush-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{loggingOut ? "Signing out…" : "Log out"}</span>
          <span className="sr-only sm:hidden">Log out</span>
        </button>
      </div>
    </NavFrame>
  );
}

function NavFrame({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ivory/85 backdrop-blur-md supports-[backdrop-filter]:bg-ivory/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
          aria-label="TDC Matchmaker home"
        >
          <Logo />
        </Link>
        {children}
      </div>
    </header>
  );
}

/** Static placeholder shown while the nav resolves (keeps layout stable). */
export function AppNavFallback() {
  return <NavFrame />;
}
