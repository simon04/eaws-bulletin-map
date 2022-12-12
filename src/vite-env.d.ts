/// <reference types="vite/client" />

import type {
  InteractiveLayerOptions,
  GridLayerOptions,
  PathOptions,
} from "leaflet";
import {
  MicroRegionElevationProperties,
  MicroRegionProperties,
  RegionOutlineProperties,
} from "./types";

declare module "leaflet" {
  interface VectorGridOptions
    extends InteractiveLayerOptions,
      GridLayerOptions {
    getFeatureId?({
      properties,
    }: {
      properties:
        | MicroRegionElevationProperties
        | MicroRegionProperties
        | RegionOutlineProperties;
    });
    vectorTileLayerStyles?: Record<string, (properties: any) => PathOptions>;
  }
}
