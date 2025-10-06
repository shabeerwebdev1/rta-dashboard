import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
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
                url: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png", // Google pin
                width: "32px",
                height: "32px",
              })
            : new PictureMarkerSymbol({
                url: "/images/Inspector.png", // Default inspector icon
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
      <div ref={mapRef} style={{ width: "100%", height , }} />

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