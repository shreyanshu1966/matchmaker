"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Briefcase,
  ChevronRight,
  HeartHandshake,
  LayoutGrid,
  MapPin,
  RefreshCw,
  RotateCcw,
  Rows3,
  Search,
  SearchX,
  Send,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CUSTOMER_STATUSES, type CustomerStatus, type MatchAction, type Profile } from "@/lib/types";
import { api, errorMessage, isAbort } from "@/lib/ui/api";
import { cn } from "@/lib/ui/cn";
import {
  ageFromDob,
  daysSince,
  fullName,
  greeting,
  needsAttention,
  relativeTime,
  statusTone,
} from "@/lib/ui/format";
import { useNow } from "@/lib/ui/use-now";
import { useSession } from "@/components/app/session-provider";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type SortKey = "name" | "age-asc" | "age-desc" | "activity-recent" | "activity-oldest";
type View = "table" | "cards";

const ACTIVE_STATUSES: CustomerStatus[] = ["Matching", "Match Sent", "Meeting Scheduled", "In Conversation"];

async function fetchCustomers(signal?: AbortSignal) {
  const res = await api.get<{ customers: Profile[] }>("/api/customers", { signal });
  return res.customers;
}

/** "Matches sent" = sum of each client's history (small N, fetched in parallel). */
async function fetchSentCount(customers: Profile[], signal?: AbortSignal) {
  const histories = await Promise.allSettled(
    customers.map((c) => api.get<{ actions: MatchAction[] }>(`/api/customers/${c.id}/history`, { signal })),
  );
  if (!histories.some((h) => h.status === "fulfilled")) return null;
  return histories.reduce((sum, h) => (h.status === "fulfilled" ? sum + h.value.actions.length : sum), 0);
}

