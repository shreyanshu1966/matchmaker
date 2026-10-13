"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { MatchAction, MatchOutcome } from "@/lib/types";
import { api, errorMessage } from "@/lib/ui/api";
import { cn } from "@/lib/ui/cn";
import { formatDate, formatDateTime, OUTCOME_TONES, relativeTime, tierTone } from "@/lib/ui/format";
import { useNow } from "@/lib/ui/use-now";
import { Avatar } from "@/components/ui/avatar";
import { TierBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreRing } from "@/components/ui/score-ring";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const OUTCOMES: MatchOutcome[] = ["Pending", "Accepted", "Declined", "Met"];

export function HistoryPanel({
  customerId,
  actions,
  onActionsChange,
}: {
  customerId: string;
  actions: MatchAction[] | null;
  onActionsChange: (a: MatchAction[]) => void;
}) {
  const now = useNow();
  const [saving, setSaving] = useState<string | null>(null);

  async function setOutcome(action: MatchAction, outcome: MatchOutcome) {
    if (!actions) return;
    const previous = actions;
    onActionsChange(actions.map((a) => (a.id === action.id ? { ...a, outcome } : a)));
    setSaving(action.id);
    try {
      const res = await api.patch<{ action: MatchAction }>(`/api/customers/${customerId}/history/${action.id}`, {
        outcome,
      });
      onActionsChange(previous.map((a) => (a.id === action.id ? res.action : a)));
      toast.success(`Marked “${outcome}” for ${action.matchName}`);
    } catch (err) {
      onActionsChange(previous);
      toast.error(errorMessage(err, "Couldn't update the outcome."));
    } finally {
      setSaving(null);
    }
  }

  if (actions === null) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading history">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <EmptyState
        icon={<Send className="h-6 w-6" aria-hidden="true" />}
        title="No introductions yet"
        description="Matches you send from the Matches tab will be tracked here, with their outcome."
      />
    );
  }

  return (
    <ul className="space-y-3" aria-label="Sent matches">
      {actions.map((a) => (
        <li key={a.id}>
          <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={a.matchName} seed={a.matchId} size="md" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-ink">{a.matchName}</p>
                  <TierBadge tier={a.tier} />
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Sent{" "}
                  <time dateTime={a.sentAt} title={formatDateTime(a.sentAt)}>
                    {formatDate(a.sentAt)}
                    {now ? ` · ${relativeTime(a.sentAt, now)}` : ""}
                  </time>{" "}
                  by {a.sentBy}
                </p>
                {a.emailSubject && <p className="mt-1 truncate text-sm text-ink-soft">“{a.emailSubject}”</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ScoreRing score={a.score} size={48} stroke={5} color={tierTone(a.tier).stroke} />
              <div className="w-40">
                <label htmlFor={`outcome-${a.id}`} className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  Outcome
                  {saving === a.id && <Loader2 className="h-3 w-3 animate-spin" aria-label="Saving" />}
                </label>
                <Select
                  id={`outcome-${a.id}`}
                  value={a.outcome}
                  onChange={(e) => setOutcome(a, e.target.value as MatchOutcome)}
                  disabled={saving === a.id}
                  className={cn("h-9 font-medium", OUTCOME_TONES[a.outcome])}
                >
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
