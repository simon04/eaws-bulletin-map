import type { Regions } from "./types";

const searchParams = new URLSearchParams(location.search);
export const date = searchParams.get("date") || "";
export const regions: Regions = searchParams.get("regions") || "";
export const bbox = searchParams.get("bbox") || "";
export const details = searchParams.get("details") || "";
export const stations = searchParams.get("stations") || "";
if (!date || !regions) {
  const now = new Date();
  if (now.getHours() >= 17) now.setDate(now.getDate() + 1); // tomorrow
  to(
    date || now,
    regions ||
      "AD AT-02 AT-03 AT-04 AT-05 AT-06 AT-07 AT-08 CH CZ DE-BY ES-CT-L ES-CT ES FI FR GB IS IT-21 IT-23 IT-25 IT-32-BZ IT-32-TN IT-34 IT-36 IT-57 NO PL PL-12 SE SI SK UA",
    true,
  );
}
export function to(date: string | Date, regions: Regions, replace = false) {
  if (date instanceof Date) {
    date = date.toISOString().slice(0, "2006-01-02".length);
  }
  const params = new URLSearchParams({ date, regions, bbox, details, stations });
  params.forEach((value, key) => value || params.delete(key));
  const url = "?" + params;
  if (replace) {
    location.replace(url);
  } else {
    location.assign(url);
  }
}
