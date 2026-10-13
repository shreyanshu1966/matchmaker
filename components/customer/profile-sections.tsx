import {
  Briefcase,
  Compass,
  Heart,
  House,
  Leaf,
  MoonStar,
  Phone,
  Quote,
  UserRound,
} from "lucide-react";
import type { Profile, YesNoMaybe } from "@/lib/types";
import { cn } from "@/lib/ui/cn";
import {
  ageFromDob,
  DEALBREAKER_LABELS,
  EDUCATION_LABELS,
  formatDate,
  formatLpa,
  heightFtIn,
  RELIGIOSITY_LABELS,
} from "@/lib/ui/format";
import { Chip } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function Section({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-2xl bg-white p-5 shadow-soft ring-1 ring-line/80 sm:p-6", className)}
      aria-label={title}
    >
      <h3 className="mb-4 flex items-center gap-2.5 font-display text-lg font-medium text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blush-50 text-blush-500">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Fields({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
      )}
    >
      {children}
    </dl>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  const empty = children === undefined || children === null || children === "";
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-full")}>
      <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className={cn("mt-1 break-words text-sm", empty ? "text-ink-muted/70" : "text-ink")}>
        {empty ? "—" : children}
      </dd>
    </div>
  );
}

function ChipList({ items, empty = "—", className }: { items: string[]; empty?: string; className?: string }) {
  if (!items || items.length === 0) return <span className="text-ink-muted">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Chip key={i} className={className}>
          {i}
        </Chip>
      ))}
    </span>
  );
}

function YesNo({ value }: { value: YesNoMaybe | boolean | undefined }) {
  if (value === undefined) return null;
  const v = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  const tone = v === "Yes" ? "text-emerald-700" : v === "No" ? "text-blush-700" : "text-amber-700";
  return <span className={cn("font-medium", tone)}>{v}</span>;
}

function Open({ label = "Open to all" }: { label?: string }) {
  return <span className="italic text-ink-muted">{label}</span>;
}

/* ------------------------------------------------------------------ */
/* Profile sections                                                    */
/* ------------------------------------------------------------------ */

