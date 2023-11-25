import { DangerRatingValue } from "./caaml";
import type { WarnLevelNumber } from "./types";

export type DangerRatingConfig = {
  warnLevelNumber: WarnLevelNumber;
  color: string;
  // https://www.avalanches.org/standards/avalanche-danger-scale/
  text: string;
};

export const DANGER_RATINGS: Record<DangerRatingValue, DangerRatingConfig> =
  Object.freeze({
    no_rating: {
      warnLevelNumber: 0,
      color: "#cccccc",
      text: "",
    },
    no_snow: {
      warnLevelNumber: 0,
      color: "#cccccc",
      text: "",
    },
    low: {
      warnLevelNumber: 1,
      color: "#ccff66",
      text: "Triggering is generally possible only from high additional loads in isolated areas of very steep, extreme terrain. Only small and medium natural avalanches are possible.",
    },
    moderate: {
      warnLevelNumber: 2,
      color: "#ffff00",
      text: "Triggering is possible, primarily from high additional loads, particularly on the indicated steep slopes. Very large natural avalanches are unlikely.",
    },
    considerable: {
      warnLevelNumber: 3,
      color: "#ff9900",
      text: "Triggering is possible, even from low additional loads, particularly on the indicated steep slopes. In certain situations some large, and in isolated cases very large natural avalanches are possible.",
    },
    high: {
      warnLevelNumber: 4,
      color: "#ff0000",
      text: "Triggering is likely, even from low additional loads, on many steep slopes. In some cases, numerous large and often very large natural avalanches can be expected.",
    },
    very_high: {
      warnLevelNumber: 5,
      color: "#000000",
      text: "Numerous very large and often extremely large natural avalanches can be expected, even in moderately steep terrain.",
    },
  });
