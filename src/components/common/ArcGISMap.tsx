/* eslint-disable @typescript-eslint/no-namespace */
import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { Dropdown, Menu } from "antd";
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

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ x: number; y: number; inspector: Inspector | null }>({
    x: 0,
    y: 0,
    inspector: null,
  });

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

      // Add inspector markers
      inspectors.forEach((inspector) => {
        const point = new Point({ longitude: inspector.lng, latitude: inspector.lat });
        const symbol = new PictureMarkerSymbol({
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

      // Hover event for tooltip
      view.on("pointer-move", (event) => {
        view.hitTest(event).then((response) => {
          if (response.results.length > 0) {
            const graphic = response.results[0].graphic;
            const inspector = graphic.attributes?.inspector;
            if (inspector) {
              setTooltip({
                x: event.x,
                y: event.y,
                inspector,
              });
            }
          } else {
            setTooltip({ x: 0, y: 0, inspector: null });
          }
        });
      });

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

      return () => {
        if (viewRef.current) {
          viewRef.current.destroy();
          viewRef.current = null;
        }
      };
    }
  }, [inspectors, basemap]);

  // Menu for basemap switching
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

      {/* Tooltip */}
      {tooltip.inspector && (
        <div
          style={{
            position: "absolute",
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            background: "#fff",
            border: "1px solid #ddd",
            padding: "6px 10px",
            borderRadius: 6,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 999,
          }}
        >
          <strong>{tooltip.inspector.name}</strong> <br />
          {tooltip.inspector.details?.zone || "N/A"} <br />
          Status: {tooltip.inspector.status}
        </div>
      )}

      {/* Basemap Switcher */}
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
