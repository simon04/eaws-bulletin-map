export type Region = string;
export type WarnLevelNumber = 0 | 1 | 2 | 3 | 4 | 5;
export type MaxDangerRatings = Record<Region, WarnLevelNumber>;

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
