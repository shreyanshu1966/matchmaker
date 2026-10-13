import { Suspense } from "react";
import { AppNav, AppNavFallback } from "@/components/app/app-nav";
import { SessionProvider } from "@/components/app/session-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-plum-700 px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      <Suspense fallback={<AppNavFallback />}>
        <AppNav />
      </Suspense>
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {children}
      </main>
    </SessionProvider>
  );
}
