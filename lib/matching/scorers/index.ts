/** Registry: ScorerKey → scorer function. Weight profiles reference scorers by key. */
import type { Scorer, ScorerKey } from "../types";
import { scoreAge } from "./age";
import { scoreBackground } from "./background";
import { scoreCareer } from "./career";
import { scoreHeight } from "./height";
import { scoreIncome } from "./income";
import { scoreInterests } from "./interests";
import { scoreKids } from "./kids";
import { scoreLifestyle } from "./lifestyle";
import { scoreLocation } from "./location";
import { scorePreferenceFit } from "./preferenceFit";
import { scoreTimeline } from "./timeline";
import { scoreValues } from "./values";

export const SCORERS: Record<ScorerKey, Scorer> = {
  age: scoreAge,
  height: scoreHeight,
  income: scoreIncome,
  kids: scoreKids,
  values: scoreValues,
  lifestyle: scoreLifestyle,
  location: scoreLocation,
  background: scoreBackground,
  career: scoreCareer,
  timeline: scoreTimeline,
  interests: scoreInterests,
  preferenceFit: scorePreferenceFit,
};

export {
  scoreAge,
  scoreBackground,
  scoreCareer,
  scoreHeight,
  scoreIncome,
  scoreInterests,
  scoreKids,
  scoreLifestyle,
  scoreLocation,
  scorePreferenceFit,
  scoreTimeline,
  scoreValues,
};
