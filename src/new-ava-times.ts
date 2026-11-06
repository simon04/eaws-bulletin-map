import "./new-ava-times.css";
import eawsOutlineProperties from "@eaws/outline_properties/index.json";
import enRegionNames from "@eaws/micro-regions_names/en.json";
import {
  type Aspect,
  type AvalancheBulletin,
  type AvalancheProblem,
  AvalancheBulletinsSchema,
  type AvalancheProblemType,
  type DangerRating,
  type DangerRatingValue,
  type ElevationBoundaryOrBand,
  type Tendency,
  type Texts,
  type ValidTimePeriod,
} from "./caaml";
import { DANGER_RATINGS } from "./danger-ratings";
import { bulletinURL, fetchJSON } from "./fetchBulletins";

const PROBLEMS: Record<AvalancheProblemType, string> = {
  new_snow: "New snow",
  wind_slab: "Wind slab",
  persistent_weak_layers: "Persistent weak layers",
  wet_snow: "Wet snow",
  gliding_snow: "Gliding snow",
  cornices: "Cornices",
  favourable_situation: "Favourable situation",
  no_distinct_avalanche_problem: "No distinct avalanche problem",
};

const DANGER_PATTERNS: Record<string, string> = {
  DP1: "deep persistent weak layer",
  DP2: "gliding snow",
  DP3: "rain",
  DP4: "cold following warm / warm following cold",
  DP5: "snowfall after a prolonged period of cold",
  DP6: "cold, loose snow and wind",
  DP7: "snow-poor zones in snow-rich surrounding",
  DP8: "surface hoar blanketed with snow",
  DP9: "graupel blanketed with snow",
  DP10: "springtime scenario",
};

const PERIODS: Record<ValidTimePeriod, string> = {
  all_day: "All day",
  earlier: "Morning",
  later: "Afternoon",
};

