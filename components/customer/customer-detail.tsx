"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HeartHandshake, History, NotebookPen, UserRound, UserX } from "lucide-react";
import type { MatchAction, Note, Profile } from "@/lib/types";
import { api, ApiError, errorMessage, isAbort } from "@/lib/ui/api";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { BackToClients, CustomerHeader } from "./customer-header";
import { HistoryPanel } from "./history-panel";
import { MatchesPanel } from "./matches-panel";
import { NotesPanel } from "./notes-panel";
import { ProfileSections } from "./profile-sections";
import type { SentResult } from "./send-match-dialog";

type Tab = "profile" | "matches" | "notes" | "history";

/** Reads the [id] param (must sit under <Suspense>) and remounts the view per client. */
export function CustomerDetailRoute() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  return <CustomerDetail key={id} id={id} />;
}

function CustomerDetail({ id }: { id: string }) {
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [history, setHistory] = useState<MatchAction[] | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;

    api
      .get<{ customer: Profile }>(`/api/customers/${id}`, { signal })
      .then((r) => setCustomer(r.customer))
      .catch((err) => {
        if (isAbort(err)) return;
        setLoadError({
          status: err instanceof ApiError ? err.status : 0,
          message: errorMessage(err, "We couldn't load this client."),
        });
      });
    api
      .get<{ notes: Note[] }>(`/api/customers/${id}/notes`, { signal })
      .then((r) => setNotes(r.notes))
      .catch((err) => !isAbort(err) && setNotes([]));
    api
      .get<{ actions: MatchAction[] }>(`/api/customers/${id}/history`, { signal })
      .then((r) => setHistory(r.actions))
      .catch((err) => !isAbort(err) && setHistory([]));

    return () => ac.abort();
  }, [id]);

  function handleSent(r: SentResult) {
    setCustomer(r.customer);
    setHistory((h) => [r.action, ...(h ?? []).filter((a) => a.id !== r.action.id)]);
  }

  function bumpActivity() {
    setCustomer((c) => (c ? { ...c, lastActivityAt: new Date().toISOString() } : c));
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <BackToClients />
        <EmptyState
          icon={<UserX className="h-6 w-6" aria-hidden="true" />}
          title={loadError.status === 404 ? "Client not found" : "Something went wrong"}
          description={
            loadError.status === 404
              ? "This client doesn't exist or isn't assigned to you."
              : loadError.message
          }
          action={
            <Link href="/dashboard" className={buttonClasses({ variant: "secondary" })}>
              Back to clients
            </Link>
          }
        />
      </div>
    );
  }

  if (!customer) return <CustomerDetailSkeleton />;

  const idBase = `customer-${id}`;

  return (
    <div className="space-y-6">
      <BackToClients />
      <CustomerHeader customer={customer} onCustomerChange={setCustomer} />

      <div className="sticky top-16 z-20 -mx-4 bg-ivory/90 px-4 py-2 backdrop-blur-md sm:mx-0 sm:rounded-full sm:px-0">
        <Tabs<Tab>
          idBase={idBase}
          label={`${customer.firstName}'s details`}
          value={tab}
          onValueChange={setTab}
          items={[
            { value: "profile", label: "Profile", icon: <UserRound className="h-4 w-4" aria-hidden="true" /> },
            {
              value: "matches",
              label: "Matches",
              icon: <HeartHandshake className="h-4 w-4" aria-hidden="true" />,
              count: matchCount,
            },
            {
              value: "notes",
              label: "Notes",
              icon: <NotebookPen className="h-4 w-4" aria-hidden="true" />,
              count: notes?.length ?? null,
            },
            {
              value: "history",
              label: "History",
              icon: <History className="h-4 w-4" aria-hidden="true" />,
              count: history?.length ?? null,
            },
          ]}
          className="sm:w-fit"
        />
      </div>

      <TabPanel idBase={idBase} value="profile" active={tab === "profile"}>
        <ProfileSections profile={customer} />
      </TabPanel>
      {/* Kept mounted so matches load in the background and survive tab switches. */}
      <TabPanel idBase={idBase} value="matches" active={tab === "matches"}>
        <MatchesPanel customer={customer} onSent={handleSent} onCountChange={setMatchCount} />
      </TabPanel>
      <TabPanel idBase={idBase} value="notes" active={tab === "notes"}>
        <NotesPanel customer={customer} notes={notes} onNotesChange={setNotes} onActivity={bumpActivity} />
      </TabPanel>
      <TabPanel idBase={idBase} value="history" active={tab === "history"}>
        <HistoryPanel customerId={customer.id} actions={history} onActionsChange={setHistory} />
      </TabPanel>
    </div>
  );
}

export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading client">
      <Skeleton className="h-6 w-28 rounded-full" />
      <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line/80">
        <div className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-end">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-2xl sm:w-72" />
        </div>
      </div>
      <Skeleton className="h-12 w-full max-w-md rounded-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