export function DashboardView() {
  const router = useRouter();
  const now = useNow();
  const { user } = useSession();

  const [customers, setCustomers] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchesSent, setMatchesSent] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("activity-recent");
  const [view, setView] = useState<View>("table");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Data loaders are plain promises; state is only set in their callbacks.
  const load = useCallback((signal?: AbortSignal) => {
    return fetchCustomers(signal)
      .then((list) => {
        setCustomers(list);
        setError(null);
        return fetchSentCount(list, signal);
      })
      .then((sent) => setMatchesSent(sent))
      .catch((err) => {
        if (isAbort(err)) return;
        setError(errorMessage(err, "We couldn't load your clients."));
      });
  }, []);

  useEffect(() => {
    // Also re-runs when the page becomes visible again after navigating back (Activity), keeping data fresh.
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  function retry() {
    setError(null);
    setCustomers(null);
    load();
  }

  async function resetDemo() {
    setResetting(true);
    try {
      await api.post("/api/demo/reset");
      toast.success("Demo data restored");
      setResetOpen(false);
      setCustomers(null);
      setMatchesSent(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't reset the demo data."));
    } finally {
      setResetting(false);
    }
  }

  /* ---------------- derived ---------------- */

  const counts = useMemo(() => {
    const byStatus = new Map<CustomerStatus, number>();
    for (const c of customers ?? []) {
      const s = c.status ?? "New";
      byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
    }
    return byStatus;
  }, [customers]);

  const attentionCount = useMemo(
    () => (now && customers ? customers.filter((c) => needsAttention(c, now)).length : 0),
    [customers, now],
  );
  const activeCount = useMemo(
    () => (customers ?? []).filter((c) => c.status && ACTIVE_STATUSES.includes(c.status)).length,
    [customers],
  );

  const visible = useMemo(() => {
    if (!customers) return [];
    const q = query.trim().toLowerCase();
    const list = customers.filter((c) => {
      if (statusFilter !== "all" && (c.status ?? "New") !== statusFilter) return false;
      if (attentionOnly && !(now && needsAttention(c, now))) return false;
      if (!q) return true;
      return (
        fullName(c).toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
      );
    });
    const ts = (iso: string) => new Date(iso).getTime();
    list.sort((a, b) => {
      switch (sort) {
        case "name":
          return fullName(a).localeCompare(fullName(b));
        case "age-asc":
          return ts(b.dob) - ts(a.dob);
        case "age-desc":
          return ts(a.dob) - ts(b.dob);
        case "activity-oldest":
          return ts(a.lastActivityAt) - ts(b.lastActivityAt);
        case "activity-recent":
        default:
          return ts(b.lastActivityAt) - ts(a.lastActivityAt);
      }
    });
    return list;
  }, [customers, query, statusFilter, attentionOnly, sort, now]);

  const filtersActive = statusFilter !== "all" || attentionOnly || query.trim() !== "";
  function clearFilters() {
    setStatusFilter("all");
    setAttentionOnly(false);
    setQuery("");
  }

  const firstName = user?.name.split(" ")[0];
  const loading = customers === null && !error;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blush-600">
            {now ? new Date(now).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) : " "}
          </p>
          <h1 className="mt-1 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
            {now ? greeting(now) : "Hello"}
            {firstName ? (
              <>
                , <span className="italic text-plum-700">{firstName}</span>
              </>
            ) : null}
          </h1>
          <p className="mt-2 text-sm text-ink-muted sm:text-base">
            {customers
              ? attentionCount > 0
                ? `${attentionCount} ${attentionCount === 1 ? "client hasn't" : "clients haven't"} heard from you in over a week.`
                : "Everyone has heard from you this week. Lovely work."
              : "Gathering your clients…"}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Overview" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          label="Total clients"
          value={customers?.length}
          tone="plum"
        />
        <StatCard
          icon={<HeartHandshake className="h-5 w-5" aria-hidden="true" />}
          label="Active in matching"
          value={customers ? activeCount : undefined}
          hint="Matching → In conversation"
          tone="blush"
        />
        <StatCard
          icon={<Send className="h-5 w-5" aria-hidden="true" />}
          label="Matches sent"
          value={matchesSent ?? undefined}
          tone="gold"
        />
        <StatCard
          icon={<BellRing className="h-5 w-5" aria-hidden="true" />}
          label="Needs attention"
          value={customers && now ? attentionCount : undefined}
          hint="No activity in 7+ days"
          tone="alert"
          pressed={attentionOnly}
          onClick={customers ? () => setAttentionOnly((v) => !v) : undefined}
        />
      </section>

      {/* Pipeline chips */}
      <section aria-labelledby="pipeline-heading" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 id="pipeline-heading" className="font-display text-xl font-medium text-ink">
            Pipeline
          </h2>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-plum-700 hover:bg-plum-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
        <div
          role="group"
          aria-label="Filter by status"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <PipelineChip
            label="All"
            count={customers?.length}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          {CUSTOMER_STATUSES.map((s) => (
            <PipelineChip
              key={s}
              label={s}
              dot={statusTone(s).dot}
              count={customers ? (counts.get(s) ?? 0) : undefined}
              active={statusFilter === s}
              onClick={() => setStatusFilter((cur) => (cur === s ? "all" : s))}
            />
          ))}
        </div>
      </section>

      {/* Toolbar */}
      <section aria-label="Clients" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="client-search" className="sr-only">
              Search clients by name or city
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              id="client-search"
              type="search"
              placeholder="Search by name or city"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 rounded-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="client-sort" className="sr-only">
              Sort clients
            </label>
            <Select
              id="client-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              wrapperClassName="flex-1 sm:w-56 sm:flex-none"
              className="h-11 rounded-full pl-4"
            >
              <option value="activity-recent">Recent activity first</option>
              <option value="activity-oldest">Longest quiet first</option>
              <option value="name">Name (A–Z)</option>
              <option value="age-asc">Age (youngest first)</option>
              <option value="age-desc">Age (oldest first)</option>
            </Select>
            <div role="group" aria-label="Layout" className="hidden rounded-full bg-white p-1 ring-1 ring-line md:flex">
              <ViewButton active={view === "table"} onClick={() => setView("table")} label="Table view">
                <Rows3 className="h-4 w-4" aria-hidden="true" />
              </ViewButton>
              <ViewButton active={view === "cards"} onClick={() => setView("cards")} label="Card view">
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </ViewButton>
            </div>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {customers ? `${visible.length} of ${customers.length} clients shown` : ""}
        </p>

        {error ? (
          <EmptyState
            icon={<RefreshCw className="h-6 w-6" aria-hidden="true" />}
            title="We couldn't load your clients"
            description={error}
            action={<Button onClick={retry}>Try again</Button>}
          />
        ) : loading ? (
          <ListSkeleton />
        ) : visible.length === 0 ? (
          customers && customers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" aria-hidden="true" />}
              title="No clients yet"
              description="When clients are assigned to you, they'll appear here."
            />
          ) : (
            <EmptyState
              icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
              title="No one matches those filters"
              description="Try a different name or city, or clear the filters to see everyone."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          )
        ) : (
          <>
            {/* Table (md+, when chosen) */}
            <div className={cn(view === "table" ? "hidden md:block" : "hidden")}>
              <ClientTable
                customers={visible}
                now={now}
                onOpen={(id) => router.push(`/customers/${id}`)}
              />
            </div>
            {/* Cards (always on mobile) */}
            <div className={cn(view === "table" && "md:hidden")}>
              <ClientCards customers={visible} now={now} />
            </div>
          </>
        )}
      </section>

      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-cream hover:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset demo data
        </button>
      </div>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset demo data?"
        description="Statuses, notes and sent matches go back to the original seed. This can't be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={resetting} onClick={resetDemo}>
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Handy before a walkthrough: every client returns to their starting point in the pipeline.
        </p>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const STAT_TONES = {
  plum: "bg-plum-50 text-plum-700",
  blush: "bg-blush-50 text-blush-600",
  gold: "bg-gold-50 text-gold-600",
  alert: "bg-blush-100 text-blush-700",
} as const;

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
  onClick,
  pressed,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  hint?: string;
  tone: keyof typeof STAT_TONES;
  onClick?: () => void;
  pressed?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", STAT_TONES[tone])}>{icon}</span>
        {onClick && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium transition",
              pressed ? "bg-blush-500 text-white" : "bg-cream text-ink-muted",
            )}
          >
            {pressed ? "Filtering" : "Filter"}
          </span>
        )}
      </div>
      <div className="mt-4">
        {value === undefined ? (
          <Skeleton className="h-9 w-14" />
        ) : (
          <p className="font-display text-3xl font-medium tabular-nums text-ink sm:text-4xl">{value}</p>
        )}
        <p className="mt-1 text-sm font-medium text-ink-soft">{label}</p>
        {hint && <p className="mt-0.5 hidden text-xs text-ink-muted sm:block">{hint}</p>}
      </div>
    </>
  );

  const classes = "rounded-2xl bg-white p-4 text-left shadow-soft ring-1 ring-line/80 sm:p-5";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pressed}
        className={cn(
          classes,
          "transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
          pressed && "ring-2 ring-blush-300",
        )}
      >
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}

