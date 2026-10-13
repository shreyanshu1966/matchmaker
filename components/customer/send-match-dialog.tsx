"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MapPin, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import type { EmailTone, IntroEmail, MatchAction, MatchResult, Profile } from "@/lib/types";
import { api, ApiError, errorMessage } from "@/lib/ui/api";
import { cn } from "@/lib/ui/cn";
import { ageFromDob, formatLpa, fullName, heightFtIn, tierTone } from "@/lib/ui/format";
import { AiBadge, TierBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ScoreRing } from "@/components/ui/score-ring";
import { Skeleton } from "@/components/ui/skeleton";

const TONES: { value: EmailTone; hint: string }[] = [
  { value: "Warm", hint: "Personal and kind" },
  { value: "Formal", hint: "Polished, family-friendly" },
  { value: "Playful", hint: "Light and charming" },
];

export interface SentResult {
  action: MatchAction;
  customer: Profile;
}

/** Mount only while open (parent renders it conditionally) so state resets per match. */
export function SendMatchDialog({
  customer,
  match,
  onClose,
  onSent,
}: {
  customer: Profile;
  match: MatchResult;
  onClose: () => void;
  onSent: (r: SentResult) => void;
}) {
  const c = match.candidate;
  const subjectId = useId();
  const bodyId = useId();
  const [tone, setTone] = useState<EmailTone>("Warm");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState<IntroEmail["source"] | null>(null);
  const [generating, setGenerating] = useState(true);
  const [genError, setGenError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const requestRef = useRef(0);

  const customerId = customer.id;
  const matchId = c.id;
  const fetchIntro = useCallback(
    (t: EmailTone) => {
      const req = ++requestRef.current;
      return api
        .post<IntroEmail>("/api/matches/intro", { customerId, matchId, tone: t })
        .then((res) => {
          if (req !== requestRef.current) return;
          setSubject(res.subject);
          setBody(res.body);
          setSource(res.source);
          setGenError(null);
          setGenerating(false);
        })
        .catch((err) => {
          if (req !== requestRef.current) return;
          setGenError(
            err instanceof ApiError && err.status === 422
              ? "This profile no longer passes the filters, so we can't draft an intro."
              : errorMessage(err, "Couldn't draft the email. You can still write it yourself."),
          );
          setGenerating(false);
        });
    },
    [customerId, matchId],
  );

  // First draft on open; later drafts come from the tone / regenerate handlers.
  useEffect(() => {
    fetchIntro("Warm");
  }, [fetchIntro]);

  function regenerate(t: EmailTone = tone) {
    setTone(t);
    setGenerating(true);
    setGenError(null);
    fetchIntro(t);
  }

  async function send() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and a message before sending.");
      return;
    }
    setSending(true);
    try {
      const res = await api.post<SentResult>("/api/matches/send", {
        customerId: customer.id,
        matchId: c.id,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success(`Match sent to ${customer.firstName} 💌`, {
        description: `Introducing ${fullName(c)}. Logged in History.`,
      });
      onSent(res);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.status === 409
          ? `${c.firstName} has already been sent to ${customer.firstName}.`
          : errorMessage(err, "Couldn't send the match."),
      );
      setSending(false);
    }
  }

  const tierT = tierTone(match.tier);

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Introduce ${c.firstName} to ${customer.firstName}`}
      description="Review the AI draft, adjust anything you like, then send."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} loading={sending} disabled={generating}>
            {!sending && <Send className="h-4 w-4" aria-hidden="true" />}
            {sending ? "Sending…" : "Send match"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Match summary */}
        <div className={cn("flex items-center gap-4 rounded-2xl bg-white p-4", tierT.card)}>
          <Avatar name={fullName(c)} seed={c.id} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-medium text-ink">{fullName(c)}</p>
              <TierBadge tier={match.tier} />
            </div>
            <p className="text-sm text-ink-soft">
              {ageFromDob(c.dob)} · {heightFtIn(c.heightCm)} · {formatLpa(c.incomeLpa)}
            </p>
            <p className="flex items-center gap-1 truncate text-sm text-ink-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {c.city} · {c.designation}
              {c.company ? `, ${c.company}` : ""}
            </p>
          </div>
          <ScoreRing score={match.finalScore} size={56} stroke={5} color={tierT.stroke} />
        </div>

        {/* Tone */}
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-soft">Tone</legend>
          <div role="radiogroup" aria-label="Email tone" className="grid grid-cols-3 gap-2">
            {TONES.map((t) => {
              const active = t.value === tone;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={generating && active}
                  onClick={() => !active && regenerate(t.value)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-left ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
                    active ? "bg-plum-700 text-white ring-plum-700" : "bg-white text-ink ring-line hover:ring-plum-200",
                  )}
                >
                  <span className="block text-sm font-medium">{t.value}</span>
                  <span className={cn("block text-xs", active ? "text-plum-100" : "text-ink-muted")}>{t.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Draft */}
        <div aria-busy={generating} aria-live="polite" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-ink-soft">Email draft</span>
              <AiBadge />
              {source === "fallback" && !generating && (
                <span className="text-xs text-ink-muted">Rule-based fallback</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => regenerate()} disabled={generating}>
              <RefreshCw className={cn("h-3.5 w-3.5", generating && "animate-spin")} aria-hidden="true" />
              Regenerate
            </Button>
          </div>

          {genError && (
            <p role="alert" className="rounded-xl bg-blush-50 px-3.5 py-2.5 text-sm text-blush-700 ring-1 ring-blush-200">
              {genError}
            </p>
          )}

          {generating ? (
            <div className="space-y-4" role="status" aria-label="Drafting the introduction">
              <div>
                <Skeleton className="mb-2 h-3 w-16" />
                <Skeleton className="h-10" />
              </div>
              <div className="space-y-2.5 rounded-xl bg-white p-4 ring-1 ring-line">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-[94%]" />
                <Skeleton className="h-3.5 w-[88%]" />
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3.5 w-1/4" />
              </div>
              <p className="text-center text-sm italic text-ink-muted">Writing something personal…</p>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor={subjectId}>Subject</Label>
                <Input id={subjectId} value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div>
                <Label htmlFor={bodyId}>Message</Label>
                <Textarea
                  id={bodyId}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="font-[450]"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
