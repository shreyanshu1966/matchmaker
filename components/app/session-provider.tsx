"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/ui/api";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
}

const SessionContext = createContext<SessionState>({ user: null, loading: true });

/** Loads the logged-in matchmaker once (GET /api/auth/me) and shares it with the app shell. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ user: null, loading: true });

  useEffect(() => {
    let alive = true;
    api
      .get<{ user: SessionUser }>("/api/auth/me")
      .then((res) => {
        if (alive) setState({ user: res.user, loading: false });
      })
      .catch(() => {
        if (alive) setState({ user: null, loading: false });
      });
    return () => {
      alive = false;
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