function PipelineChip({
  label,
  count,
  active,
  dot,
  onClick,
}: {
  label: string;
  count: number | undefined;
  active: boolean;
  dot?: string;
  onClick: () => void;
}) {
  const empty = count === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
        active
          ? "bg-plum-700 text-white ring-plum-700 shadow-soft"
          : "bg-white text-ink-soft ring-line hover:ring-plum-200 hover:text-plum-800",
        empty && !active && "text-ink-muted/70",
      )}
    >
      {dot && <span className={cn("h-2 w-2 rounded-full", dot, empty && !active && "opacity-40")} aria-hidden="true" />}
      {label}
      <span
        className={cn(
          "min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums",
          active ? "bg-white/20 text-white" : "bg-cream text-ink-muted",
        )}
      >
        {count ?? "–"}
      </span>
    </button>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
        active ? "bg-plum-700 text-white" : "text-ink-muted hover:text-plum-700",
      )}
    >
      {children}
    </button>
  );
}

function AttentionDot({ lastActivityAt, now }: { lastActivityAt: string; now: number }) {
  const days = daysSince(lastActivityAt, now);
  return (
    <span className="relative inline-flex h-2.5 w-2.5" title={`No activity for ${days} days`}>
      <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-blush-300" aria-hidden="true" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blush-500" aria-hidden="true" />
      <span className="sr-only">Needs attention: no activity for {days} days</span>
    </span>
  );
}

