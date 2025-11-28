import type * as z from "zod/mini";
import { type AvalancheBulletin, AvalancheBulletinsSchema } from "./caaml";
import type { Region } from "./types";
import eawsOutlineProperties from "@eaws/outline_properties/index.json";

export async function fetchBulletins(
  date: string,
  region: Region | Region[],
): Promise<AvalancheBulletin[]> {
  if (Array.isArray(region)) {
    return Promise.all(region.map((r) => fetchBulletins(date, r))).then(
      (bulletins) => bulletins.flatMap((b) => b),
    );
  }

  const aws = eawsOutlineProperties.find((p) => region === p.id)?.aws;
  let url = aws
    ?.map(({ url }) => (url as { "api:date"?: string })["api:date"])
    ?.filter((url) => !url?.startsWith("https://bollettini.aineva.it/")) // CORS not supported
    ?.find((url) => url?.endsWith("CAAMLv6.json"))
    ?.replace(/{date}/g, date)
    ?.replace(/{region}/g, region)
    ?.replace(/{lang}/g, "en");
  url ??= `https://static.avalanche.report/eaws_bulletins/${date}/${date}-${region}.json`;

  const { bulletins } = await fetchJSON(
    url,
    { bulletins: [] },
    AvalancheBulletinsSchema,
  );
  return bulletins;
}

export async function fetchJSON<T extends z.ZodMiniType>(
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
