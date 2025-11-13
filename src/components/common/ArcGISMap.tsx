import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { Dropdown, Menu } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import esriConfig from "@arcgis/core/config";

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
interface ArcGISMapProps {
  mapUrlIndex?: number;
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
  mapUrlIndex = 2,
  onInspectorClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const [basemap, setBasemap] = useState("streets-navigation-vector");
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  //const featureLayerUrl = ;
  const [featureLayerUrl, setfeatureLayerUrl] = useState<string>(featureServiceUrls[mapUrlIndex]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Create map and view
    const map = new Map({ basemap });
    const view = new MapView({
      container: mapRef.current,
      map,
      center,
      zoom,
    });
    viewRef.current = view;

    esriConfig.request.interceptors.push({
      urls: featureLayerUrl,
      before: function (params) {
        params.requestOptions.query = params.requestOptions.query || {};
        params.requestOptions.query.token =
          "mzFcMRqhxzPAoRJavp2MJpSdUV_UVcsTrLt1Ox-VIw0tFjEM4ACDyL0H2CwsFUUc-qpr7tKNNafX4hbIhhJek6WtcD_GU9sqX0h_BqdogAV8ynOUX3soVY8mw5jDexifGTu-udRTeKAzsEtTVXajBL6_rclLsCSv7zYYSqOWFoMay5KMow7Qd1g5jg1Xmg6Z";
      },
    });

    // ✅ Add FeatureLayer (Feature Service)
    const featureLayer = new FeatureLayer({
      url: featureLayerUrl,
    });

    featureLayer
      .load()
      .then(() => {
        return featureLayer.queryFeatureCount();
      })
      .catch((error) => {
        console.error("❌ Feature layer error:", error);
      });

    map.add(featureLayer);

    // ✅ **UPDATED: Removed auto-zoom to feature layer extent**
    view.when(() => {
      featureLayer.when(() => {
        // Removed: view.goTo(featureLayer.fullExtent) - this was causing unwanted zoom out
      });

      view.whenLayerView(featureLayer).then((layerView) => {
        layerView.watch("updating", (updating) => {
          if (!updating) {
            // Layer finished updating
          }
        });
      });
    });

    // ✅ Clear graphics before adding
    view.graphics.removeAll();

    // ✅ Add inspector markers
    inspectors.forEach((inspector) => {
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

    // ✅ Add selected point marker if it exists
    if (selectedPoint) {
      const selectedSymbol = new PictureMarkerSymbol({
        url: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Green pin
        width: "32px",
        height: "32px",
      });

      const selectedGraphic = new Graphic({
        geometry: selectedPoint,
        symbol: selectedSymbol,
      });

      view.graphics.add(selectedGraphic);
    }

    // ✅ Click event for selecting point / inspector
    // const clickHandler = view.on("click", (event) => {
    //   const point = new Point({
    //     longitude: event.mapPoint.longitude,
    //     latitude: event.mapPoint.latitude,
    //   });

    //   setSelectedPoint(point);

    //   // Check if clicked on inspector
    //   view.hitTest(event).then((response) => {
    //     if (response.results.length > 0) {
    //       const graphic = response.results[0].graphic;
    //       const inspector = graphic.attributes?.inspector;
    //       if (inspector && onInspectorClick) {
    //         onInspectorClick(inspector);
    //       }
    //     } else if (onInspectorClick) {
    //       // No inspector, return coordinates
    //       onInspectorClick({
    //         lat: event.mapPoint.latitude,
    //         lng: event.mapPoint.longitude,
    //       });
    //     }
    //   });
    // });

    // ✅ Cleanup
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [inspectors, basemap, selectedPoint, center, zoom, mapUrlIndex]);
  useEffect(() => {
    setfeatureLayerUrl(featureServiceUrls[mapUrlIndex]);
  }, [mapUrlIndex]);

  // ✅ Basemap Switcher Menu
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

  // ✅ JSX
  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: height,
          minHeight: "400px",
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
    </div>
  );
};

export default ArcGISMap;
