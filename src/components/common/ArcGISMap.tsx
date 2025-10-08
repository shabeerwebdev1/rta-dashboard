import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { Dropdown, Menu, theme } from "antd";
import { MoreOutlined } from "@ant-design/icons";

type Inspector = {
  id: number;
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
  status: string;
  statusAr: string;
  details?: { zone: string; lastCheckIn: string };
  markerType?: "default" | "google-pin";
};

interface ArcGISMapProps {
  inspectors: Inspector[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onInspectorClick?: (inspector: Inspector) => void;
}

const ArcGISMap: React.FC<ArcGISMapProps> = ({
  inspectors,
  center = [55.2743, 25.1972],
  zoom = 15,
  height = "500px",
  onInspectorClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const [basemap, setBasemap] = useState("streets-navigation-vector");

  useEffect(() => {
    if (mapRef.current) {
      const map = new Map({ basemap });
      const view = new MapView({
        container: mapRef.current,
        map,
        center,
        zoom,
      });

      viewRef.current = view;

      // ========================================
      // 🔧 CHANGED: Added debugging and zoom to extent
      // ========================================
      const featureLayer = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0",
      });

      // ✅ NEW: Added error handling and debugging
      featureLayer
        .load()
        .then(() => {
          console.log("✅ Feature layer loaded successfully");
          console.log("📍 Layer extent:", featureLayer.fullExtent);
          console.log("🌍 Center coordinates:", {
            latitude: featureLayer.fullExtent?.center?.latitude,
            longitude: featureLayer.fullExtent?.center?.longitude,
          });
          return featureLayer.queryFeatureCount();
        })
        .then((count) => {
          console.log("🌳 Total features in layer:", count);
        })
        .catch((error) => {
          console.error("❌ Feature layer error:", error);
        });

      // 📍 PREVIOUSLY: map.add(featureLayer) was here (at line 73 in your code)
      // 🔧 MOVED: Now adding layer before inspectors to ensure proper layering
      map.add(featureLayer);

      // ✅ NEW: Auto-zoom to feature layer extent when it loads
      // This will zoom the map to where the trees are located (North Carolina, USA)
      view.when(() => {
        featureLayer.when(() => {
          view
            .goTo(featureLayer.fullExtent)
            .then(() => {
              console.log("✅ Zoomed to feature layer extent");
            })
            .catch((err) => {
              console.error("❌ Zoom error:", err);
            });
        });

        // ✅ NEW: Check layer visibility status
        view.whenLayerView(featureLayer).then((layerView) => {
          console.log("✅ LayerView created");

          layerView.watch("updating", (updating) => {
            if (!updating) {
              console.log("✅ LayerView finished updating");
              console.log("👁️ Layer visible:", layerView.visible);
              console.log("🔍 Visible at current scale:", layerView.visibleAtCurrentScale);
            }
          });
        });
      });
      // ========================================
      // END OF CHANGES
      // ========================================

      // 📍 UNCHANGED: Inspector markers code remains the same
      // Add inspector markers
      inspectors.forEach((inspector) => {
        const point = new Point({
          longitude: inspector.lng,
          latitude: inspector.lat,
        });

        // Choose marker type
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

      // 📍 UNCHANGED: Click event handler
      // Click event for inspector
      view.on("click", (event) => {
        view.hitTest(event).then((response) => {
          if (response.results.length > 0) {
            const inspector = response.results[0].graphic.attributes?.inspector;
            if (inspector && onInspectorClick) {
              onInspectorClick(inspector);
            }
          }
        });
      });

      // 📍 PREVIOUSLY: map.add(featureLayer) was here
      // 🔧 REMOVED: Moved this to line 83 (before inspector markers)
      // ❌ COMMENTED OUT: map.add(featureLayer);

      // 📍 UNCHANGED: Cleanup function
      return () => {
        if (viewRef.current) {
          viewRef.current.destroy();
          viewRef.current = null;
        }
      };
    }
  }, [inspectors, basemap]);

  // 📍 UNCHANGED: Basemap switcher menu
  const menu = (
    <Menu
      onClick={(e) => setBasemap(e.key)}
      items={[
        { key: "streets-navigation-vector", label: "Streets (Day)" },
        { key: "streets-night-vector", label: "Streets (Night)" },
        { key: "satellite", label: "Satellite" },
      ]}
    />
  );

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height }} />

      {/* 📍 UNCHANGED: Basemap Switcher */}
      <Dropdown overlay={menu} trigger={["click"]}>
        <MoreOutlined
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            fontSize: 22,
            background: "#fff",
            borderRadius: "50%",
            padding: 6,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        />
      </Dropdown>
    </div>
  );
};

export default ArcGISMap;
