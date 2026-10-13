"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Clock, IdCard, IndianRupee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CUSTOMER_STATUSES, type CustomerStatus, type Profile } from "@/lib/types";
import { api, errorMessage } from "@/lib/ui/api";
import { cn } from "@/lib/ui/cn";
import {
  ageFromDob,
  formatLpa,
  fullName,
  heightFtIn,
  needsAttention,
  relativeTime,
  statusTone,
} from "@/lib/ui/format";
import { useNow } from "@/lib/ui/use-now";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

export function BackToClients() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-sm font-medium text-ink-muted transition hover:text-plum-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All clients
    </Link>
  );
}

function Verified({ ok, label, icon }: { ok: boolean; label: string; icon: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white/70 text-ink-muted ring-line",
      )}
      title={ok ? `${label} verified` : `${label} not verified`}
    >
      {ok ? <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> : icon}
      {label}
      <span className="sr-only">{ok ? "verified" : "not verified"}</span>
    </span>
  );
}

export function CustomerHeader({
  customer,
  onCustomerChange,
}: {
  customer: Profile;
  onCustomerChange: (c: Profile) => void;
}) {
  const now = useNow();
  const selectId = useId();
  const [saving, setSaving] = useState(false);
  const name = fullName(customer);
  const status = customer.status ?? "New";
  const tone = statusTone(status);
  const attention = now > 0 && needsAttention(customer, now);

  async function changeStatus(next: CustomerStatus) {
    if (next === status) return;
    const previous = customer;
    onCustomerChange({ ...customer, status: next }); // optimistic
    setSaving(true);
    try {
      const res = await api.patch<{ customer: Profile }>(`/api/customers/${customer.id}`, { status: next });
      onCustomerChange(res.customer);
      toast.success(`${customer.firstName} moved to “${next}”`);
    } catch (err) {
      onCustomerChange(previous);
      toast.error(errorMessage(err, "Couldn't update the status."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <header className="relative overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line/80">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-28 bg-linear-to-r from-blush-100 via-plum-50 to-gold-50 sm:h-24"
      />
      <div className="relative flex flex-col gap-5 px-5 pb-5 pt-12 sm:px-7 sm:pt-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Avatar name={name} seed={customer.id} size="xl" className="ring-4" />
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink">{name}</h1>
            <p className="mt-1 text-[15px] text-ink-soft">
              {ageFromDob(customer.dob, now || undefined)} · {customer.city} ·{" "}
              {[customer.designation, customer.company].filter(Boolean).join(" at ") || customer.profession}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Verified ok={customer.verified.id} label="ID" icon={<IdCard className="h-3.5 w-3.5" aria-hidden="true" />} />
              <Verified
                ok={customer.verified.linkedin}
                label="LinkedIn"
                icon={<BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />}
              />
              <Verified
                ok={customer.verified.income}
                label="Income"
                icon={<IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />}
              />
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 rounded-2xl bg-ivory/80 p-3 ring-1 ring-line sm:w-72">
          <label htmlFor={selectId} className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-ink-muted">
            Journey status
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-plum-500" aria-label="Saving" />}
          </label>
          <div className="relative">
            <span
              className={cn("pointer-events-none absolute left-3.5 top-1/2 z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full", tone.dot)}
              aria-hidden="true"
            />
            <Select
              id={selectId}
              value={status}
              disabled={saving}
              onChange={(e) => changeStatus(e.target.value as CustomerStatus)}
              className={cn("h-11 pl-9 font-medium", tone.pill)}
            >
              {CUSTOMER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <p className={cn("mt-2 flex items-center gap-1.5 text-xs", attention ? "font-medium text-blush-700" : "text-ink-muted")}>
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {now ? `Last activity ${relativeTime(customer.lastActivityAt, now)}` : " "}
            {attention && " · needs attention"}
          </p>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-1.5 border-t border-line/70 bg-ivory/40 px-5 py-3 sm:px-7">
        <Chip>{customer.heightCm} cm · {heightFtIn(customer.heightCm)}</Chip>
        <Chip>{formatLpa(customer.incomeLpa)}</Chip>
        <Chip>{customer.maritalStatus}</Chip>
        <Chip>{customer.religion}{customer.caste ? ` · ${customer.caste}` : ""}</Chip>
        <Chip>{customer.diet}</Chip>
        <Chip>{customer.motherTongue}</Chip>
        <Chip>Marry in {customer.timelineToMarry}</Chip>
      </div>
    </header>
  );
}
