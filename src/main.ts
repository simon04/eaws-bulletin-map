import * as L from "leaflet";

import "leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js";

import "./style.css";
import "leaflet/dist/leaflet.css";
import type {
  MaxDangerRatings,
  MicroRegionElevationProperties,
  MicroRegionProperties,
  Region,
  Regions,
  StyleFunction,
} from "./types";

const searchParams = new URL(location.href).searchParams;
const date = searchParams.get("date") || "";
const regions: Regions = searchParams.get("regions") || "";
if (!date || !regions) {
  route(
    date || new Date(),
    regions ||
      "AD AT-02 AT-03 AT-04 AT-05 AT-06 AT-07 AT-08 CH CZ DE-BY ES-CT-L ES-CT ES FR GB IS IT-21 IT-23 IT-25 IT-32-BZ IT-32-TN IT-34 IT-36 IT-57 NO PL PL-12 SE SI SK",
    true
  );
}

function route(date: string | Date, regions: Regions, replace = false) {
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

fetchDangerRatings(date).then((maxDangerRatings) =>
  buildMap(maxDangerRatings, date)
);

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

async function fetchDangerRatings(
  date: string,
  region: Region = ""
): Promise<MaxDangerRatings> {
  if (!region) {
    return Promise.all(
      regions
        .split(" ")
        .map((region: Region) => fetchDangerRatings(date, region))
    ).then((maxDangerRatings) =>
      Object.fromEntries(maxDangerRatings.flatMap((o) => Object.entries(o)))
    );
  }
  const { maxDangerRatings } = await fetchJSON<{
    maxDangerRatings: MaxDangerRatings;
  }>(
    `https://static.avalanche.report/eaws_bulletins/${date}/${date}-${region}.ratings.json`,
    { maxDangerRatings: {} }
  );
  return maxDangerRatings;
}

async function fetchJSON<T>(url: string, fallback: T): Promise<T> {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) return fallback;
  try {
    return await res.json();
  } catch {
    return fallback;
  }
}

async function buildMap(
  maxDangerRatings: MaxDangerRatings,
  date: string,
  ampm = ""
) {
  const hidden: L.PathOptions = Object.freeze({ stroke: false, fill: false });
  const dangerRatingColors = [
    "#ffffff",
    "#ccff66",
    "#ffff00",
    "#ff9900",
    "#ff0000",
    "#000000",
  ];
  const dangerRatingStyles = dangerRatingColors.map(
    (fillColor): L.PathOptions => ({
      stroke: false,
      fill: true,
      fillColor,
      fillOpacity: 1.0,
    })
  );
  const style = (id: Region): L.PathOptions => {
    if (ampm) id += ":" + ampm;
    const dangerRating = maxDangerRatings[id];
    if (!dangerRating) return hidden;
    return dangerRatingStyles[dangerRating];
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
