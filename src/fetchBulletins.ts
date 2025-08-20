import type * as z from "zod/mini";
import { type AvalancheBulletin, AvalancheBulletinsSchema } from "./caaml";
import type { Region } from "./types";

export async function fetchBulletins(
  date: string,
  region: Region | Region[],
): Promise<AvalancheBulletin[]> {
  if (Array.isArray(region)) {
    return Promise.all(region.map((r) => fetchBulletins(date, r))).then(
      (bulletins) => bulletins.flatMap((b) => b),
    );
  }
  const { bulletins } = await fetchJSON(
    `https://static.avalanche.report/eaws_bulletins/${date}/${date}-${region}.json`,
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