const SIZES = ["", "small", "medium", "large", "very large", "extremely large"];
const ASPECTS: Aspect[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const params = new URLSearchParams(location.search);
const date = params.get("date") || defaultDate();
const region = params.get("region") || "AT-07";
const lang = params.get("lang") || "en";

void main();

async function main() {
  const paper = document.querySelector<HTMLDivElement>("#paper")!;
  const provider = eawsOutlineProperties
    .filter((p) => region === p.id || region.startsWith(p.id + "-"))
    .sort((a, b) => b.id.length - a.id.length)[0];
  const url = params.get("source") || bulletinURL(date, provider?.id ?? region, lang).url;
  const providerName = provider?.aws[0]?.name;

  const { bulletins } = await fetchJSON(url, { bulletins: [] }, AvalancheBulletinsSchema);
  bulletins.sort((a, b) => maxDanger(b) - maxDanger(a));
  const leadIndex = Math.max(
    0,
    bulletins.findIndex((b) => b.regions?.some((r) => r.regionID === region)),
  );
  const [lead] = bulletins.splice(leadIndex, 1);
  const leadRegion = lead?.regions?.find((r) => r.regionID === region);

  document.title = `The New Ava Times — ${formatDate(date, { dateStyle: "long" })}`;
  paper.append(masthead(lead));
  const main = paper.appendChild(h("main"));
  if (!lead) {
    main.append(
      h("article", { className: "lead" }, [
        h("h2", { className: "headline" }, "No Edition Printed Today"),
        h("p", { className: "deck" }, `No avalanche bulletin could be found for ${region}.`),
      ]),
    );
  } else {
    main.append(
      article(lead, true, providerName, leadRegion && (leadRegion.name || regionName(region))),
    );
    if (bulletins.length) {
      main.append(h("h2", { className: "section-title" }, "Elsewhere in the Mountains"));
      main.append(
        h(
          "div",
          { className: "others" },
          bulletins.map((b) => article(b, false, providerName)),
        ),
      );
    }
  }
  paper.append(
    h("footer", {}, [
      h("p", {}, [
        "Printed from the official avalanche bulletin: ",
        h("a", { href: url, rel: "external" }, url),
      ]),
      h(
        "p",
        {},
        "Avalanche bulletins are forecasts. Readers venturing into the backcountry do so at their own risk and are advised to assess local conditions.",
      ),
    ]),
  );
}

function masthead(lead?: AvalancheBulletin): HTMLElement {
  const day = new Date(date + "T12:00:00Z");
  const vol = toRoman(day.getUTCFullYear() - 1982);
  const start = Date.UTC(day.getUTCFullYear(), 0, 0);
  const no = Math.floor((day.getTime() - start) / 864e5);
  const danger = lead && maxDangerValue(lead);
  const tendency = lead?.tendency?.find((t) => t?.tendencyType)?.tendencyType;
  return h("header", { className: "masthead" }, [
    h("div", { className: "flag" }, [
      h("div", { className: "ear" }, [
        h("span", {}, "“All the Danger"),
        h("span", {}, "That’s Fit to Print”"),
      ]),
      h("h1", {}, [h("a", { href: "?" + params }, "The New Ava Times")]),
      h("div", { className: "ear" }, [
        h(
          "span",
          {},
          danger ? `Today: ${DANGER_RATINGS[danger].warnLevelNumber}, ${label(danger)}` : "",
        ),
        h("span", {}, tendency ? `Tendency: ${tendency}` : ""),
      ]),
    ]),
    h("div", { className: "dateline" }, [
      h("span", {}, `VOL. ${vol} . . . No. ${no.toLocaleString("en-US")}`),
      h("span", {}, formatDate(date, { dateStyle: "full" }).toUpperCase()),
      h("span", {}, [
        h("a", { href: link(shiftDate(date, -1)) }, "‹ Yesterday"),
        " · ",
        h("a", { href: link(shiftDate(date, +1)) }, "Tomorrow ›"),
      ]),
    ]),
  ]);
}

function article(
  b: AvalancheBulletin,
  isLead: boolean,
  providerName?: string,
  leadRegionName?: string,
): HTMLElement {
  const danger = maxDangerValue(b);
  const names = b.regions?.map((r) => r.name || regionName(r.regionID)) ?? [];
  const kicker =
    leadRegionName ??
    (names.length > 3
      ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`
      : names.join(", "));
  const headline =
    b.avalancheActivity?.highlights ||
    (danger ? `Danger Level ${label(danger)}` : "Avalanche Bulletin");
  const deck = b.tendency?.find((t) => t?.highlights)?.highlights;

  const byline = [
    providerName && `By ${providerName.toUpperCase()}`,
    `Published ${formatDateTime(b.publicationTime)}`,
    b.validTime?.endTime && `Valid until ${formatDateTime(b.validTime.endTime)}`,
    b.unscheduled && "Updated edition",
  ].filter(Boolean);

  const text: (HTMLElement | undefined)[] = [
    b.highlights ? h("p", { className: "notice" }, b.highlights) : undefined,
    ...section("Avalanche Activity", b.avalancheActivity, false),
    ...section("Snowpack", b.snowpackStructure),
    dangerPatterns(b),
    ...section("Weather Review", b.weatherReview),
    ...section("Weather Forecast", b.weatherForecast),
    ...section("Travel Advisory", b.travelAdvisory),
    ...(b.tendency ?? []).flatMap((t) => tendency(t)),
    h("p", { className: "regions" }, [
      h("span", { className: "smallcaps" }, "Regions: "),
      names.join(", ") + ".",
    ]),
  ];

  return h("article", { className: isLead ? "lead" : "story" }, [
    h("p", { className: "kicker" }, kicker),
    h("h2", { className: "headline" }, headline),
    deck && isLead ? h("p", { className: "deck" }, deck) : undefined,
    h("p", { className: "byline" }, byline.join(" · ")),
    h("div", { className: "body" }, [factBox(b), h("div", { className: "text" }, text)]),
  ]);
}

function factBox(b: AvalancheBulletin): HTMLElement {
  const ratings = (b.dangerRatings ?? []).filter((r) => r.mainValue);
  const periods = [...new Set(ratings.map((r) => r.validTimePeriod || "all_day"))];
  const problems = b.avalancheProblems ?? [];
  return h("aside", { className: "box" }, [
    h("h3", {}, "The Danger"),
    ...periods.flatMap((period) => [
      periods.length > 1 || period !== "all_day" ? h("h4", {}, PERIODS[period]) : undefined,
      h(
        "table",
        {},
        ratings.filter((r) => (r.validTimePeriod || "all_day") === period).map((r) => dangerRow(r)),
      ),
    ]),
    problems.length ? h("h3", {}, "Avalanche Problems") : undefined,
    problems.length
      ? h(
          "ol",
          {},
          problems.map((p) => problem(p)),
        )
      : undefined,
  ]);
}

function dangerRow(r: DangerRating): HTMLElement {
  const rating = DANGER_RATINGS[r.mainValue!];
  const n = rating.warnLevelNumber;
  return h("tr", { title: rating.text }, [
    h("th", {}, capitalize(formatElevation(r.elevation))),
    h("td", { className: "scale" }, "■".repeat(n) + "□".repeat(5 - n)),
    h("td", {}, [h("b", {}, String(n || "–")), " ", label(r.mainValue!)]),
  ]);
}

function problem(p: AvalancheProblem): HTMLElement {
  const id = p.problemType.replace(/_/g, "-");
  const facts = [
    p.snowpackStability && `stability ${p.snowpackStability.replace(/_/g, " ")}`,
    p.frequency && `${p.frequency} avalanches`,
    p.avalancheSize && `${SIZES[p.avalancheSize]} in size`,
  ].filter(Boolean);
  return h("li", {}, [
    h(
      "a",
      {
        href: `https://www.avalanches.org/standards/avalanche-problems/#${id}`,
        className: "smallcaps",
      },
      PROBLEMS[p.problemType],
    ),
    p.validTimePeriod && p.validTimePeriod !== "all_day"
      ? ` (${PERIODS[p.validTimePeriod].toLowerCase()})`
      : "",
    h("br"),
    `${formatAspects(p.aspects)}, ${formatElevation(p.elevation)}.`,
    facts.length ? h("br") : undefined,
    facts.length ? capitalize(facts.join(", ")) + "." : "",
    ...(p.comment ? paragraphs(p.comment).map((t) => h("p", {}, t)) : []),
  ]);
}

