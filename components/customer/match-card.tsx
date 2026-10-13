"use client";

import { useId, useState } from "react";
import {
  Briefcase,
  ChevronDown,
  CircleCheckBig,
  IndianRupee,
  MapPin,
  MessageCircleHeart,
  Ruler,
  Send,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { MatchResult } from "@/lib/types";
import { cn } from "@/lib/ui/cn";
import { ageFromDob, formatLpa, fullName, heightFtIn, tierTone } from "@/lib/ui/format";
import { AiBadge, TierBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";

export function MatchCard({
  match,
  rank,
  onViewProfile,
  onSend,
}: {
  match: MatchResult;
  rank: number;
  onViewProfile: () => void;
  onSend: () => void;
}) {
  const c = match.candidate;
  const tone = tierTone(match.tier);
  const ai = match.ai;
  const why = ai?.whyItWorks?.length ? ai.whyItWorks : match.highlights;
  const watch = ai?.watchOuts?.length ? ai.watchOuts : match.concerns;
  const [open, setOpen] = useState(false);
  const breakdownId = useId();
  const name = fullName(c);

  return (
    <article
      aria-label={`${name}, match score ${Math.round(match.finalScore)}`}
      className={cn(
        "flex flex-col rounded-2xl bg-white shadow-soft transition hover:shadow-lift animate-rise",
        tone.card,
      )}
    >
      <div className="flex gap-4 p-5 sm:p-6">
        <div className="relative">
          <Avatar name={name} seed={c.id} size="lg" />
          <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {rank}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-medium text-ink">{name}</h3>
            <TierBadge tier={match.tier} />
          </div>
          <p className="text-sm text-ink-soft">
            {ageFromDob(c.dob)} yrs · {c.maritalStatus}
          </p>
          <ul className="mt-2 grid gap-x-4 gap-y-1 text-sm text-ink-soft sm:grid-cols-2">
            <li className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-blush-400" aria-hidden="true" />
              {c.city}, {c.state}
            </li>
            <li className="flex items-center gap-1.5 truncate">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-blush-400" aria-hidden="true" />
              <span className="truncate">{c.designation || c.profession}{c.company ? ` · ${c.company}` : ""}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 shrink-0 text-blush-400" aria-hidden="true" />
              {c.heightCm} cm · {heightFtIn(c.heightCm)}
            </li>
            <li className="flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 shrink-0 text-blush-400" aria-hidden="true" />
              {formatLpa(c.incomeLpa)}
            </li>
          </ul>
        </div>
        <ScoreRing score={match.finalScore} size={68} color={tone.stroke} />
      </div>

      <div className="space-y-4 px-5 pb-5 sm:px-6">
        {ai?.summary && (
          <p className="flex gap-2 rounded-xl bg-plum-50/60 p-3 text-[15px] leading-relaxed text-ink">
            <AiBadge className="mt-0.5 h-fit shrink-0" />
            <span>{ai.summary}</span>
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {why.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">Why it works</h4>
              <ul className="space-y-1.5">
                {why.slice(0, 4).map((w) => (
                  <li key={w} className="flex gap-2 text-sm text-ink-soft">
                    <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {watch.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">Watch-outs</h4>
              <ul className="space-y-1.5">
                {watch.slice(0, 3).map((w) => (
                  <li key={w} className="flex gap-2 text-sm text-ink-soft">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {ai?.conversationStarter && (
          <div className="flex gap-3 rounded-xl bg-gold-50/70 p-3 ring-1 ring-gold-100">
            <MessageCircleHeart className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-gold-700">Conversation starter: </span>
              <span className="italic">{ai.conversationStarter}</span>
            </p>
          </div>
        )}

        {/* Breakdown */}
        <div className="rounded-xl ring-1 ring-line">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={breakdownId}
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-cream/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
          >
            Score breakdown
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </button>
          <div id={breakdownId} hidden={!open} className="border-t border-line px-3.5 py-4">
            <ScoreBreakdown match={match} />
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line/70 px-5 py-3.5 sm:px-6">
        {ai?.source === "fallback" ? (
          <span className="text-xs text-ink-muted">Rule-based fallback</span>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onViewProfile}>
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            View profile
          </Button>
          <Button variant={match.tier === "High Potential" ? "gold" : "primary"} size="sm" onClick={onSend}>
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Send match
          </Button>
        </div>
      </div>
    </article>
  );
}

function ScoreBreakdown({ match }: { match: MatchResult }) {
  const adj = match.ai?.adjustment ?? 0;
  const adjLabel = adj > 0 ? `+${round1(adj)}` : adj < 0 ? `−${round1(Math.abs(adj))}` : "±0";
  const totalWeight = match.dimensions.reduce((s, d) => s + d.weight, 0) || 1;

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Fits their wishes" sub="Forward" value={Math.round(match.forwardScore)} />
        <Metric label="They fit back" sub="Reverse" value={Math.round(match.reverseScore)} />
        <Metric label="Mutual" sub="Geometric mean" value={Math.round(match.mutualScore)} />
        <Metric
          label="AI adjustment"
          sub={match.ai ? "From notes & profiles" : "Not applied"}
          value={adjLabel}
          tone={adj > 0 ? "text-emerald-700" : adj < 0 ? "text-blush-700" : "text-ink-muted"}
        />
      </dl>

      <ul className="space-y-3.5">
        {match.dimensions.map((d) => {
          const pct = Math.round(d.score * 100);
          return (
            <li key={d.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-ink">
                  {d.label}{" "}
                  <span className="text-xs font-normal text-ink-muted">
                    weight {Math.round((d.weight / totalWeight) * 100)}%
                  </span>
                </span>
                <span className="tabular-nums text-ink-soft">{pct}</span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream"
                role="meter"
                aria-label={d.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700",
                    pct >= 75 ? "bg-plum-500" : pct >= 50 ? "bg-blush-400" : "bg-amber-400",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{d.reason}</p>
              {d.flag && (
                <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-700">
                  <TriangleAlert className="h-3 w-3" aria-hidden="true" /> {d.flag}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function Metric({
  label,
  sub,
  value,
  tone = "text-ink",
}: {
  label: string;
  sub: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl bg-ivory p-3 ring-1 ring-line/70">
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className={cn("font-display text-2xl font-medium tabular-nums", tone)}>{value}</dd>
      <dd className="text-[11px] text-ink-muted">{sub}</dd>
    </div>
  );
}
