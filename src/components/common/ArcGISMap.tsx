import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import Extent from "@arcgis/core/geometry/Extent";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { Dropdown, Menu } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import esriConfig from "@arcgis/core/config";
import { MAP_ICONS } from "./mapIconUrls";

export type Inspector = {
  id: number | string;
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
  status: string;
  statusAr: string;
  details?: { zone: string; lastCheckIn: string };
  markerType?: "default" | "google-pin" | "start" | "end";
  zone?: string;
};

export type InspectorPath = Array<{ lat: number; lng: number; timestamp: string }>;
export type FineLocation = {
  id: string;
  lat: number;
  lng: number;
  fineAmount: number;
  timestamp: string;
  plateNumber: string;
};

export type ObstacleLocation = {
  id: string;
  lat: number;
  lng: number;
  createdDateTime?: string;
};

interface ArcGISMapProps {
  inspectors: Inspector[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onInspectorClick?: (inspector: Inspector) => void;
  onlyInspector?: Inspector | null;
  clickable?: boolean;
  inspectorPath?: InspectorPath;
  fineLocations?: FineLocation[];
  warningLocations?: any[];
  routineLocations?: any[];
  towingLocations?: any[];
  obstacleLocations?: ObstacleLocation[];
  showPath?: boolean;
  showFineLocations?: boolean;
  onLocationPick?: (lat: number, lng: number) => void;
  pickedLat?: number | null;
  pickedLng?: number | null;
  showTowingRoute?: boolean;
  towingStartPoint?: { lat: number; lng: number };
  towingEndPoint?: { lat: number; lng: number };
}

const featureServiceUrls = [
  "https://services1.arcgis.com/0zsuvMZIPja7Lm9C/arcgis/rest/services/Testing_2/FeatureServer",
  "https://services1.arcgis.com/0zsuvMZIPja7Lm9C/arcgis/rest/services/Testing_3/FeatureServer",
  "https://services1.arcgis.com/0zsuvMZIPja7Lm9C/arcgis/rest/services/RTA_Dubai/FeatureServer",
];

const PIN_W = "50px";
const PIN_H = "50px";
const START_SIZE = "40px";
const AVATAR_SIZE = "90px";

const ArcGISMap: React.FC<ArcGISMapProps> = ({
  inspectors,
  center = [55.2743, 25.1972],
  zoom = 15,
  height = "500px",
  onInspectorClick,
  onlyInspector = null,
  clickable = true,
  inspectorPath = [],
  fineLocations = [],
  warningLocations = [],
  routineLocations = [],
  towingLocations = [],
  obstacleLocations = [],
  showPath = true,
  showFineLocations = true,
  onLocationPick,
  pickedLat = null,
  pickedLng = null,
  showTowingRoute = false,
  towingStartPoint,
  towingEndPoint,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const featureLayersRef = useRef<__esri.FeatureLayer[]>([]);
  const [basemap, setBasemap] = useState("streets-navigation-vector");
  const locationMarkerRef = useRef<__esri.Graphic | null>(null);

  // ─── Map init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({ basemap });
    const view = new MapView({ container: mapRef.current, map, center, zoom });
    viewRef.current = view;

    esriConfig.request.interceptors.push({
      urls: featureServiceUrls,
      before: function (params) {
        params.requestOptions.query = params.requestOptions.query || {};
        params.requestOptions.query.token =
          "mzFcMRqhxzPAoRJavp2MJpSdUV_UVcsTrLt1Ox-VIw0tFjEM4ACDyL0H2CwsFUUc-qpr7tKNNafX4hbIhhJekyPNZP0hkq3qUnERH5uBsEuKSFY9_j_jftyQSq4685glDBt9-jy-dc2qvgxc8D_l5tBogE7INT8cd1bJjRvbBGXiQGHBVLyFhM4vCg6RdA17";
      },
    });

    featureLayersRef.current = featureServiceUrls.map((url) => {
      const layerUrl = url.endsWith("/0") ? url : `${url.replace(/\/+$/, "")}/0`;
      const fl = new FeatureLayer({ url: layerUrl });
      map.add(fl);
      return fl;
    });

    view.when(() => {
      Promise.all(featureLayersRef.current.map((f) => f.when().catch(() => null))).then(() => {
        featureLayersRef.current.forEach((fl) => {
          view.whenLayerView(fl).catch(() => {});
        });
      });
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      featureLayersRef.current = [];
      locationMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Basemap switch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (viewRef.current) viewRef.current.map.basemap = basemap as any;
  }, [basemap]);

  // ─── Location picking click handler ──────────────────────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const clickHandle = view.on("click", (event: any) => {
      const { latitude, longitude } = event.mapPoint;
      if (onLocationPick) onLocationPick(latitude, longitude);
      if (onInspectorClick) {
        view.hitTest(event).then((response: any) => {
          const g = response.results?.[0]?.graphic;
          const inspector = g?.attributes?.inspector;
          if (inspector) onInspectorClick(inspector);
        });
      }
    });
    return () => clickHandle.remove();
  }, [onLocationPick, onInspectorClick]);

  // ─── Picked location marker ───────────────────────────────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (locationMarkerRef.current) {
      view.graphics.remove(locationMarkerRef.current);
      locationMarkerRef.current = null;
    }
    if (pickedLat !== null && pickedLng !== null) {
      const point = new Point({ longitude: pickedLng, latitude: pickedLat, spatialReference: { wkid: 4326 } });
      const marker = new Graphic({
        geometry: point,
        symbol: new SimpleMarkerSymbol({ color: [255, 0, 0], size: 12, outline: { color: [255, 255, 255], width: 2 } }),
      });
      view.graphics.add(marker);
      locationMarkerRef.current = marker;
      view.goTo({ center: [pickedLng, pickedLat], zoom: 16 }).catch(console.warn);
    }
  }, [pickedLat, pickedLng]);

  // ─── Main graphics draw ───────────────────────────────────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    // Clear all except location marker
    view.graphics.forEach((g) => {
      if (g !== locationMarkerRef.current) view.graphics.remove(g);
    });

    const toDraw = onlyInspector ? [onlyInspector] : inspectors;

    // ── 1. Inspector Path (blue polyline) ────────────────────────────────────
    if (showPath && inspectorPath && inspectorPath.length > 1) {
      const pathCoordinates = inspectorPath.map((p) => [p.lng, p.lat]);
      const polyline = new Polyline({ paths: [pathCoordinates], spatialReference: { wkid: 4326 } });
      view.graphics.add(
        new Graphic({
          geometry: polyline,
          symbol: new SimpleLineSymbol({ color: [0, 112, 255, 0.85], width: 4, style: "solid" }),
          attributes: { type: "path" },
        }),
      );

      // Path waypoint markers — start pin only, no end pin
      inspectorPath.forEach((pathPoint, index) => {
        const point = new Point({
          longitude: pathPoint.lng,
          latitude: pathPoint.lat,
          spatialReference: { wkid: 4326 },
        });
        let symbol: any;
        if (index === 0) {
          // Start marker
          symbol = new PictureMarkerSymbol({ url: MAP_ICONS.start, width: START_SIZE, height: START_SIZE });
        } else {
          return; // Skip end marker for now
        }
        view.graphics.add(
          new Graphic({
            geometry: point,
            symbol,
            attributes: { timestamp: pathPoint.timestamp, type: index === 0 ? "start" : "pathPoint" },
            popupTemplate: {
              title: index === 0 ? "Start Point" : `Path Point ${index}`,
              content: `<b>Time:</b> ${pathPoint.timestamp}`,
            },
          }),
        );
      });
    }

    // ── 2. Fine Locations — Red marker ───────────────────────────────────────
    if (showFineLocations && fineLocations?.length > 0) {
      fineLocations.forEach((fine) => {
        view.graphics.add(
          new Graphic({
            geometry: new Point({ longitude: fine.lng, latitude: fine.lat, spatialReference: { wkid: 4326 } }),
            symbol: new PictureMarkerSymbol({ url: MAP_ICONS.fine, width: PIN_W, height: PIN_H }),
            attributes: { fine, type: "fine" },
            popupTemplate: {
              title: `Fine: ${fine.plateNumber}`,
              content: `<b>Amount:</b> AED ${fine.fineAmount}<br><b>Time:</b> ${fine.timestamp}<br><b>Plate:</b> ${fine.plateNumber}`,
            },
          }),
        );
      });
    }

    // ── 3. Warning Locations — Gold marker ───────────────────────────────────
    if (warningLocations?.length > 0) {
      warningLocations.forEach((warning) => {
        view.graphics.add(
          new Graphic({
            geometry: new Point({ longitude: warning.lng, latitude: warning.lat, spatialReference: { wkid: 4326 } }),
            symbol: new PictureMarkerSymbol({ url: MAP_ICONS.warning, width: PIN_W, height: PIN_H }),
            attributes: warning,
            popupTemplate: {
              title: "Warning Inspection",
              content: `<b>ID:</b> ${warning.id}<br/><b>Time:</b> ${warning.timestamp}`,
            },
          }),
        );
      });
    }

    // ── 4. Routine Locations — Green marker ──────────────────────────────────
    if (routineLocations?.length > 0) {
      routineLocations.forEach((routine) => {
        view.graphics.add(
          new Graphic({
            geometry: new Point({ longitude: routine.lng, latitude: routine.lat, spatialReference: { wkid: 4326 } }),
            symbol: new PictureMarkerSymbol({ url: MAP_ICONS.routine, width: PIN_W, height: PIN_H }),
            attributes: routine,
            popupTemplate: {
              title: "Routine Inspection",
              content: `<b>ID:</b> ${routine.id}<br/><b>Time:</b> ${routine.timestamp}`,
            },
          }),
        );
      });
    }

    // ── 5. Towing Locations — Navy marker ────────────────────────────────────
    if (towingLocations?.length > 0) {
      towingLocations.forEach((tow) => {
        view.graphics.add(
          new Graphic({
            geometry: new Point({ longitude: tow.lng, latitude: tow.lat, spatialReference: { wkid: 4326 } }),
            symbol: new PictureMarkerSymbol({ url: MAP_ICONS.towing, width: PIN_W, height: PIN_H }),
            attributes: tow,
            popupTemplate: {
              title: "Towing Request",
              content: `<b>ID:</b> ${tow.id}<br/><b>Time:</b> ${tow.timestamp}`,
            },
          }),
        );
      });
    }

    // ── 6. Obstacle Locations — Orange marker ────────────────────────────────
    if (obstacleLocations?.length > 0) {
      obstacleLocations.forEach((obstacle) => {
        view.graphics.add(
          new Graphic({
            geometry: new Point({ longitude: obstacle.lng, latitude: obstacle.lat, spatialReference: { wkid: 4326 } }),
            symbol: new PictureMarkerSymbol({ url: MAP_ICONS.obstacle, width: PIN_W, height: PIN_H }),
            attributes: { obstacle, type: "obstacle" },
            popupTemplate: {
              title: "Obstacle Location",
              content: `<b>ID:</b> ${obstacle.id}<br/><b>Date:</b> ${obstacle.createdDateTime || "N/A"}`,
            },
          }),
        );
      });
    }

    // ── 7. Towing Route (Start → End dashed line) — no end pin ───────────────
    if (showTowingRoute && towingStartPoint && towingEndPoint) {
      // Dashed line
      view.graphics.add(
        new Graphic({
          geometry: new Polyline({
            paths: [
              [
                [towingStartPoint.lng, towingStartPoint.lat],
                [towingEndPoint.lng, towingEndPoint.lat],
              ],
            ],
            spatialReference: { wkid: 4326 },
          }),
          symbol: new SimpleLineSymbol({ color: [245, 124, 0, 0.85], width: 5, style: "dash" }),
          attributes: { type: "towingRoute" },
        }),
      );
      // Start pin only — no end pin
      view.graphics.add(
        new Graphic({
          geometry: new Point({
            longitude: towingStartPoint.lng,
            latitude: towingStartPoint.lat,
            spatialReference: { wkid: 4326 },
          }),
          symbol: new PictureMarkerSymbol({ url: MAP_ICONS.start, width: START_SIZE, height: START_SIZE }),
          attributes: { type: "towingStart" },
          popupTemplate: { title: "Towing Start", content: "Vehicle pickup location" },
        }),
      );
    }

    // ── 8. Inspector Avatar ───────────────────────────────────────────────────
    toDraw.forEach((inspector) => {
      let avatarLng = inspector.lng;
      let avatarLat = inspector.lat;
      if (showPath && inspectorPath?.length > 0) {
        const last = inspectorPath[inspectorPath.length - 1];
        avatarLng = last.lng;
        avatarLat = last.lat;
      }

      let symbol: any;
      if (inspector.markerType === "google-pin") {
        symbol = new PictureMarkerSymbol({
          url: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png",
          width: "32px",
          height: "32px",
        });
      } else if (inspector.markerType === "start") {
        symbol = new SimpleMarkerSymbol({
          color: [0, 255, 0, 0.9],
          size: 18,
          outline: { color: [255, 255, 255], width: 3 },
        });
      } else if (inspector.markerType === "end") {
        symbol = new SimpleMarkerSymbol({
          color: [255, 0, 0, 0.9],
          size: 18,
          outline: { color: [255, 255, 255], width: 3 },
        });
      } else {
        const isCheckedOut = inspector.status === "Checked Out";
        symbol = new PictureMarkerSymbol({
          url: isCheckedOut ? MAP_ICONS.end : "/images/icon1.png",
          width: isCheckedOut ? START_SIZE : AVATAR_SIZE,
          height: isCheckedOut ? START_SIZE : AVATAR_SIZE,
        });
      }

      view.graphics.add(
        new Graphic({
          geometry: new Point({ longitude: avatarLng, latitude: avatarLat, spatialReference: { wkid: 4326 } }),
          symbol,
          attributes: { inspector, type: "inspector" },
          popupTemplate: {
            title: inspector.name,
            content: `<b>Status:</b> ${inspector.status}<br><b>Zone:</b> ${inspector.zone || "N/A"}`,
          },
        }),
      );
    });

    // ── 9. Auto-zoom ──────────────────────────────────────────────────────────
    if (onlyInspector) {
      view.goTo({ center: [onlyInspector.lng, onlyInspector.lat], zoom: 13 }, { duration: 600 }).catch(console.warn);
    } else {
      const allPoints: Array<{ lng: number; lat: number }> = [];
      toDraw.forEach((inspector) => {
        if (showPath && inspectorPath?.length > 0) {
          const last = inspectorPath[inspectorPath.length - 1];
          allPoints.push({ lng: last.lng, lat: last.lat });
        } else {
          allPoints.push({ lng: inspector.lng, lat: inspector.lat });
        }
      });
      inspectorPath?.forEach((p) => allPoints.push({ lng: p.lng, lat: p.lat }));
      fineLocations?.forEach((f) => allPoints.push({ lng: f.lng, lat: f.lat }));
      obstacleLocations?.forEach((o) => allPoints.push({ lng: o.lng, lat: o.lat }));
      if (showTowingRoute && towingStartPoint && towingEndPoint) {
        allPoints.push({ lng: towingStartPoint.lng, lat: towingStartPoint.lat });
        allPoints.push({ lng: towingEndPoint.lng, lat: towingEndPoint.lat });
      }

      if (allPoints.length > 1) {
        const lngs = allPoints.map((p) => p.lng);
        const lats = allPoints.map((p) => p.lat);
        const lngP = (Math.max(...lngs) - Math.min(...lngs)) * 0.2 || 0.01;
        const latP = (Math.max(...lats) - Math.min(...lats)) * 0.2 || 0.01;
        view
          .goTo(
            {
              target: new Extent({
                xmin: Math.min(...lngs) - lngP,
                ymin: Math.min(...lats) - latP,
                xmax: Math.max(...lngs) + lngP,
                ymax: Math.max(...lats) + latP,
                spatialReference: { wkid: 4326 },
              }),
            },
            { duration: 800 },
          )
          .catch(() => view.goTo({ center, zoom }).catch(() => {}));
      } else {
        view.goTo({ center, zoom }).catch(() => {});
      }
    }

    // ── 10. Inspector click handler ───────────────────────────────────────────
    let clickHandle: any = null;
    if (clickable && onInspectorClick) {
      try {
        clickHandle = (view as any).on("click", (event: any) => {
          view.hitTest(event).then((response: any) => {
            const g = response.results?.[0]?.graphic;
            const insp = g?.attributes?.inspector;
            if (insp) onInspectorClick(insp);
          });
        });
      } catch (_) {}
    }
    return () => {
      if (clickHandle?.remove) clickHandle.remove();
    };
  }, [
    inspectors,
    onlyInspector,
    clickable,
    onInspectorClick,
    center,
    zoom,
    inspectorPath,
    fineLocations,
    obstacleLocations,
    warningLocations,
    routineLocations,
    towingLocations,
    showPath,
    showFineLocations,
    showTowingRoute,
    towingStartPoint,
    towingEndPoint,
  ]);

  // ─── Basemap menu ─────────────────────────────────────────────────────────
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
      <div ref={mapRef} style={{ width: "100%", height, minHeight: "400px" }} />
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
