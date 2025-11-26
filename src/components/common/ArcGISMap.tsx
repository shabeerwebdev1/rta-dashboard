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

// ✅ Path and Fine Location types
export type InspectorPath = Array<{ lat: number; lng: number; timestamp: string }>;
export type FineLocation = {
  id: string;
  lat: number;
  lng: number;
  fineAmount: number;
  timestamp: string;
  plateNumber: string;
};

interface ArcGISMapProps {
  inspectors: Inspector[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onInspectorClick?: (inspector: Inspector) => void;
  onlyInspector?: Inspector | null;
  clickable?: boolean;
  // ✅ Path and fine locations props
  inspectorPath?: InspectorPath;
  fineLocations?: FineLocation[];
  showPath?: boolean;
  showFineLocations?: boolean;
  // ✅ NEW: Location picking props
  onLocationPick?: (lat: number, lng: number) => void;
  pickedLat?: number | null;
  pickedLng?: number | null;
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
  inspectorPath = [],
  fineLocations = [],
  showPath = true,
  showFineLocations = true,
  // ✅ NEW: Location picking props
  onLocationPick,
  pickedLat = null,
  pickedLng = null,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const featureLayersRef = useRef<__esri.FeatureLayer[]>([]);
  const [basemap, setBasemap] = useState("streets-navigation-vector");
  const locationMarkerRef = useRef<__esri.Graphic | null>(null);

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
      locationMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewRef.current) viewRef.current.map.basemap = basemap as any;
  }, [basemap]);

  // ✅ NEW: Handle location picking when map is clicked
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
  
    const clickHandle = view.on("click", (event: any) => {
      const { latitude, longitude } = event.mapPoint;
  
      // Send picked location up to parent
      if (onLocationPick) {
        onLocationPick(latitude, longitude);
      }
  
      // Handle inspector click if exists
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
  
  

  // ✅ NEW: Handle picked location marker
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    // Remove previous location marker
    if (locationMarkerRef.current) {
      view.graphics.remove(locationMarkerRef.current);
      locationMarkerRef.current = null;
    }

    // Add new marker if coordinates are provided
    if (pickedLat !== null && pickedLng !== null) {
      const point = new Point({
        longitude: pickedLng,
        latitude: pickedLat,
        spatialReference: { wkid: 4326 },
      });

      const markerSymbol = new SimpleMarkerSymbol({
        color: [255, 0, 0], // Red color
        size: 12,
        outline: {
          color: [255, 255, 255],
          width: 2,
        },
      });

      const marker = new Graphic({
        geometry: point,
        symbol: markerSymbol,
      });

      view.graphics.add(marker);
      locationMarkerRef.current = marker;

      // Center map on the picked location
      view
        .goTo({
          center: [pickedLng, pickedLat],
          zoom: 16,
        })
        .catch(console.warn);
    }
  }, [pickedLat, pickedLng]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.graphics.forEach((g) => {
      if (g !== locationMarkerRef.current) {
        view.graphics.remove(g);
      }
    });
    const toDraw = onlyInspector ? [onlyInspector] : inspectors;

    console.log("=== ArcGIS Map Rendering Debug ===");
    console.log("Inspector Path:", inspectorPath);
    console.log("Fine Locations:", fineLocations);
    console.log("Show Path:", showPath);
    console.log("Show Fine Locations:", showFineLocations);

    // ✅ 1. Draw Inspector Path (Polyline) - FIXED FORMAT
    if (showPath && inspectorPath && inspectorPath.length > 1) {
      console.log("Drawing inspector path with", inspectorPath.length, "points");

      // ✅ CRITICAL FIX: ArcGIS expects paths as [[[lng, lat], [lng, lat], ...]]
      const pathCoordinates = inspectorPath.map((point) => [point.lng, point.lat]);

      console.log("Path coordinates:", pathCoordinates);

      const polyline = new Polyline({
        paths: [pathCoordinates], // ✅ Wrapped in array for paths
        spatialReference: { wkid: 4326 },
      });

      console.log("Polyline created:", polyline);
      console.log("Polyline paths:", polyline.paths);

      const pathSymbol = new SimpleLineSymbol({
        color: [0, 112, 255, 0.8], // Blue line
        width: 4,
        style: "solid",
      });

      const pathGraphic = new Graphic({
        geometry: polyline,
        symbol: pathSymbol,
        attributes: { type: "path" },
      });

      view.graphics.add(pathGraphic);
      console.log("Path graphic added to view");

      // Add small markers for each point in the path
      inspectorPath.forEach((pathPoint, index) => {
        const point = new Point({
          longitude: pathPoint.lng,
          latitude: pathPoint.lat,
          spatialReference: { wkid: 4326 },
        });

        const markerSymbol = new SimpleMarkerSymbol({
          color: index === 0 ? [0, 255, 0, 0.9] : [0, 112, 255, 0.7], // Green for start, blue for others
          size: index === 0 ? 12 : 8,
          outline: {
            color: [255, 255, 255],
            width: 2,
          },
        });

        const markerGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol,
          attributes: {
            timestamp: pathPoint.timestamp,
            type: index === 0 ? "start" : "pathPoint",
          },
          popupTemplate: {
            title: index === 0 ? "Start Point" : `Path Point ${index}`,
            content: `<b>Time:</b> ${pathPoint.timestamp}`,
          },
        });

        view.graphics.add(markerGraphic);
      });

      console.log("Path markers added");
    } else {
      console.log("Not drawing path - conditions not met:", {
        showPath,
        hasPath: !!inspectorPath,
        pathLength: inspectorPath?.length,
      });
    }

    // ✅ 2. Draw Fine Locations (Red markers)
    if (showFineLocations && fineLocations && fineLocations.length > 0) {
      console.log("Drawing", fineLocations.length, "fine locations");

      fineLocations.forEach((fine, index) => {
        const point = new Point({
          longitude: fine.lng,
          latitude: fine.lat,
          spatialReference: { wkid: 4326 },
        });

        const fineSymbol = new PictureMarkerSymbol({
          url: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png",
          width: "32px",
          height: "32px",
        });

        const fineGraphic = new Graphic({
          geometry: point,
          symbol: fineSymbol,
          attributes: { fine, type: "fine" },
          popupTemplate: {
            title: `Fine: ${fine.plateNumber}`,
            content: `
              <b>Amount:</b> ${fine.fineAmount} AED<br>
              <b>Time:</b> ${fine.timestamp}<br>
              <b>Plate:</b> ${fine.plateNumber}
            `,
          },
        });

        view.graphics.add(fineGraphic);
        console.log(`Fine location ${index + 1} added`);
      });
    } else {
      console.log("Not drawing fines - conditions not met:", {
        showFineLocations,
        hasFines: !!fineLocations,
        finesCount: fineLocations?.length,
      });
    }

    // ✅ 3. Draw Inspectors (Main markers) - AVATAR AT END POINT
    toDraw.forEach((inspector, index) => {
      // ✅ CRITICAL FIX: Use last path point as avatar position if path exists
      let avatarLng = inspector.lng;
      let avatarLat = inspector.lat;

      if (showPath && inspectorPath && inspectorPath.length > 0) {
        const lastPathPoint = inspectorPath[inspectorPath.length - 1];
        avatarLng = lastPathPoint.lng;
        avatarLat = lastPathPoint.lat;
        console.log(`Moving avatar for ${inspector.name} to end point:`, { avatarLng, avatarLat });
      }

      const point = new Point({
        longitude: avatarLng, // ✅ Use calculated position
        latitude: avatarLat, // ✅ Use calculated position
        spatialReference: { wkid: 4326 },
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
        attributes: { inspector, type: "inspector" },
        popupTemplate: {
          title: inspector.name,
          content: `
            <b>Status:</b> ${inspector.status}<br>
            <b>Zone:</b> ${inspector.zone || "N/A"}
          `,
        },
      });

      view.graphics.add(graphic);
      console.log(`Inspector ${index + 1} added:`, inspector.name);
    });

    console.log("Total graphics in view:", view.graphics.length);

    // ✅ 4. Auto-zoom to fit all content
    if (onlyInspector) {
      const lng = onlyInspector.lng;
      const lat = onlyInspector.lat;
      const SINGLE_ZOOM = 13;
      view
        .goTo({ center: [lng, lat], zoom: SINGLE_ZOOM }, { duration: 600 })
        .catch((e) => console.warn("goTo single inspector failed:", e));
    } else {
      // Calculate extent based on all points (inspectors, path, fines)
      const allPoints: Array<{ lng: number; lat: number }> = [];

      // Add inspector positions (using updated avatar positions)
      toDraw.forEach((inspector) => {
        let lng = inspector.lng;
        let lat = inspector.lat;

        // Use the same logic as above for consistent positioning
        if (showPath && inspectorPath && inspectorPath.length > 0) {
          const lastPathPoint = inspectorPath[inspectorPath.length - 1];
          lng = lastPathPoint.lng;
          lat = lastPathPoint.lat;
        }

        allPoints.push({ lng, lat });
      });

      // Add path points
      if (inspectorPath && inspectorPath.length > 0) {
        inspectorPath.forEach((p) => allPoints.push({ lng: p.lng, lat: p.lat }));
      }

      // Add fine locations
      if (fineLocations && fineLocations.length > 0) {
        fineLocations.forEach((f) => allPoints.push({ lng: f.lng, lat: f.lat }));
      }

      console.log("Total points for extent calculation:", allPoints.length);

      if (allPoints.length > 1) {
        const lngs = allPoints.map((p) => p.lng);
        const lats = allPoints.map((p) => p.lat);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        const lngPadding = (maxLng - minLng) * 0.2 || 0.01;
        const latPadding = (maxLat - minLat) * 0.2 || 0.01;

        const extent = new Extent({
          xmin: minLng - lngPadding,
          ymin: minLat - latPadding,
          xmax: maxLng + lngPadding,
          ymax: maxLat + latPadding,
          spatialReference: { wkid: 4326 },
        });

        view.goTo({ target: extent }, { duration: 800 }).catch(() => {
          view.goTo({ center, zoom }).catch(() => {});
        });
      } else {
        view.goTo({ center, zoom }).catch(() => {});
      }
    }

    // ✅ 5. Handle inspector click events (separate from location picking)
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
  }, [
    inspectors,
    onlyInspector,
    clickable,
    onInspectorClick,
    center,
    zoom,
    inspectorPath,
    fineLocations,
    showPath,
    showFineLocations,
  ]);

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
