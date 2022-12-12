import * as L from "leaflet";

import "leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js";

import "./style.css";
import "leaflet/dist/leaflet.css";
import type {
  MaxDangerRatings,
  MicroRegionElevationProperties,
  MicroRegionProperties,
  Region,
} from "./types";

const searchParams = new URL(location.href).searchParams;
const date = searchParams.get("date") || "";
const regions = searchParams.get("regions") || "";
if (!date || !regions) {
  route(
    date || new Date(),
    regions ||
      "AD AT-02 AT-03 AT-04 AT-05 AT-06 AT-07 AT-08 CH CZ DE-BY ES-CT-L ES-CT ES FR GB IS IT-21 IT-23 IT-25 IT-32-BZ IT-32-TN IT-34 IT-36 IT-57 NO PL PL-12 SE SI SK",
    true
  );
}

function route(date: string | Date, regions: string, replace = false) {
  if (date instanceof Date) {
    date = date.toISOString().slice(0, "2006-01-02".length);
  }
  const url = "?" + new URLSearchParams({ date, regions });
  if (replace) {
    location.replace(url);
  } else {
    location.assign(url);
  }
}

const map = initMap();

Promise.all(regions.split(" ").map((region) => fetchBulletins(date, region)))
  .then((maxDangerRatings) =>
    Object.fromEntries([...maxDangerRatings.flatMap((o) => Object.entries(o))])
  )
  .then((maxDangerRatings) => buildMap(maxDangerRatings, date));

function initMap() {
  const mapElement = document.querySelector<HTMLDivElement>("#map")!;
  const map = L.map(mapElement, {
    center: { lat: 47.3, lng: 11.3 },
    zoom: 5,
    attributionControl: false,
    zoomControl: false,
  });
  L.control.attribution({ prefix: "🌍 simon04/eaws-bulletin-map" }).addTo(map);
  L.tileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
    attribution: "albina-euregio",
    maxZoom: 12,
    minZoom: 3,
  }).addTo(map);
  const dateControl = new L.Control({ position: "topleft" });
  dateControl.onAdd = () => {
    const input = L.DomUtil.create("input");
    input.style.fontSize = "18px";
    input.style.padding = "2px";
    input.type = "date";
    input.value = date;
    input.onchange = () => route(input.valueAsDate!, regions);
    const div = L.DomUtil.create("div");
    div.classList.add("leaflet-bar");
    div.appendChild(input);
    return div;
  };
  dateControl.addTo(map);
  L.control.zoom().addTo(map);
  return map;
}

async function fetchBulletins(
  date: string,
  region: Region = ""
): Promise<MaxDangerRatings> {
  const res = await fetch(
    `https://static.avalanche.report/eaws_bulletins/${date}/${date}${
      region ? "-" + region : ""
    }.ratings.json`,
    { cache: "no-cache" }
  );
  if (!res.ok) return {};
  try {
    const json = await res.json();
    return json.maxDangerRatings;
  } catch {
    return {};
  }
}

async function buildMap(
  maxDangerRatings: MaxDangerRatings,
  date: string,
  ampm = ""
) {
  const hidden: L.PathOptions = Object.freeze({ stroke: false, fill: false });
  const style = (id: string): L.PathOptions => {
    if (ampm) id += ":" + ampm;
    const warnlevel = maxDangerRatings[id];
    if (!warnlevel) return hidden;
    return WARNLEVEL_STYLES[warnlevel];
  };
  type StyleFunction = {
    "micro-regions_elevation": (
      properties: MicroRegionElevationProperties
    ) => L.PathOptions;
    "micro-regions": (properties: MicroRegionProperties) => L.PathOptions;
    outline: (properties: unknown) => L.PathOptions;
  };
  const vectorTileLayerStyles: StyleFunction = {
    "micro-regions_elevation"(properties) {
      if (!filterFeature(properties, date)) return hidden;
      return properties.elevation === "low_high"
        ? style(properties.id)
        : style(properties.id + ":" + properties.elevation);
    },
    "micro-regions"() {
      return hidden;
    },
    outline() {
      return hidden;
    },
  };
  L.vectorGrid
    .protobuf("https://static.avalanche.report/eaws_pbf/{z}/{x}/{y}.pbf", {
      attribution: "eaws/eaws-regions, albina-euregio/pyAvaCore",
      pane: "overlayPane",
      interactive: false,
      maxNativeZoom: 10,
      vectorTileLayerStyles,
    })
    .addTo(map);
}

function filterFeature(
  properties: MicroRegionProperties | MicroRegionElevationProperties,
  today: string = new Date().toISOString().slice(0, "2006-01-02".length)
): boolean {
  return (
    (!properties.start_date || properties.start_date <= today) &&
    (!properties.end_date || properties.end_date > today)
  );
}

const WARNLEVEL_COLORS = Object.freeze([
  "#ffffff",
  "#ccff66",
  "#ffff00",
  "#ff9900",
  "#ff0000",
  "#000000",
]);

const WARNLEVEL_STYLES = WARNLEVEL_COLORS.map((fillColor) =>
  Object.freeze({
    stroke: false,
    fill: true,
    fillColor,
    fillOpacity: 1.0,
  })
);
