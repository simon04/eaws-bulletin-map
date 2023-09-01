export type Region = string;
export type Regions = string;
export type WarnLevelNumber = 0 | 1 | 2 | 3 | 4 | 5;
export type MaxDangerRatings = Record<Region, WarnLevelNumber>;
export type LanguageCode = string;

export interface MicroRegionElevationProperties {
  id: string;
  elevation: "high" | "low" | "low_high";
  "elevation line_visualization"?: number;
  threshold?: number;
  start_date?: string;
  end_date?: string;
}

export interface MicroRegionProperties {
  id: string;
  start_date?: string;
  end_date?: string;
}

export interface RegionOutlineProperties {
  id: string;
  aws: Aws[];
}

export interface Aws {
  name: string;
  url: { [key: LanguageCode]: string }[];
}

export type StyleFunction = {
  "micro-regions_elevation": (
    properties: MicroRegionElevationProperties,
  ) => L.PathOptions;
  "micro-regions": (properties: MicroRegionProperties) => L.PathOptions;
  outline: (properties: RegionOutlineProperties) => L.PathOptions;
};
