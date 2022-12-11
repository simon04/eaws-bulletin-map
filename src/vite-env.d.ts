/// <reference types="vite/client" />

import type { VectorGrid } from "leaflet";

declare module "@react-leaflet/core" {
  interface LeafletContextInterface {
    vectorGrid: VectorGrid;
  }
}