function section(title: string, texts?: Texts, heading = true): HTMLElement[] {
  if (!texts?.comment && !texts?.highlights) return [];
  return [
    heading ? h("h3", {}, title) : undefined,
    texts.highlights && heading ? h("p", { className: "highlight" }, texts.highlights) : undefined,
    ...paragraphs(texts.comment).map((t) => h("p", {}, t)),
  ].filter((e) => !!e);
}

function tendency(t?: Tendency): HTMLElement[] {
  if (!t) return [];
  const until = t.validTime?.endTime;
  const title = until
    ? `Outlook for ${until.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`
    : "Outlook";
  return [
    h("h3", {}, title),
    t.tendencyType
      ? h("p", { className: "highlight" }, `Danger ${tendencyLabel(t.tendencyType)}.`)
      : undefined,
    ...[t.highlights, ...paragraphs(t.comment)].filter(Boolean).map((s) => h("p", {}, s!)),
  ].filter((e) => !!e);
}

function dangerPatterns(b: AvalancheBulletin): HTMLElement | undefined {
  const patterns: string[] = b.customData?.LWD_Tyrol?.dangerPatterns ?? [];
  if (!patterns.length) return;
  return h("p", { className: "patterns" }, [
    h("span", { className: "smallcaps" }, "Danger patterns: "),
    patterns.map((p) => `${p.replace("DP", "DP ")} — ${DANGER_PATTERNS[p] ?? p}`).join("; ") + ".",
  ]);
}

function tendencyLabel(t: string): string {
  return t === "steady" ? "remains steady" : t;
}

function formatElevation(e?: ElevationBoundaryOrBand): string {
  const f = (x: string) =>
    /^\d+$/.test(x) ? `${Number(x).toLocaleString("en-US")} m` : `the ${x}`;
  const { lowerBound: lo, upperBound: hi } = e ?? {};
  if (lo && hi) return `between ${f(lo)} and ${f(hi)}`;
  if (lo) return `above ${f(lo)}`;
  if (hi) return `below ${f(hi)}`;
  return "all elevations";
}

function formatAspects(aspects?: Aspect[]): string {
  const set = new Set<Aspect>(aspects?.filter((a) => a !== "n/a"));
  if (!set.size) return "All aspects";
  if (set.size === 8) return "All aspects";
  // start the clockwise sequence right after an omitted aspect
  const i = ASPECTS.findIndex((a, i) => set.has(a) && !set.has(ASPECTS[(i + 7) % 8]));
  const ordered = [...ASPECTS.slice(i), ...ASPECTS.slice(0, i)].filter((a) => set.has(a));
  return `${ordered.join("–")} aspects`;
}

function maxDangerValue(b: AvalancheBulletin): DangerRatingValue | undefined {
  return b.dangerRatings
    ?.map((r) => r.mainValue)
    .filter((v) => !!v)
    .sort((x, y) => DANGER_RATINGS[y].warnLevelNumber - DANGER_RATINGS[x].warnLevelNumber)[0];
}

function maxDanger(b: AvalancheBulletin): number {
  const v = maxDangerValue(b);
  return v ? DANGER_RATINGS[v].warnLevelNumber : 0;
}

function label(v: DangerRatingValue): string {
  return capitalize(v.replace(/_/g, " "));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Converts bulletin HTML (paragraphs separated by `<br/>`) into plain-text paragraphs. */
function paragraphs(html?: string): string[] {
  if (!html) return [];
  return html
    .split(/(?:<br\s*\/?>\s*)+/i)
    .map((p) => new DOMParser().parseFromString(p, "text/html").body.textContent?.trim() ?? "")
    .filter((p) => !!p);
}

function formatDate(d: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function shiftDate(d: string, days: number): string {
  const x = new Date(d + "T12:00:00Z");
  x.setUTCDate(x.getUTCDate() + days);
  return x.toISOString().slice(0, 10);
}

function defaultDate(): string {
  const now = new Date();
  if (now.getHours() >= 17) now.setDate(now.getDate() + 1); // tomorrow
  return now.toISOString().slice(0, 10);
}

function link(d: string): string {
  const p = new URLSearchParams(params);
  p.set("date", d);
  p.delete("source");
  return "?" + p;
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let s = "";
  for (const [v, r] of map) {
    while (n >= v) {
      s += r;
      n -= v;
    }
  }
  return s;
}

type Child = Node | string | undefined | false;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: Child | Child[] = [],
): HTMLElementTagNameMap[K] {
  const el = Object.assign(document.createElement(tag), props);
  for (const c of [children].flat()) {
    if (c) el.append(c);
  }
  return el;
}

function regionName(id: string): string {
  return (enRegionNames as Record<string, string>)[id] ?? id;
}
