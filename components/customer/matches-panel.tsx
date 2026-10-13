"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, HeartHandshake, RefreshCw, SearchX } from "lucide-react";
import type { MatchResult, MatchRunResult, MatchTier, Profile } from "@/lib/types";
import { api, errorMessage, isAbort } from "@/lib/ui/api";
import { cn } from "@/lib/ui/cn";
import { ageFromDob, fullName, TIERS, tierTone } from "@/lib/ui/format";
import { Avatar } from "@/components/ui/avatar";
import { TierBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCard } from "./match-card";
import { ProfileSections } from "./profile-sections";
import { SendMatchDialog, type SentResult } from "./send-match-dialog";

const LOADING_LINES = [
  "Screening the pool against dealbreakers…",
  "Weighing values, family and lifestyle…",
  "Checking that it works both ways…",
  "Reading your notes for the finer details…",
];

export function MatchesPanel({
  customer,
  onSent,
  onCountChange,
}: {
  customer: Profile;
  onSent: (r: SentResult) => void;
  onCountChange?: (n: number | null) => void;
}) {
  const [data, setData] = useState<MatchRunResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<MatchTier | "all">("all");
  const [viewing, setViewing] = useState<MatchResult | null>(null);
  const [sending, setSending] = useState<MatchResult | null>(null);

  const load = useCallback(
    (signal?: AbortSignal) =>
      api
        .get<MatchRunResult>(`/api/customers/${customer.id}/matches?ai=1`, { signal })
        .then((res) => {
          setData(res);
          setError(null);
          setLoading(false);
          onCountChange?.(res.matches.length);
        })
        .catch((err) => {
          if (isAbort(err)) return;
          setError(errorMessage(err, "We couldn't find matches right now."));
          setLoading(false);
        }),
    [customer.id, onCountChange],
  );

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  function refresh() {
    setLoading(true);
    setError(null);
    load();
  }

  function handleSent(r: SentResult) {
    const sentId = sending?.candidate.id;
    setSending(null);
    if (data && sentId) {
      const matches = data.matches.filter((m) => m.candidate.id !== sentId);
      setData({ ...data, matches });
      onCountChange?.(matches.length);
    }
    onSent(r);
  }

  const counts = new Map<MatchTier, number>();
  for (const m of data?.matches ?? []) counts.set(m.tier, (counts.get(m.tier) ?? 0) + 1);
  const shown = (data?.matches ?? []).filter((m) => tier === "all" || m.tier === tier);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium text-ink">Suggested matches</h2>
          <p className="mt-0.5 text-sm text-ink-muted" aria-live="polite">
            {data && !loading ? (
              <>
                <strong className="font-medium text-ink-soft">{data.poolSize}</strong> profiles screened ·{" "}
                <strong className="font-medium text-ink-soft">{data.afterFilters}</strong> passed dealbreakers · top{" "}
                <strong className="font-medium text-ink-soft">{data.matches.length}</strong> shown
              </>
            ) : loading ? (
              "Finding thoughtful matches…"
            ) : (
              " "
            )}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <MatchesLoading />
      ) : error ? (
        <EmptyState
          icon={<RefreshCw className="h-6 w-6" aria-hidden="true" />}
          title="Matching hit a snag"
          description={error}
          action={<Button onClick={refresh}>Try again</Button>}
        />
      ) : data && data.matches.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
          title="No matches right now"
          description="No one in the pool passes this client's dealbreakers yet. The section below explains why some profiles were left out."
        />
      ) : data ? (
        <>
          <div role="group" aria-label="Filter by tier" className="flex flex-wrap gap-2">
            <TierChip label="All" count={data.matches.length} active={tier === "all"} onClick={() => setTier("all")} />
            {TIERS.map((t) => (
              <TierChip
                key={t}
                label={t}
                count={counts.get(t) ?? 0}
                active={tier === t}
                activeClass={tierTone(t).chipActive}
                dot={tierTone(t).dot}
                onClick={() => setTier((cur) => (cur === t ? "all" : t))}
              />
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon={<HeartHandshake className="h-6 w-6" aria-hidden="true" />}
              title={`No “${tier}” matches`}
              description="Try another tier."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {shown.map((m) => (
                <MatchCard
                  key={m.candidate.id}
                  match={m}
                  rank={data.matches.indexOf(m) + 1}
                  onViewProfile={() => setViewing(m)}
                  onSend={() => setSending(m)}
                />
              ))}
            </div>
          )}
        </>
      ) : null}

      {data && !loading && data.excluded.length > 0 && (
        <details className="group rounded-2xl bg-white shadow-soft ring-1 ring-line/80">
          <summary className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400 sm:px-6">
            <span>
              Why weren&apos;t others shown?{" "}
              <span className="font-normal text-ink-muted">
                {data.poolSize - data.afterFilters} filtered out · {data.excluded.length} examples
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="divide-y divide-line/70 border-t border-line px-5 sm:px-6">
            {data.excluded.map((x) => (
              <li key={x.candidateId} className="flex items-start gap-3 py-3">
                <Avatar name={x.name} seed={x.candidateId} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{x.name}</p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {x.reasons.map((r) => (
                      <li key={r} className="rounded-full bg-blush-50 px-2 py-0.5 text-xs text-blush-700">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Candidate profile drawer */}
      <Dialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        variant="drawer"
        leading={viewing ? <Avatar name={fullName(viewing.candidate)} seed={viewing.candidate.id} size="md" /> : null}
        title={viewing ? fullName(viewing.candidate) : ""}
        description={
          viewing ? (
            <span className="flex flex-wrap items-center gap-2">
              {ageFromDob(viewing.candidate.dob)} · {viewing.candidate.city} · {viewing.candidate.profession}
              <TierBadge tier={viewing.tier} />
            </span>
          ) : null
        }
        footer={
          viewing ? (
            <>
              <Button variant="secondary" onClick={() => setViewing(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  const m = viewing;
                  setViewing(null);
                  setSending(m);
                }}
              >
                Send match
              </Button>
            </>
          ) : null
        }
      >
        {viewing && <ProfileSections profile={viewing.candidate} className="lg:grid-cols-1" />}
      </Dialog>

      {sending && (
        <SendMatchDialog
          key={sending.candidate.id}
          customer={customer}
          match={sending}
          onClose={() => setSending(null)}
          onSent={handleSent}
        />
      )}
    </div>
  );
}

function TierChip({
  label,
  count,
  active,
  activeClass = "bg-plum-700 text-white ring-plum-700",
  dot,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  activeClass?: string;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
        active ? activeClass : "bg-white text-ink-soft ring-line hover:ring-plum-200",
        count === 0 && !active && "opacity-60",
      )}
    >
      {dot && !active && <span className={cn("h-2 w-2 rounded-full", dot)} aria-hidden="true" />}
      {label}
      <span className={cn("text-xs tabular-nums", active ? "opacity-80" : "text-ink-muted")}>{count}</span>
    </button>
  );
}

function MatchesLoading() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((l) => (l + 1) % LOADING_LINES.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div role="status" aria-label="Finding thoughtful matches" className="space-y-5">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/60 px-6 py-8 text-center ring-1 ring-line/70">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush-50 text-blush-500">
          <HeartHandshake className="h-6 w-6 animate-pulse-soft" aria-hidden="true" />
        </span>
        <p className="font-display text-lg text-ink">Finding thoughtful matches…</p>
        <p key={line} className="text-sm text-ink-muted animate-fade-in">
          {LOADING_LINES[line]}
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-line/80">
            <div className="flex gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-52" />
              </div>
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Skeleton className="h-14" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
