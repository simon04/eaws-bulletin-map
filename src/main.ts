import type * as z from "@zod/mini";
import { Control, defaults as defaultControls } from "ol/control";
import { defaults as defaultInteractions, Interaction } from "ol/interaction";
import { PMTilesVectorSource } from "./ol-pmtiles";
import { fromLonLat } from "ol/proj";
import EventType from "ol/events/EventType";
import Fill from "ol/style/Fill";
import GeolocationButton from "ol-ext/control/GeolocationButton";
import Map from "ol/Map";
import Popup from "ol-ext/overlay/Popup";
import SearchNominatim from "ol-ext/control/SearchNominatim";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import TileLayer from "ol/layer/Tile";
import type { MapBrowserEvent } from "ol";
import VectorTileLayer from "ol/layer/VectorTile";
import View from "ol/View";
import XYZ from "ol/source/XYZ";
import "ol/ol.css";
import "ol-ext/dist/ol-ext.css";
import { dropWhile, takeWhile } from "lodash";
import "./style.css";
import eawsOutlineProperties from "@eaws/outline_properties/index.json";

import type {
  FeatureProperties,
  MicroRegionElevationProperties,
  MicroRegionProperties,
  Region,
  Regions,
} from "./types";
import {
  AvalancheBulletinsSchema,
  type Aspect,
  type AvalancheBulletin,
  type AvalancheProblemType,
  type DangerRatingValue,
  type ElevationBoundaryOrBand,
} from "./caaml";
import { DANGER_RATINGS, type DangerRatingConfig } from "./danger-ratings";

const searchParams = new URL(location.href).searchParams;
const date = searchParams.get("date") || "";
const regions: Regions = searchParams.get("regions") || "";
const bbox = searchParams.get("bbox") || "";
const details = searchParams.get("details") || "";
if (!date || !regions) {
  const now = new Date();
  if (now.getHours() >= 17) now.setDate(now.getDate() + 1); // tomorrow
  route(
    date || now,
    regions ||
      "AD AT-02 AT-03 AT-04 AT-05 AT-06 AT-07 AT-08 CH CZ DE-BY ES-CT-L ES-CT ES FI FR GB IS IT-21 IT-23 IT-25 IT-32-BZ IT-32-TN IT-34 IT-36 IT-57 NO PL PL-12 SE SI SK UA",
    true,
  );
}

function route(date: string | Date, regions: Regions, replace = false) {
  if (date instanceof Date) {
    date = date.toISOString().slice(0, "2006-01-02".length);
  }
  const params = new URLSearchParams({ date, regions, bbox, details });
  params.forEach((value, key) => value || params.delete(key));
  const url = "?" + params;
  if (replace) {
    location.replace(url);
  } else {
    location.assign(url);
  }
}

const popup = new Popup({
  popupClass: "default",
  closeBox: true,
  positioning: "auto",
});

const map = initMap();

fetchBulletins(date).then((bulletins) => {
  buildMap(bulletins, date);
  buildMarkerMap(bulletins);
});

function initMap() {
  const mapElement = document.querySelector<HTMLDivElement>("#map")!;

  class ClosePopup extends Interaction {
    handleEvent(mapBrowserEvent: MapBrowserEvent<KeyboardEvent>): boolean {
      if (
        mapBrowserEvent.type !== EventType.KEYDOWN &&
        mapBrowserEvent.type !== EventType.KEYPRESS
      ) {
        return true;
      } else if (mapBrowserEvent.originalEvent.key !== "Escape") {
        return true;
      }
      popup.hide();
      return false;
    }
  }

  class DateControl extends Control {
    constructor() {
      const input = document.createElement("input");
      input.style.fontSize = "18px";
      input.style.padding = "2px";
      input.type = "date";
      input.value = date;
      input.onchange = () => route(input.valueAsDate!, regions);
      const div = document.createElement("div");
      div.className = "ol-date-control ol-unselectable ol-control";
      div.appendChild(input);
      super({ element: div });
    }
  }

  const map = new Map({
    target: mapElement,
    controls: defaultControls().extend([new DateControl()]),
    interactions: defaultInteractions({
      mouseWheelZoom: window.self === window.top,
    }),
    keyboardEventTarget: document,
    overlays: [popup],
    view: new View({
      zoom: 5,
      center: fromLonLat([11.3, 47.3]),
      enableRotation: false,
    }),
    layers: [
      new TileLayer({
        source: new XYZ({
          url: "https://static.avalanche.report/tms/{z}/{x}/{y}.webp",
          attributions: [
            '🌍 <a href="https://github.com/simon04/eaws-bulletin-map">simon04/eaws-bulletin-map</a> (GPLv3)',
            '<a href="https://gitlab.com/albina-euregio">albina-euregio</a> (GPLv3, CC BY 4.0)',
            '<a href="https://sonny.4lima.de/">Sonny</a> (CC BY 4.0)',
            '<a href="https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b">EU-DEM</a> (CC BY 4.0)',
          ],
          maxZoom: 12,
          minZoom: 3,
        }),
      }),
    ],
  });

  if (bbox) {
    // Austria: bbox=9.47996951665,46.4318173285,16.9796667823,49.0390742051
    const [left, bottom, right, top] = bbox.split(",").map((v) => +v);
    const extent = [...fromLonLat([left, bottom]), ...fromLonLat([right, top])];
    map.getView().fit(extent, { size: map.getSize() });
  }

  map.addInteraction(new ClosePopup());

  map.addControl(new GeolocationButton());

  const geocoder = new SearchNominatim({});
  map.addControl(geocoder);
  geocoder.on("select", (e: any) => {
    map.getView().animate({
      center: e.coordinate,
      zoom: Math.max(map.getView().getZoom() ?? 0, 16),
    });
  });

  return map;
}