function professionLine(c: Profile) {
  return [c.designation, c.company].filter(Boolean).join(" · ") || c.profession;
}

function ClientTable({
  customers,
  now,
  onOpen,
}: {
  customers: Profile[];
  now: number;
  onOpen: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Your clients</caption>
        <thead className="border-b border-line bg-cream/40 text-xs uppercase tracking-wider text-ink-muted">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">Name</th>
            <th scope="col" className="px-3 py-3 font-medium">Age</th>
            <th scope="col" className="px-3 py-3 font-medium">City</th>
            <th scope="col" className="hidden px-3 py-3 font-medium lg:table-cell">Marital status</th>
            <th scope="col" className="px-3 py-3 font-medium">Status</th>
            <th scope="col" className="px-3 py-3 font-medium">Last activity</th>
            <th scope="col" className="w-12 px-3 py-3">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {customers.map((c) => {
            const attention = now > 0 && needsAttention(c, now);
            return (
              <tr
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="group cursor-pointer transition-colors hover:bg-blush-50/40"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={fullName(c)} seed={c.id} size="md" />
                    <div className="min-w-0">
                      <Link
                        href={`/customers/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-ink outline-none group-hover:text-plum-800 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-plum-400"
                      >
                        {fullName(c)}
                      </Link>
                      <p className="truncate text-xs text-ink-muted">{professionLine(c)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 tabular-nums text-ink-soft">{ageFromDob(c.dob, now || undefined)}</td>
                <td className="px-3 py-3.5 text-ink-soft">{c.city}</td>
                <td className="hidden px-3 py-3.5 text-ink-soft lg:table-cell">{c.maritalStatus}</td>
                <td className="px-3 py-3.5">
                  <StatusPill status={c.status} />
                </td>
                <td className="px-3 py-3.5">
                  <span className="flex items-center gap-2 text-ink-soft">
                    {attention && <AttentionDot lastActivityAt={c.lastActivityAt} now={now} />}
                    <span className={cn(attention && "font-medium text-blush-700")}>
                      {now ? relativeTime(c.lastActivityAt, now) : ""}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3.5 text-right">
                  <ChevronRight
                    className="ml-auto h-4 w-4 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-plum-700"
                    aria-hidden="true"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function ClientCards({ customers, now }: { customers: Profile[]; now: number }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {customers.map((c) => {
        const attention = now > 0 && needsAttention(c, now);
        return (
          <li key={c.id}>
            <Link
              href={`/customers/${c.id}`}
              className="group flex h-full flex-col gap-4 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-line/80 transition hover:-translate-y-0.5 hover:shadow-lift hover:ring-plum-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
            >
              <div className="flex items-start gap-3">
                <Avatar name={fullName(c)} seed={c.id} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-lg font-medium text-ink group-hover:text-plum-800">
                      {fullName(c)}
                    </p>
                    {attention && <AttentionDot lastActivityAt={c.lastActivityAt} now={now} />}
                  </div>
                  <p className="text-sm text-ink-soft">
                    {ageFromDob(c.dob, now || undefined)} · {c.maritalStatus}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-ink-soft">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-blush-400" aria-hidden="true" />
                  {c.city}, {c.state}
                </p>
                <p className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 shrink-0 text-blush-400" aria-hidden="true" />
                  <span className="truncate">{professionLine(c)}</span>
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/70 pt-3">
                <StatusPill status={c.status} />
                <span className={cn("text-xs", attention ? "font-medium text-blush-700" : "text-ink-muted")}>
                  {now ? relativeTime(c.lastActivityAt, now) : ""}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading clients">
      <Card className="hidden overflow-hidden md:block">
        <div className="border-b border-line bg-cream/40 px-5 py-3">
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="divide-y divide-line/70">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-3.5 w-10" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