export function ProfileSections({
  profile: p,
  showContact = true,
  className,
}: {
  profile: Profile;
  showContact?: boolean;
  className?: string;
}) {
  const prefs = p.partnerPreferences;
  const age = ageFromDob(p.dob);

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      {p.aboutMe && (
        <Section title="About" icon={<Quote className="h-4 w-4" aria-hidden="true" />} className="lg:col-span-2">
          <blockquote className="font-display text-[17px] font-light italic leading-relaxed text-ink-soft">
            “{p.aboutMe}”
          </blockquote>
          <p className="mt-3 text-sm text-ink-muted">
            Profile managed by <span className="font-medium text-ink-soft">{p.profileManagedBy}</span>
          </p>
        </Section>
      )}

      <Section title="Basics" icon={<UserRound className="h-4 w-4" aria-hidden="true" />}>
        <Fields>
          <Field label="First name">{p.firstName}</Field>
          <Field label="Last name">{p.lastName}</Field>
          <Field label="Gender">{p.gender}</Field>
          <Field label="Date of birth">
            {formatDate(p.dob)} <span className="text-ink-muted">({age} yrs)</span>
          </Field>
          <Field label="Height">
            {p.heightCm} cm <span className="text-ink-muted">({heightFtIn(p.heightCm)})</span>
          </Field>
          <Field label="Marital status">{p.maritalStatus}</Field>
          <Field label="Lives in">
            {[p.city, p.state, p.country].filter(Boolean).join(", ")}
          </Field>
          <Field label="Residency">{p.residencyStatus}</Field>
          <Field label="Native place">{p.nativePlace}</Field>
          <Field label="Mother tongue">{p.motherTongue}</Field>
          <Field label="Languages" wide>
            <ChipList items={p.languages} />
          </Field>
        </Fields>
      </Section>

      <div className="grid gap-4">
        {showContact && (
          <Section title="Contact" icon={<Phone className="h-4 w-4" aria-hidden="true" />}>
            <Fields>
              <Field label="Email">
                <a href={`mailto:${p.email}`} className="text-plum-700 underline-offset-2 hover:underline">
                  {p.email}
                </a>
              </Field>
              <Field label="Phone">
                <a href={`tel:${p.phone}`} className="text-plum-700 underline-offset-2 hover:underline">
                  {p.phone}
                </a>
              </Field>
            </Fields>
          </Section>
        )}

        <Section title="Future plans" icon={<Compass className="h-4 w-4" aria-hidden="true" />}>
          <Fields>
            <Field label="Wants kids">
              <YesNo value={p.wantKids} />
            </Field>
            <Field label="Open to relocate">
              <YesNo value={p.openToRelocate} />
            </Field>
            <Field label="Open to pets">
              <YesNo value={p.openToPets} />
            </Field>
            <Field label="Timeline to marry">{p.timelineToMarry}</Field>
          </Fields>
        </Section>
      </div>

      <Section title="Education & career" icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}>
        <Fields>
          <Field label="Undergraduate">
            {p.degree}
            {p.ugCollege && <span className="block text-ink-muted">{p.ugCollege}</span>}
          </Field>
          <Field label="Postgraduate">
            {p.postGradDegree ? (
              <>
                {p.postGradDegree}
                {p.postGradCollege && <span className="block text-ink-muted">{p.postGradCollege}</span>}
              </>
            ) : undefined}
          </Field>
          <Field label="Education level">{EDUCATION_LABELS[p.educationLevel]}</Field>
          <Field label="Profession">{p.profession}</Field>
          <Field label="Designation">{p.designation}</Field>
          <Field label="Company">{p.company}</Field>
          <Field label="Annual income">{formatLpa(p.incomeLpa)}</Field>
          <Field label="Work mode">{p.workMode}</Field>
          <Field label="Career ambition">{p.careerAmbition}</Field>
        </Fields>
      </Section>

      <Section title="Family" icon={<House className="h-4 w-4" aria-hidden="true" />}>
        <Fields>
          <Field label="Family type">{p.familyType}</Field>
          <Field label="Family values">{p.familyValues}</Field>
          <Field label="Father">{p.fatherOccupation}</Field>
          <Field label="Mother">{p.motherOccupation}</Field>
          <Field label="Siblings" wide>
            {p.siblings}
          </Field>
          <Field label="Living with parents after marriage">
            <YesNo value={p.livingWithParentsAfterMarriage} />
          </Field>
        </Fields>
      </Section>

      <Section title="Religion & horoscope" icon={<MoonStar className="h-4 w-4" aria-hidden="true" />}>
        <Fields>
          <Field label="Religion">{p.religion}</Field>
          <Field label="Caste">{p.caste}</Field>
          <Field label="Sub-caste">{p.subCaste}</Field>
          <Field label="Gotra">{p.gotra}</Field>
          <Field label="Manglik">{p.manglik}</Field>
          <Field label="Rashi">{p.rashi}</Field>
          <Field label="Nakshatra">{p.nakshatra}</Field>
          <Field label="Birth time">{p.birthTime}</Field>
          <Field label="Birth place">{p.birthPlace}</Field>
          <Field label="Horoscope match required">
            <YesNo value={p.horoscopeMatchRequired} />
          </Field>
        </Fields>
      </Section>

      <Section title="Lifestyle" icon={<Leaf className="h-4 w-4" aria-hidden="true" />}>
        <Fields>
          <Field label="Diet">{p.diet}</Field>
          <Field label="Smoking">{p.smoking}</Field>
          <Field label="Drinking">{p.drinking}</Field>
          <Field label="Fitness">{p.fitness}</Field>
          <Field label="Body type">{p.bodyType}</Field>
          <Field label="Religiosity">
            <span className="inline-flex items-center gap-2">
              <span className="flex gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={cn("h-1.5 w-4 rounded-full", i <= p.religiosity ? "bg-plum-400" : "bg-sand")}
                  />
                ))}
              </span>
              {RELIGIOSITY_LABELS[p.religiosity]}
            </span>
          </Field>
          <Field label="Hobbies" wide>
            <ChipList items={p.hobbies} className="bg-blush-50 text-blush-700" />
          </Field>
        </Fields>
      </Section>

      <Section
        title="Partner preferences"
        icon={<Heart className="h-4 w-4" aria-hidden="true" />}
        className="lg:col-span-2"
      >
        <Fields cols={3}>
          <Field label="Age">
            {prefs.ageMin}–{prefs.ageMax} yrs
          </Field>
          <Field label="Height">
            {prefs.heightMinCm}–{prefs.heightMaxCm} cm{" "}
            <span className="text-ink-muted">
              ({heightFtIn(prefs.heightMinCm)}–{heightFtIn(prefs.heightMaxCm)})
            </span>
          </Field>
          <Field label="Minimum education">{EDUCATION_LABELS[prefs.minEducationLevel]}</Field>
          <Field label="Minimum income">
            {prefs.minIncomeLpa > 0 ? formatLpa(prefs.minIncomeLpa) : <Open label="No preference" />}
          </Field>
          <Field label="Religions">
            {prefs.religions.length ? <ChipList items={prefs.religions} /> : <Open />}
          </Field>
          <Field label="Castes">{prefs.castes.length ? <ChipList items={prefs.castes} /> : <Open label="Caste no bar" />}</Field>
          <Field label="Marital status">
            {prefs.maritalStatuses.length ? <ChipList items={prefs.maritalStatuses} /> : <Open />}
          </Field>
          <Field label="Diet">{prefs.diets.length ? <ChipList items={prefs.diets} /> : <Open />}</Field>
          <Field label="Cities">{prefs.cities.length ? <ChipList items={prefs.cities} /> : <Open label="Anywhere" />}</Field>
          <Field label="Dealbreakers" wide>
            {prefs.dealbreakers.length ? (
              <ChipList
                items={prefs.dealbreakers.map((d) => DEALBREAKER_LABELS[d] ?? d)}
                className="bg-blush-100 text-blush-700 ring-1 ring-inset ring-blush-200"
              />
            ) : (
              <Open label="None stated" />
            )}
          </Field>
        </Fields>
      </Section>
    </div>
  );
}
