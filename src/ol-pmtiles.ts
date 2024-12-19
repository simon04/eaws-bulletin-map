// https://github.com/protomaps/PMTiles/blob/9a53ed849517bf486a6362fd8bc521fc51e16d19/openlayers/src/index.ts
// BSD-3-Clause license
import { type FeatureLike } from "ol/Feature";
import { MVT } from "ol/format";
import type RenderFeature from "ol/render/Feature";
import {
  default as VectorTileSource,
  type Options as VectorTileSourceOptions,
} from "ol/source/VectorTile";
import type Tile from "ol/Tile";
import { createXYZ, extentFromProjection } from "ol/tilegrid";
import TileState from "ol/TileState";
import type VectorTile from "ol/VectorTile";
import { Header, PMTiles, Source } from "pmtiles";

type Options = VectorTileSourceOptions<RenderFeature> & {
  url: string | Source;
};

export class PMTilesVectorSource extends VectorTileSource {
  pmtiles: PMTiles;

  constructor(options: Options) {
    super({
      ...options,
      ...{
        state: "loading",
        url: "pmtiles://{z}/{x}/{y}",
        format: options.format || new MVT(),
      },
    });

    this.pmtiles = new PMTiles(options.url);
    this.pmtiles.getHeader().then((h: Header) => this.init(options, h));
  }

  private init(options: Options, h: Header) {
    const projection = options.projection || "EPSG:3857";
    const extent = options.extent || extentFromProjection(projection);
    this.tileGrid =
      options.tileGrid ||
      createXYZ({
        extent,
        maxResolution: options.maxResolution,
        maxZoom: options.maxZoom !== undefined ? options.maxZoom : h.maxZoom,
        minZoom: h.minZoom,
        tileSize: options.tileSize || 512,
      });
    this.setTileLoadFunction((tile: Tile, url: string) => {
      // the URL construction is done internally by OL, so we need to parse it
      // back out here using a hacky regex
      const re = new RegExp(/pmtiles:\/\/(\d+)\/(\d+)\/(\d+)/);
      const result = url.match(re);

      if (!(result && result.length >= 4)) {
        throw Error("Could not parse tile URL");
      }
      const z = +result[1];
      const x = +result[2];
      const y = +result[3];

      const vtile = tile as VectorTile<FeatureLike>;
      vtile.setLoader(async (extent, _r, projection) => {
        try {
          const result = await this.pmtiles.getZxy(z, x, y);
          if (!result) {
            vtile.setFeatures([]);
            vtile.setState(TileState.EMPTY);
            return;
          }
          const format = vtile.getFormat();
          const features = format.readFeatures(result.data, {
            extent,
            featureProjection: projection,
          });
          vtile.setFeatures(features);
          vtile.setState(TileState.LOADED);
        } catch (e) {
          vtile.setFeatures([]);
          vtile.setState(TileState.ERROR);
        }
      });
    });
    this.setState("ready");
  }
}