async function fetchBulletins(
  date: string,
  region: Region = "",
): Promise<AvalancheBulletin[]> {
  if (!region) {
    return Promise.all(
      regions.split(" ").map((region: Region) => fetchBulletins(date, region)),
    ).then((bulletins) => bulletins.flatMap((b) => b));
  }
  const { bulletins } = await fetchJSON(
    `https://static.avalanche.report/eaws_bulletins/${date}/${date}-${region}.json`,
    { bulletins: [] },
    AvalancheBulletinsSchema,
  );
  return bulletins;
}

async function fetchJSON<T extends z.ZodMiniType>(
  url: string,
  fallback: z.z.core.output<T>,
  schema: T,
): Promise<z.z.core.output<T>> {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) return fallback;
  let json;
  try {
    json = await res.json();
  } catch (e) {
    return await schema.parseAsync(fallback);
  }
  try {
    return await schema.parseAsync(json);
  } catch (e) {
    console.warn("Failed to validate CAAML", json, e);
    return await schema.parseAsync(fallback);
  }
}

function dangerRatingLink(
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

const vectorRegions = new PMTilesVectorSource({
  url: "https://static.avalanche.report/eaws-regions.pmtiles",
  attributions: [
    ...Object.values(DANGER_RATINGS).map((rating) => dangerRatingLink(rating)),
    '<a href="https://gitlab.com/eaws/eaws-regions">eaws/eaws-regions</a> (CC0)',
    '<a href="https://gitlab.com/albina-euregio/pyAvaCore">albina-euregio/pyAvaCore</a> (GPLv3)',
  ],
  maxZoom: 10,
});

async function buildMap(bulletins: AvalancheBulletin[], date: string) {
  const dangerRatingStyles = Object.fromEntries(
    Object.values(DANGER_RATINGS).map(({ warnLevelNumber, color }) => [
      warnLevelNumber,
      new Style({ fill: new Fill({ color }), zIndex: warnLevelNumber }),
    ]),
  );
  const regionIDs = regions.split(" ");
  const bulletingsByRegionID = Object.fromEntries(
    bulletins.flatMap((b) =>
      (b.regions ?? [])
        .filter((r) => regionIDs.some((id) => r.regionID.startsWith(id)))
        .map((r) => [r.regionID, b]),
    ),
  );
  const style = ({
    id,
    elevation,
    threshold,
  }: MicroRegionElevationProperties): Style => {
    const dangerRatings = bulletingsByRegionID[id]?.dangerRatings ?? [];
    if (
      elevation === "high" &&
      dangerRatings
        .map((rating) => rating.elevation?.lowerBound)
        .some(
          (bound) =>
            bound !== undefined &&
            threshold !== undefined &&
            +bound > threshold,
        )
    ) {
      elevation = "low";
    }
    const dangerRating = dangerRatings
      .filter(
        (rating) =>
          elevation === "low_high" ||
          (!rating?.elevation?.upperBound && !rating?.elevation?.lowerBound) ||
          (rating?.elevation?.upperBound && elevation === "low") ||
          (rating?.elevation?.lowerBound && elevation === "high"),
      )
      .map((rating) => DANGER_RATINGS[rating?.mainValue]?.warnLevelNumber ?? 0)
      .reduce<number>((a, b) => Math.max(a, b), 0);
    return dangerRatingStyles[dangerRating ?? 0];
  };
  const layer = new VectorTileLayer({
    source: vectorRegions,
    style(feature): Style | undefined {
      const properties = feature.getProperties() as FeatureProperties;
      return filterFeature(properties, date) &&
        properties.layer === "micro-regions_elevation"
        ? style(properties)
        : undefined;
    },
  });
  layer.on("prerender", (e) => {
    if (e.context instanceof CanvasRenderingContext2D) {
      e.context.globalCompositeOperation = "multiply";
    }
  });
  map.addLayer(layer);
}

async function buildMarkerMap(bulletins: AvalancheBulletin[]) {
  const selectedStyle = new Style({
    stroke: new Stroke({
      width: 0.5,
      color: "#000000",
    }),
  });

  const layer = new VectorTileLayer({
    source: vectorRegions,
    style(feature): Style | undefined {
      const properties = feature.getProperties() as FeatureProperties;
      return filterFeature(properties, date) &&
        properties.layer === "micro-regions" &&
        properties.id === layer.get("regionID")
        ? selectedStyle
        : undefined;
    },
  });

  layer.on("change:regionID" as unknown as "change", () => {
    layer.changed();
  });

  map.addLayer(layer);

  map.on("pointermove", (e) => {
    requestAnimationFrame(() => {
      const regionID = findMicroRegionID(e);
      layer.set("regionID", regionID);
    });
  });

  map.on("click", (e) => {
    const regionID = findMicroRegionID(e);
    if (!regionID) {
      return;
    }
    const bulletin = bulletins.find((b) =>
      b.regions?.some((r) => r.regionID === regionID),
    );
    if (bulletin) {
      popup.show(e.coordinate, formatBulletin(regionID, bulletin));
      return;
    }
    const aws = eawsOutlineProperties.filter((p) => regionID.startsWith(p.id));
    if (aws.length) {
      const a = aws.reduce((a, b) => (a.id.length > b.id.length ? a : b));
      popup.show(e.coordinate, formatEawsOutline(a));
      return;
    }
  });
}

function findMicroRegionID(e: MapBrowserEvent<any>): Region | undefined {
  return map
    .getFeaturesAtPixel(e.pixel)
    .map((feature) => {
      const properties = feature.getProperties() as FeatureProperties;
      return filterFeature(properties, date) &&
        (properties.layer === "micro-regions" ||
          properties.layer === "micro-regions_elevation")
        ? properties.id
        : undefined;
    })
    .find((regionID) => !!regionID);
}

function formatBulletin(
  region: Region,
  bulletin: AvalancheBulletin,
): HTMLElement {
  const result = document.createElement("dl");

  const provider = result.appendChild(document.createElement("dt"));
  const providerLink = provider.appendChild(document.createElement("a"));
  providerLink.innerText = bulletin.source?.provider?.name || "";
  providerLink.href = bulletin.source?.provider?.website || "";
  providerLink.target = "_blank";
  providerLink.rel = "external";

  if (details === "0") return result;

  const formatElevation = (e?: ElevationBoundaryOrBand) =>
    `🏔 ${e?.lowerBound || 0}..${e?.upperBound || "∞"}`;
  const formatAspects = (aspects0?: Aspect[]) => {
    if (!Array.isArray(aspects0) || !aspects0.length) return "";
    let aspects: Aspect[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    aspects = [...aspects, ...aspects];
    aspects = dropWhile(aspects, (a) => aspects0.includes(a));
    aspects = dropWhile(aspects, (a) => !aspects0.includes(a));
    aspects = takeWhile(aspects, (a) => aspects0.includes(a));
    if (aspects.length > 3) {
      const main: Aspect[] = ["N", "S", "W", "E"];
      aspects = [
        aspects[0],
        main.find((a) => aspects0.includes(a))!,
        aspects[aspects.length - 1],
      ];
      return "🧭 " + aspects.join("↷");
    } else {
      return "🧭 " + aspects.join(",");
    }
  };
  result.appendChild(document.createElement("dd")).innerHTML =
    region +
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

function filterFeature(
  properties: MicroRegionProperties | MicroRegionElevationProperties,
  today: string,
): boolean {
  return (
    (!properties.start_date || properties.start_date <= today) &&
    (!properties.end_date || properties.end_date > today)
  );
}

function formatEawsOutline(
  aws: (typeof eawsOutlineProperties)[number],
): HTMLElement {
  const result = document.createElement("dl");
  for (const p of aws.aws) {
    const provider = result.appendChild(document.createElement("dt"));
    const providerLink = provider.appendChild(document.createElement("a"));
    providerLink.innerText = p.name;
    providerLink.href = Object.entries(p.url).find(
      ([id]) => id.length === 2,
    )?.[1];
    providerLink.target = "_blank";
    providerLink.rel = "external";
  }
  return result;
}
