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
  markerType?: "default" | "google-pin"; 
};

interface ArcGISMapProps {
  inspectors: Inspector[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onInspectorClick?: (inspector: Inspector) => void;
  clickable?: boolean; // Add this new prop
}

const ArcGISMap: React.FC<ArcGISMapProps> = ({
  inspectors,
  center = [55.2743, 25.1972],
  zoom = 15,
  height = "500px",
  onInspectorClick,
  clickable = true, // Default to true for backward compatibility
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const [basemap, setBasemap] = useState("streets-navigation-vector");
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      basemap: basemap
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      center: center,
      zoom: zoom
    });

    viewRef.current = view;

    // Clear existing graphics
    view.graphics.removeAll();

    // Add inspector markers
    inspectors.forEach((inspector) => {
      const point = new Point({
        longitude: inspector.lng,
        latitude: inspector.lat,
      });

      const symbol = inspector.markerType === "google-pin"
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
        symbol: symbol,
        attributes: { inspector },
      });

      view.graphics.add(graphic);
    });

    // Only add click event if clickable is true
    if (clickable) {
      const clickHandler = view.on("click", (event) => {
        const point = new Point({
          longitude: event.mapPoint.longitude,
          latitude: event.mapPoint.latitude
        });

        setSelectedPoint(point);

        if (inspectors.length > 0) {
          view.hitTest(event).then((response) => {
            if (response.results.length > 0) {
              const graphic = response.results[0].graphic;
              const inspector = graphic.attributes?.inspector;
              if (inspector && onInspectorClick) {
                onInspectorClick(inspector);
              }
            } else {
              if (onInspectorClick) {
                onInspectorClick({
                  id: 0,
                  name: "Selected Location",
                  nameAr: "الموقع المحدد",
                  lat: event.mapPoint.latitude,
                  lng: event.mapPoint.longitude,
                  status: "selected",
                  statusAr: "محدد"
                });
              }
            }
          });
        } else {
          if (onInspectorClick) {
            onInspectorClick({
              id: 0,
              name: "Selected Location",
              nameAr: "الموقع المحدد",
              lat: event.mapPoint.latitude,
              lng: event.mapPoint.longitude,
              status: "selected",
              statusAr: "محدد"
            });
          }
        }
      });

      return () => {
        if (clickHandler) clickHandler.remove();
        if (viewRef.current) {
          viewRef.current.destroy();
          viewRef.current = null;
        }
      };
    } else {
      return () => {
        if (viewRef.current) {
          viewRef.current.destroy();
          viewRef.current = null;
        }
      };
    }
  }, [inspectors, basemap, selectedPoint, center, zoom, clickable]);

  // Menu for basemap switching
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
      <div 
        ref={mapRef} 
        style={{ 
          width: "100%", 
          height: height,
          minHeight: "400px" 
        }} 
      />
      
      {/* Basemap Switcher */}
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

      {/* Instructions */}
     
    </div>
  );
};

export default ArcGISMap;