import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import Extent from "@arcgis/core/geometry/Extent";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { Dropdown, Menu } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import esriConfig from "@arcgis/core/config";

export type Inspector = {
  id: number;
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
  status: string;
  statusAr: string;
  details?: { zone: string; lastCheckIn: string };
  markerType?: "default" | "google-pin";
  zone?: string;
};

interface ArcGISMapProps {
  inspectors: Inspector[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onInspectorClick?: (inspector: Inspector) => void;
  onlyInspector?: Inspector | null;
  clickable?: boolean;
}

const featureServiceUrls = [
  "https://services1.arcgis.com/0zsuvMZIPja7Lm9C/arcgis/rest/services/Testing_2/FeatureServer",
  "https://services1.arcgis.com/0zsuvMZIPja7Lm9C/arcgis/rest/services/Testing_3/FeatureServer",
  "https://services1.arcgis.com/0zsuvMZIPja7Lm9C/arcgis/rest/services/RTA_Dubai/FeatureServer",
];

const ArcGISMap: React.FC<ArcGISMapProps> = ({
  inspectors,
  center = [55.2743, 25.1972],
  zoom = 15,
  height = "500px",
  onInspectorClick,
  onlyInspector = null,
  clickable = true,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const featureLayersRef = useRef<__esri.FeatureLayer[]>([]);
  const [basemap, setBasemap] = useState("streets-navigation-vector");

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({ basemap });
    const view = new MapView({
      container: mapRef.current,
      map,
      center,
      zoom,
    });
    viewRef.current = view;

    esriConfig.request.interceptors.push({
      urls: featureServiceUrls,
      before: function (params) {
        params.requestOptions.query = params.requestOptions.query || {};
        params.requestOptions.query.token =
          "mzFcMRqhxzPAoRJavp2MJpSdUV_UVcsTrLt1Ox-VIw0tFjEM4ACDyL0H2CwsFUUc-qpr7tKNNafX4hbIhhJekyPNZP0hkq3qUnERH5uBsEuKSFY9_j_jftyQSq4685glDBt9-jy-dc2qvgxc8D_l5tBogE7INT8cd1bJjRvbBGXiQGHBVLyFhM4vCg6RdA17";
      },
    });

    // add all feature layers (use /0 endpoint)
    featureLayersRef.current = featureServiceUrls.map((url) => {
      const layerUrl = url.endsWith("/0") ? url : `${url.replace(/\/+$/, "")}/0`;
      const fl = new FeatureLayer({ url: layerUrl });
      map.add(fl);
      return fl;
    });

    // watch but do not auto-zoom to full extent
    view.when(() => {
      featureLayersRef.current.forEach((fl) => {
        fl.when().catch((e) => console.warn("[ArcGISMap] feature layer load failed:", e));
      });

      Promise.all(featureLayersRef.current.map((f) => f.when().catch(() => null))).then(() => {
        featureLayersRef.current.forEach((fl) => {
          view
            .whenLayerView(fl)
            .then((lv) => {
              lv.watch("updating", (updating) => {
                if (!updating) {
                  // intentionally left blank
                }
              });
            })
            .catch(() => {});
        });
      });
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      featureLayersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewRef.current) viewRef.current.map.basemap = basemap as any;
  }, [basemap]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.graphics.removeAll();

    const toDraw = onlyInspector ? [onlyInspector] : inspectors;

    toDraw.forEach((inspector) => {
      const point = new Point({
        longitude: inspector.lng,
        latitude: inspector.lat,
      });

      const symbol =
        inspector.markerType === "google-pin"
          ? new PictureMarkerSymbol({
              url: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png",
              width: "32px",
              height: "32px",
            })
          : new PictureMarkerSymbol({
              url: "/images/Inspector.png",
              width: "40px",
              height: "40px",
            });

      const graphic = new Graphic({
        geometry: point,
        symbol,
        attributes: { inspector },
      });

      view.graphics.add(graphic);
    });

    // when a single inspector is shown, zoom out a bit more than before
    if (onlyInspector) {
      const lng = onlyInspector.lng;
      const lat = onlyInspector.lat;
      const SINGLE_ZOOM = 13; // reduced number -> more zoomed out
      view
        .goTo({ center: [lng, lat], zoom: SINGLE_ZOOM }, { duration: 600 })
        .catch((e) => console.warn("goTo single inspector failed:", e));
    } else {
      if (inspectors.length > 1) {
        const lngs = inspectors.map((i) => i.lng);
        const lats = inspectors.map((i) => i.lat);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        const lngPadding = (maxLng - minLng) * 0.35 || 0.02;
        const latPadding = (maxLat - minLat) * 0.35 || 0.02;

        const xmin = minLng - lngPadding;
        const xmax = maxLng + lngPadding;
        const ymin = minLat - latPadding;
        const ymax = maxLat + latPadding;

        const spanX = Math.abs(xmax - xmin);
        const spanY = Math.abs(ymax - ymin);
        if (spanX > 0 && spanY > 0 && spanX <= 30 && spanY <= 30) {
          const extent = new Extent({
            xmin,
            ymin,
            xmax,
            ymax,
            spatialReference: { wkid: 4326 },
          });
          view.goTo({ target: extent }, { duration: 600 }).catch(() => {
            view.goTo({ center, zoom }).catch(() => {});
          });
        } else {
          view.goTo({ center, zoom }).catch(() => {});
        }
      } else if (inspectors.length === 1) {
        const only = inspectors[0];
        view.goTo({ center: [only.lng, only.lat], zoom: 13 }).catch(() => {});
      } else {
        view.goTo({ center, zoom }).catch(() => {});
      }
    }

    let clickHandle: any = null;
    if (clickable && onInspectorClick) {
      try {
        clickHandle = (view as any).on("click", (event: any) => {
          view.hitTest(event).then((response: any) => {
            if (response.results && response.results.length > 0) {
              const g = response.results[0].graphic;
              const insp = g?.attributes?.inspector;
              if (insp) onInspectorClick(insp);
            }
          });
        });
      } catch (e) {}
    }

    return () => {
      if (clickHandle && typeof clickHandle.remove === "function") clickHandle.remove();
    };
  }, [inspectors, onlyInspector, clickable, onInspectorClick, center, zoom]);

  const menu = (
    <Menu
      onClick={(e) => setBasemap(e.key)}
      items={[
        { key: "streets-navigation-vector", label: "Streets (Day)" },
        { key: "streets-night-vector", label: "Streets (Night)" },
        { key: "satellite", label: "Satellite" },
        { key: "osm", label: "OpenStreetMap" },
        { key: "topo-vector", label: "Topographic" },
      ]}
    />
  );

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: height, minHeight: "400px" }} />
      <Dropdown overlay={menu} trigger={["click"]}>
        <MoreOutlined
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            fontSize: 22,
            background: "#fff",
            borderRadius: "4px",
            padding: 8,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        />
      </Dropdown>
    </div>
  );
};

export default ArcGISMap;
