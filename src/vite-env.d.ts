/// <reference types="vite/client" />

import type {
  InteractiveLayerOptions,
  GridLayerOptions,
  PathOptions,
} from "leaflet";

declare module "leaflet" {
  interface VectorGridOptions
    extends InteractiveLayerOptions,
      GridLayerOptions {
    vectorTileLayerStyles?: Record<string, (properties: any) => PathOptions>;
  }
}
