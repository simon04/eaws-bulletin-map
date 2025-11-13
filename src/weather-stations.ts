import { GeoJSON } from "ol/format";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import CircleStyle from "ol/style/Circle";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Style from "ol/style/Style";
import { LineaPlot } from "@albina-euregio/linea/src/linea-plot";
import { FeatureLike } from "ol/Feature";

export const WeatherStationSymbol = Symbol();

export async function getWeatherStationsLayer() {
  const response = await fetch(
    "https://static.avalanche.report/weather_stations/stations.geojson",
  );
  const geojson = await response.json();
  const format = new GeoJSON({ featureProjection: "EPSG:3857" });
  const features = format.readFeatures(geojson);
  features.forEach((f) => {
    f.set("$type", WeatherStationSymbol);
    const id = f.get("LWD-Nummer") ?? f.getId();
    const srcSMET = `https://api.avalanche.report/lawine/grafiken/smet/woche/${id}.smet.gz`;
    f.set("srcSMET", srcSMET);
  });
  const attributions = [
    '<a href="https://avalanche.report/weather/archive">Weather Station Archive | Avalanche.report</a> (CC BY 4.0</a>)',
    '<a href="https://gitlab.com/albina-euregio/linea">albina-euregio/linea</a> (LGPLv3)',
  ];
  const source = new VectorSource({ features, attributions });

  const image = new CircleStyle({
    stroke: new Stroke({ color: "rgba(49, 163, 84, 0.8)" }),
    fill: new Fill({ color: "rgba(49, 163, 84, 0.5)" }),
    radius: 4,
  });
  const style = new Style({ image });

  const layer = new VectorLayer({ source, style });
  return layer;
}

export function getWeatherStationPopup(feature: FeatureLike): HTMLElement {
  const p = new LineaPlot();
  p.style.display = "block";
  p.style.width = "100%";
  p.style.minHeight = "400px";
  try {
    p.setAttribute("src", feature.get("srcSMET"));
    p.setAttribute("showTitle", "1");
  } catch {}
  return p;
}
