import type {
  Aspect,
  AvalancheBulletin,
  AvalancheProblemType,
  DangerRatingValue,
  ElevationBoundaryOrBand,
} from "./caaml";
import { DANGER_RATINGS, DangerRatingConfig } from "./danger-ratings";
import type { Region } from "./types";
import enRegionNames from "@eaws/micro-regions_names/en.json";

export function formatBulletin(
  region: Region,
  bulletin: AvalancheBulletin,
  details: boolean,
): HTMLElement {
  const result = document.createElement("dl");

  const provider = result.appendChild(document.createElement("dt"));
  const providerLink = provider.appendChild(document.createElement("a"));
  providerLink.innerText = bulletin.source?.provider?.name || "";
  providerLink.href = bulletin.source?.provider?.website || "";
  providerLink.target = "_blank";
  providerLink.rel = "external";

  if (!details) return result;

  const formatElevation = (e?: ElevationBoundaryOrBand) =>
    `🏔 ${e?.lowerBound || 0}..${e?.upperBound || "∞"}`;
  const formatAspects = (aspects0?: Aspect[]) => {
    if (!Array.isArray(aspects0) || !aspects0.length) return "";
    let aspects: Aspect[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    aspects = [...aspects, ...aspects];
    [, aspects] = takeDropWhile(aspects, (a) => aspects0.includes(a));
    [, aspects] = takeDropWhile(aspects, (a) => !aspects0.includes(a));
    [aspects] = takeDropWhile(aspects, (a) => aspects0.includes(a));
    if (aspects0.length > 3) {
      const main: Aspect[] = ["N", "S", "W", "E"];
      aspects = [
        aspects[0],
        main.find((a) => aspects0.includes(a))!,
        aspects[aspects.length - 1],
      ];
      return `🧭 <abbr title="${aspects0.join(",")}">${aspects.join(
        "↷",
      )}</abbr>`;
    } else {
      return "🧭 " + aspects0.join(",");
    }
  };
  result.appendChild(document.createElement("dd")).innerHTML =
    `<abbr title="${enRegionNames[region as "AT-07"]}">${region}</abbr>` +
    [bulletin.validTime?.startTime, bulletin.validTime?.endTime]
      .map((tt) => `<br>📅 ${tt && new Date(tt).toLocaleString()}`)
      .join("..");

  bulletin.dangerRatings?.forEach((r) => {
    result.appendChild(document.createElement("dt")).innerHTML = [
      dangerRatingLink(r.mainValue),
      r.validTimePeriod || "",
    ].join(" ");
    result.appendChild(document.createElement("dd")).innerText =
      formatElevation(r.elevation);
  });

  const avalancheSizes = [
    "",
    "small",
    "medium",
    "large",
    "very large",
    "extremely large",
  ];
  bulletin.avalancheProblems?.forEach((p) => {
    result.appendChild(document.createElement("dt")).innerHTML = [
      avalancheProblemLink(p.problemType || ""),
      p.validTimePeriod || "",
    ].join(" ");
    result.appendChild(document.createElement("dd")).innerHTML = [
      formatElevation(p.elevation),
      formatAspects(p.aspects),
      p.snowpackStability && `snowpack stability: ${p.snowpackStability}`,
      p.frequency && `frequency: ${p.frequency}`,
      p.avalancheSize && `avalanche size: ${avalancheSizes[p.avalancheSize]}`,
    ]
      .filter((line) => !!line)
      .join("<br>");
  });
  return result;
}

export function dangerRatingLink(
  rating: DangerRatingValue | DangerRatingConfig | undefined,
): string {
  if (!rating || rating === "no_rating" || rating === "no_snow") return "";
  const { color, id, text } =
    typeof rating === "string" ? DANGER_RATINGS[rating] : rating;
  return `<a href="https://www.avalanches.org/standards/avalanche-danger-scale/">
      <span class="square" style="background: ${color}"></span>
      <abbr title="${text}">${id}</abbr></a>`;
}

function avalancheProblemLink(problem: AvalancheProblemType): string {
  const id = problem.replace(/_/g, "-");
  return `<a href="https://www.avalanches.org/standards/avalanche-problems/#${id}">${problem}</a>`;
}

function takeDropWhile<T>(
  array: T[],
  predicate: (value: T) => boolean,
): [T[], T[]] {
  let i = 0;
  while (i < array.length && predicate(array[i])) {
    i++;
  }
  return [array.slice(0, i), array.slice(i)];
}
