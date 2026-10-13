"use client";

import { useId, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Lightbulb,
  NotebookPen,
  PhoneCall,
  Sparkles,
  StickyNote,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { Note, NoteType, NotesSummary, Profile } from "@/lib/types";
import { api, errorMessage } from "@/lib/ui/api";
import { cn } from "@/lib/ui/cn";
import { formatDateTime, NOTE_TONES, relativeTime } from "@/lib/ui/format";
import { useNow } from "@/lib/ui/use-now";
import { AiBadge, Badge, Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const NOTE_TYPES: NoteType[] = ["Call", "Meeting", "General"];

const NOTE_ICONS: Record<NoteType, React.ReactNode> = {
  Call: <PhoneCall className="h-4 w-4" aria-hidden="true" />,
  Meeting: <CalendarCheck className="h-4 w-4" aria-hidden="true" />,
  General: <StickyNote className="h-4 w-4" aria-hidden="true" />,
};

export function NotesPanel({
  customer,
  notes,
  onNotesChange,
  onActivity,
}: {
  customer: Profile;
  notes: Note[] | null;
  onNotesChange: (notes: Note[]) => void;
  /** Called after a note is added (the backend bumps lastActivityAt). */
  onActivity?: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <AiSummaryCard customer={customer} noteCount={notes?.length ?? 0} />
        <AddNoteForm
          customerId={customer.id}
          onAdded={(note) => {
            onNotesChange([note, ...(notes ?? [])]);
            onActivity?.();
          }}
        />
      </div>
      <NotesTimeline
        customerId={customer.id}
        notes={notes}
        onDeleted={(id) => onNotesChange((notes ?? []).filter((n) => n.id !== id))}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AiSummaryCard({ customer, noteCount }: { customer: Profile; noteCount: number }) {
  const [summary, setSummary] = useState<NotesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function summarise() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<NotesSummary>(`/api/customers/${customer.id}/summary`);
      setSummary(res);
    } catch (err) {
      setError(errorMessage(err, "Couldn't summarise the notes."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(120%_70%_at_100%_0%,var(--color-blush-50),transparent_60%),radial-gradient(90%_60%_at_0%_100%,var(--color-plum-50),transparent_60%)]"
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-medium text-ink">Client brief</h3>
              <AiBadge />
            </div>
            <p className="mt-0.5 text-sm text-ink-muted">
              {summary ? "Distilled from your notes" : `Turn ${noteCount || "your"} notes into a three-line brief.`}
            </p>
          </div>
          {summary && (
            <Button variant="ghost" size="sm" onClick={summarise} loading={loading} aria-label="Summarise notes again">
              {!loading && <WandSparkles className="h-4 w-4" aria-hidden="true" />}
              Refresh
            </Button>
          )}
        </div>

        <div aria-live="polite" className="mt-4">
          {loading && !summary ? (
            <div className="space-y-2.5" role="status" aria-label="Summarising notes">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-[92%]" />
              <Skeleton className="h-3.5 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
            </div>
          ) : summary ? (
            <div className={cn("space-y-4 animate-fade-in", loading && "opacity-60")}>
              <p className="text-[15px] leading-relaxed text-ink">{summary.summary}</p>
              {summary.inferredPreferences.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-muted">Inferred preferences</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.inferredPreferences.map((p) => (
                      <Chip key={p} className="bg-plum-50 text-plum-700 ring-1 ring-inset ring-plum-100">
                        {p}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              {summary.suggestedNextStep && (
                <div className="flex gap-3 rounded-xl bg-gold-50 p-3.5 ring-1 ring-gold-200">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">Suggested next step</p>
                    <p className="mt-0.5 text-sm text-ink">{summary.suggestedNextStep}</p>
                  </div>
                </div>
              )}
              {summary.source === "fallback" && (
                <p className="text-xs text-ink-muted">Rule-based fallback (AI unavailable)</p>
              )}
            </div>
          ) : (
            <>
              {error && (
                <p role="alert" className="mb-3 text-sm text-blush-700">
                  {error}
                </p>
              )}
              <Button onClick={summarise} loading={loading} disabled={noteCount === 0}>
                {!loading && <Sparkles className="h-4 w-4" aria-hidden="true" />}
                Summarise notes
              </Button>
              {noteCount === 0 && <p className="mt-2 text-xs text-ink-muted">Add a note first.</p>}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function AddNoteForm({ customerId, onAdded }: { customerId: string; onAdded: (n: Note) => void }) {
  const typeId = useId();
  const bodyId = useId();
  const [type, setType] = useState<NoteType>("Call");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    try {
      const res = await api.post<{ note: Note }>(`/api/customers/${customerId}/notes`, { type, body: text });
      onAdded(res.note);
      setBody("");
      toast.success("Note saved");
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the note."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
          <NotebookPen className="h-4 w-4 text-blush-500" aria-hidden="true" /> Add a note
        </h3>
        <div>
          <Label htmlFor={typeId}>Type</Label>
          <Select id={typeId} value={type} onChange={(e) => setType(e.target.value as NoteType)}>
            {NOTE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={bodyId}>Note</Label>
          <Textarea
            id={bodyId}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="What did you learn? e.g. “Wants someone outgoing; open to moving to Bangalore.”"
            rows={4}
          />
          <p className="mt-1.5 text-xs text-ink-muted">Notes feed into the AI match reasoning. Ctrl+Enter to save.</p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={!body.trim()}>
            Save note
            {!saving && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function NotesTimeline({
  customerId,
  notes,
  onDeleted,
}: {
  customerId: string;
  notes: Note[] | null;
  onDeleted: (id: string) => void;
}) {
  const now = useNow();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(id: string) {
    setDeleting(id);
    try {
      await api.del(`/api/customers/${customerId}/notes/${id}`);
      onDeleted(id);
      toast.success("Note deleted");
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the note."));
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  }

  if (notes === null) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading notes">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={<StickyNote className="h-6 w-6" aria-hidden="true" />}
        title="No notes yet"
        description="Capture what you hear on calls and meetings. Small details make the best introductions."
      />
    );
  }

  return (
    <section aria-label="Notes timeline">
      <h3 className="mb-4 font-display text-lg font-medium text-ink">
        Timeline <span className="text-sm font-normal text-ink-muted">· {notes.length}</span>
      </h3>
      <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-line">
        {notes.map((n) => (
          <li key={n.id} className="relative flex gap-4 animate-rise">
            <span
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-ivory",
                NOTE_TONES[n.type],
              )}
            >
              {NOTE_ICONS[n.type]}
            </span>
            <Card className="min-w-0 flex-1 p-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge className={NOTE_TONES[n.type]}>{n.type}</Badge>
                <span className="text-sm font-medium text-ink">{n.authorName}</span>
                <time dateTime={n.createdAt} title={formatDateTime(n.createdAt)} className="text-xs text-ink-muted">
                  {now ? relativeTime(n.createdAt, now) : formatDateTime(n.createdAt)}
                </time>
                <div className="ml-auto">
                  {confirming === n.id ? (
                    <span className="flex items-center gap-1">
                      <Button size="sm" variant="danger" loading={deleting === n.id} onClick={() => remove(n.id)}>
                        Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                        Keep
                      </Button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(n.id)}
                      className="rounded-full p-1.5 text-ink-muted transition hover:bg-blush-50 hover:text-blush-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
                      aria-label={`Delete ${n.type.toLowerCase()} note from ${formatDateTime(n.createdAt)}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{n.body}</p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
