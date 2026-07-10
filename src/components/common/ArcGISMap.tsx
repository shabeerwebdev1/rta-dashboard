/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import Extent from "@arcgis/core/geometry/Extent";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import Expand from "@arcgis/core/widgets/Expand";
import Sketch from "@arcgis/core/widgets/Sketch";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { Dropdown, Menu } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import esriConfig from "@arcgis/core/config";
import { MAP_ICONS } from "./mapIconUrls";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

// ── Types ────────────────────────────────────────────────────────────────
export type LayerKey =
  | "startPoint"
  | "inspectorPath"
  | "routine"
  | "warning"
  | "fine"
  | "parkingFine"
  | "towing"
  | "obstacle"
  | "inspector";

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
  [key: string]: any;
};

export type ObstacleLocation = {
  id: string;
  lat: number;
  lng: number;
  createdDateTime?: string;
};

export type ParkingPoint = {
  objectId: number;
  name: string;
  status: "Fine" | "Obstacle" | "Routine" | "Towing" | "Warning";
  longitude: number;
  latitude: number;
};

interface ArcGISMapProps {
  inspectors: Inspector[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  legendEnabled?: boolean;
  onInspectorClick?: (inspector: Inspector) => void;
  onlyInspector?: Inspector | null;
  clickable?: boolean;
  inspectorPath?: InspectorPath;
  fineLocations?: FineLocation[];
  parkingFineLocations?: FineLocation[];
  warningLocations?: any[];
  routineLocations?: any[];
  towingLocations?: any[];
  obstacleLocations?: ObstacleLocation[];
  showPath?: boolean;
  showFineLocations?: boolean;
  onLocationPick?: (lat: number, lng: number) => void;
  pickedLat?: number | null;
  pickedLng?: number | null;
  pickedLocationIconUrl?: string;
  pickedLocationIconSize?: number;
  showTowingRoute?: boolean;
  towingStartPoint?: { lat: number; lng: number };
  towingEndPoint?: { lat: number; lng: number };
  onFineClick?: (fine: any) => void;
  onInspectionClick?: (inspection: any) => void;
  layerVisibility?: Record<LayerKey, boolean>;
  parkingPoints?: ParkingPoint[];
  showParkingClusters?: boolean;
  clusterRadius?: string;
  onParkingClusterClick?: (points: ParkingPoint[]) => void;
  showBasemapToggle?: boolean;
  // NEW PROPS FOR BOUNDARY DRAWING
  enableBoundaryDrawing?: boolean;
  onBoundaryDrawn?: (shape: { type: "Polygon" | "LineString" | "Point"; coordinates: any }) => void;
  boundaryShape?: { type: "Polygon" | "LineString" | "Point"; coordinates: any } | null;
  onClearBoundary?: () => void;
  hiddenLegendItems?: string[]; // Prop to hide specific legend items
}

// ── Constants ────────────────────────────────────────────────────────────
const featureServiceUrls = [
  "https://services1.arcgis.com/0zsuvMZIPja7Lm9C/arcgis/rest/services/Testing_2/FeatureServer",
  "https://services1.arcgis.com/0zsuvMZIPja7Lm9C/arcgis/rest/services/Testing_3/FeatureServer",
  "https://services1.arcgis.com/0zsuvMZIPja7Lm9C/arcgis/rest/services/RTA_Dubai/FeatureServer",
];

// CRITICAL FIX: Use same exact icon sizes as previous GraphicsLayer implementation
const PIN_W = "36px";
const PIN_H = "36px";
const START_SIZE = "34px";
const AVATAR_SIZE = "66px";
const DEFAULT_CLUSTER_RADIUS = "32px";

// CRITICAL FIX: Layer order definition - higher index = drawn on top
const LAYER_ORDER: LayerKey[] = [
  "inspectorPath", // Bottom
  "startPoint",
  "routine",
  "warning",
  "fine",
  "parkingFine",
  "towing",
  "obstacle",
  "inspector", // Top
];

// Only these remain as GraphicsLayer (polylines + non-cluster points)
const GRAPHICS_LAYER_DEFS: Array<{ key: LayerKey; titleEn: string; titleAr: string }> = [
  { key: "inspectorPath", titleEn: "Inspector Path", titleAr: "مسار المفتش" },
  { key: "startPoint", titleEn: "Start Point", titleAr: "نقطة البداية" },
];

const PARKING_STATUS_CONFIG = [
  { label: "Fine", value: "Fine", icon: MAP_ICONS.fine, color: "#E53935CC" },
  { label: "Obstacle", value: "Obstacle", icon: MAP_ICONS.obstacle, color: "#F57C00CC" },
  { label: "Routine", value: "Routine", icon: MAP_ICONS.routine, color: "#34A853CC" },
  { label: "Towing", value: "Towing", icon: MAP_ICONS.towing, color: "#7B1FA2CC" },
  { label: "Warning", value: "Warning", icon: MAP_ICONS.warning, color: "#F9A825CC" },
] as const;

const LAYER_PANEL_CONFIG: Array<{
  key: LayerKey;
  titleEn: string;
  titleAr: string;
  iconUrl?: string;
  iconSize?: string;
  lineColor?: string;
}> = [
  { key: "inspector", titleEn: "Inspector", titleAr: "المفتش", iconUrl: "/images/icon1.png", iconSize: "26px" },
  { key: "obstacle", titleEn: "Obstacles", titleAr: "العوائق", iconUrl: MAP_ICONS.obstacle, iconSize: "22px" },
  { key: "towing", titleEn: "Towing", titleAr: "السحب", iconUrl: MAP_ICONS.towing, iconSize: "22px" },
  { key: "routine", titleEn: "Routine", titleAr: "الروتينية", iconUrl: MAP_ICONS.routine, iconSize: "22px" },
  { key: "warning", titleEn: "Warnings", titleAr: "التحذيرات", iconUrl: MAP_ICONS.warning, iconSize: "20px" },
  { key: "fine", titleEn: "Fines", titleAr: "المخالفات", iconUrl: MAP_ICONS.fine, iconSize: "22px" },
  {
    key: "parkingFine",
    titleEn: "Parking Fines",
    titleAr: "مخالفات مواقف",
    iconUrl: MAP_ICONS.parkingfine,
    iconSize: "22px",
  },
  { key: "startPoint", titleEn: "Start Point", titleAr: "نقطة البداية", iconUrl: MAP_ICONS.start, iconSize: "20px" },
  { key: "inspectorPath", titleEn: "Inspector Path", titleAr: "مسار المفتش", lineColor: "#0070ff" },
];

const EYE_OPEN_ICON = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>
`;

const EYE_CLOSED_ICON = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-5.94"/>
  <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.8 21.8 0 0 1-2.16 3.19"/>
  <path d="M1 1l22 22"/>
  <path d="M9.53 9.53a3 3 0 0 0 4.24 4.24"/>
</svg>
`;

// ── Global State ─────────────────────────────────────────────────────────
let globalOnFineClick: ((fine: any) => void) | undefined;
let globalOnInspectionClick: ((inspection: any) => void) | undefined;
let globalFineLocations: any[] = [];
let globalParkingFineLocations: any[] = [];
let globalWarningLocations: any[] = [];
let globalRoutineLocations: any[] = [];
let globalTowingLocations: any[] = [];
let globalObstacleLocations: any[] = [];

// ── Helpers ──────────────────────────────────────────────────────────────
const formatDateTime = (dateString?: string) => {
  if (!dateString) return "—";
  return dayjs(dateString).format("DD MMM YYYY hh:mm A");
};

const createPopupDOMElement = (
  itemId: string,
  rows: Array<{ icon: string; label: string; value: string; valueColor?: string }>,
  type: string,
  showButton: boolean = true,
  language: string = "en",
  buttonMeta?: Record<string, string | undefined>,
) => {
  const container = document.createElement("div");
  container.style.cssText =
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-width:220px;padding:4px 0;';

  const table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const tdLabel = document.createElement("td");
    tdLabel.style.cssText = `padding:5px ${language === "ar" ? "0 12px 5px 0" : "5px 12px 5px 0"};color:#8c8c8c;font-weight:500;white-space:nowrap`;
    tdLabel.innerHTML = row.label;
    const tdValue = document.createElement("td");
    tdValue.style.cssText = `padding:5px 0;color:${row.valueColor || "#262626"};font-weight:600;${language === "ar" ? "text-align:right" : "text-align:left"}`;
    tdValue.textContent = row.value;
    tr.appendChild(tdLabel);
    tr.appendChild(tdValue);
    table.appendChild(tr);
  });
  container.appendChild(table);

  if (showButton) {
    const buttonDiv = document.createElement("div");
    buttonDiv.style.cssText = "border-top:1px solid #f0f0f0;padding-top:10px;text-align:right;";
    const button = document.createElement("button");
    const buttonText = language === "ar" ? "مزيد من التفاصيل" : "More Details";
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
        <path d="M9 18l6-6-6-6"/>
      </svg>${buttonText}`;
    button.style.cssText = `
      background:linear-gradient(135deg,#1677ff 0%,#0958d9 100%);color:#fff;border:none;
      border-radius:6px;padding:7px 18px;font-size:13px;font-weight:600;cursor:pointer;
      letter-spacing:0.02em;box-shadow:0 2px 8px rgba(22,119,255,0.35);
      display:inline-flex;align-items:center;gap:6px;`;
    button.setAttribute("data-id", itemId);
    button.setAttribute("data-type", type);
    Object.entries(buttonMeta || {}).forEach(([key, value]) => {
      if (value) button.setAttribute(`data-${key}`, value);
    });
    button.className = "arcgis-more-details-btn";
    buttonDiv.appendChild(button);
    container.appendChild(buttonDiv);
  }
  return container;
};

let globalClickHandlerRegistered = false;

const getPopupAttributes = (event: any) => event?.graphic?.attributes ?? event?.attributes ?? {};

/**
 * FIXED: Reusable factory to create a clustered FeatureLayer from point data.
 *
 * KEY FIXES:
 * 1. Use exact same icon sizes (PIN_W x PIN_H) that GraphicsLayer used
 * 2. Set minScale to 0 so clusters always split when zoomed in
 * 3. Use proper symbol configuration for picture-marker
 * 4. Ensure individual markers render correctly within clusters
 */
const createClusterLayer = (params: {
  title: string;
  icon: string;
  color: string;
  points: Array<{
    attributes: Record<string, any>;
    longitude: number;
    latitude: number;
  }>;
  objectIdField?: string;
  fields?: Array<{ name: string; type: string }>;
  popupTemplate?: __esri.PopupTemplate;
  clusterRadius?: string;
  visible?: boolean;
  listMode?: "show" | "hide" | "hide-children";
  iconWidth?: string; // NEW: Custom icon width
  iconHeight?: string; // NEW: Custom icon height
}) => {
  const {
    title,
    icon,
    color,
    points,
    objectIdField = "OBJECTID",
    fields = [
      { name: "OBJECTID", type: "oid" },
      { name: "name", type: "string" },
    ],
    popupTemplate,
    clusterRadius = DEFAULT_CLUSTER_RADIUS,
    visible = true,
    listMode = "show",
    iconWidth = PIN_W, // Default to same size as before
    iconHeight = PIN_H, // Default to same size as before
  } = params;

  if (points.length === 0) return null;

  const graphics = points.map(
    (p, idx) =>
      new Graphic({
        geometry: new Point({
          longitude: p.longitude,
          latitude: p.latitude,
          spatialReference: { wkid: 4326 },
        }),
        attributes: {
          [objectIdField]: p.attributes[objectIdField] ?? idx + 1,
          ...p.attributes,
        },
      }),
  );

  return new FeatureLayer({
    title,
    listMode,
    objectIdField,
    geometryType: "point",
    source: graphics,
    fields,
    outFields: ["*"],
    visible,
    renderer:
      title === "Inspector" || title === "المفتش"
        ? {
            type: "unique-value",
            field: "status",
            uniqueValueInfos: [
              {
                value: "Checked Out",
                symbol: {
                  type: "picture-marker",
                  url: MAP_ICONS.end,
                  width: START_SIZE,
                  height: START_SIZE,
                },
              },
              {
                value: "Checked In",
                symbol: {
                  type: "picture-marker",
                  url: "/images/icon1.png",
                  width: iconWidth,
                  height: iconHeight,
                },
              },
            ],
            defaultSymbol: {
              type: "picture-marker",
              url: "/images/icon1.png",
              width: iconWidth,
              height: iconHeight,
            },
          }
        : {
            type: "simple",
            symbol: {
              type: "picture-marker",
              url: icon,
              width: iconWidth,
              height: iconHeight,
            },
          },
    featureReduction: {
      type: "cluster",
      clusterRadius,
      clusterMinSize: 2,
      maxScale: 0,
      popupTemplate: {
        title: `${title} Cluster`,
        content: [
          {
            type: "text",
            text: `This cluster contains {cluster_count} ${title.toLowerCase()} locations.`,
          },
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "cluster_count",
                label: "Count",
                format: {
                  places: 0,
                  digitSeparator: true,
                },
              },
            ],
          },
        ],
      },
      clusterRenderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          style: "circle",
          color,
          size: "20px",
          outline: { color: "#ffffff", width: 1.5 },
        },
        label: "{cluster_count}",
        labelPlacement: "center",
      },
    },
    popupTemplate,
    minScale: 0,
    maxScale: 0,
  });
};

// ── Component ────────────────────────────────────────────────────────────
const ArcGISMap: React.FC<ArcGISMapProps> = ({
  inspectors,
  center = [55.2743, 25.1972],
  zoom = 15,
  height = "500px",
  legendEnabled = true,
  onInspectorClick,
  onlyInspector = null,
  clickable = true,
  inspectorPath = [],
  fineLocations = [],
  parkingFineLocations = [],
  warningLocations = [],
  routineLocations = [],
  towingLocations = [],
  obstacleLocations = [],
  showPath = true,
  showFineLocations = true,
  onLocationPick,
  pickedLat = null,
  pickedLng = null,
  pickedLocationIconUrl,
  pickedLocationIconSize = 30,
  showTowingRoute = false,
  towingStartPoint,
  towingEndPoint,
  onFineClick,
  onInspectionClick,
  layerVisibility,
  parkingPoints = [],
  showParkingClusters = true,
  clusterRadius = DEFAULT_CLUSTER_RADIUS,
  onParkingClusterClick,
  showBasemapToggle = true,
  enableBoundaryDrawing = false,
  onBoundaryDrawn,
  boundaryShape,
  onClearBoundary,
  hiddenLegendItems = [],
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const featureServiceLayersRef = useRef<__esri.FeatureLayer[]>([]);
  const markerFeatureLayersRef = useRef<globalThis.Map<string, __esri.FeatureLayer>>(new globalThis.Map());
  const graphicsLayersRef = useRef<globalThis.Map<string, __esri.GraphicsLayer>>(new globalThis.Map());
  const parkingGroupLayerRef = useRef<GroupLayer | null>(null);
  const expandRef = useRef<__esri.Expand | null>(null);
  const layerPanelContainerRef = useRef<HTMLDivElement | null>(null);
  const renderLayerPanelRef = useRef<() => void>(() => {});
  const locationMarkerRef = useRef<__esri.Graphic | null>(null);
  const hiddenStatusesRef = useRef<Set<string>>(new Set());
  const [basemap, setBasemap] = useState("streets-navigation-vector");
  const [parkingClusteringEnabled, setParkingClusteringEnabled] = useState(showParkingClusters);
  const [isMapReady, setIsMapReady] = useState(false);
  const currentLanguage = document.documentElement.lang || localStorage.getItem("i18nextLng") || "en";
  const parkingPointsRef = useRef(parkingPoints);
  const parkingClusteringEnabledRef = useRef(parkingClusteringEnabled);
  const currentLanguageRef = useRef(currentLanguage);
  const onParkingClusterClickRef = useRef(onParkingClusterClick);

  const sketchWidgetRef = useRef<__esri.Sketch | null>(null);
  const boundaryGraphicsLayerRef = useRef<__esri.GraphicsLayer | null>(null);

  useEffect(() => {
    parkingPointsRef.current = parkingPoints;
  }, [parkingPoints]);

  useEffect(() => {
    parkingClusteringEnabledRef.current = parkingClusteringEnabled;
  }, [parkingClusteringEnabled]);

  useEffect(() => {
    currentLanguageRef.current = currentLanguage;
  }, [currentLanguage]);

  useEffect(() => {
    onParkingClusterClickRef.current = onParkingClusterClick;
  }, [onParkingClusterClick]);

  renderLayerPanelRef.current = () => {
    const panel = layerPanelContainerRef.current;
    if (!panel) return;

    const language = currentLanguageRef.current;
    panel.innerHTML = "";
    panel.className = "arcgis-custom-layer-panel";

    const createIconElement = (iconUrl?: string, iconSize: string = "22px", lineColor?: string) => {
      if (lineColor) {
        const line = document.createElement("span");
        line.style.cssText = `
          display:block;width:24px;height:4px;border-radius:999px;
          background:${lineColor};flex-shrink:0;
        `;
        return line;
      }

      const img = document.createElement("img");
      img.src = iconUrl || "";
      img.alt = "";
      img.style.cssText = `width:${iconSize};height:${iconSize};object-fit:contain;flex-shrink:0;`;
      return img;
    };

    const createRow = (params: {
      label: string;
      iconUrl?: string;
      iconSize?: string;
      lineColor?: string;
      isVisible: boolean;
      onToggle: () => void;
    }) => {
      const row = document.createElement("div");
      row.className = "arcgis-custom-layer-row";

      const left = document.createElement("div");
      left.className = "arcgis-custom-layer-left";
      left.append(createIconElement(params.iconUrl, params.iconSize, params.lineColor));

      const label = document.createElement("span");
      label.className = "arcgis-custom-layer-label";
      label.textContent = params.label;
      left.appendChild(label);

      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = `arcgis-custom-layer-toggle ${params.isVisible ? "is-visible" : "is-hidden"}`;
      const toggleText = params.isVisible
        ? language === "ar"
          ? "إخفاء"
          : "Hide"
        : language === "ar"
          ? "إظهار"
          : "Show";
      toggleBtn.innerHTML = `<span class="arcgis-custom-layer-toggle-icon">${params.isVisible ? EYE_OPEN_ICON : EYE_CLOSED_ICON}</span>`;
      toggleBtn.setAttribute("aria-label", `${toggleText} ${params.label}`);
      toggleBtn.setAttribute("title", `${toggleText} ${params.label}`);
      toggleBtn.setAttribute("aria-pressed", String(params.isVisible));
      toggleBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        params.onToggle();
        renderLayerPanelRef.current();
      });

      row.append(left, toggleBtn);
      return row;
    };

    const layerEntries = LAYER_PANEL_CONFIG.filter((c) => !hiddenLegendItems.includes(c.key))
      .map((config) => {
        const layer =
          graphicsLayersRef.current.get(config.key) ?? markerFeatureLayersRef.current.get(config.key as string) ?? null;
        if (!layer) return null;

        return {
          label: language === "ar" ? config.titleAr : config.titleEn,
          iconUrl: config.iconUrl,
          iconSize: config.iconSize,
          lineColor: config.lineColor,
          isVisible: layer.visible,
          onToggle: () => {
            layer.visible = !layer.visible;
          },
        };
      })
      .filter(Boolean) as Array<{
      label: string;
      iconUrl?: string;
      iconSize?: string;
      lineColor?: string;
      isVisible: boolean;
      onToggle: () => void;
    }>;

    layerEntries.forEach((entry) => {
      panel.appendChild(createRow(entry));
    });

    const parkingGroupLayer = parkingGroupLayerRef.current;
    if (parkingGroupLayer && parkingGroupLayer.layers.length > 0) {
      const sectionTitle = document.createElement("div");
      sectionTitle.className = "arcgis-custom-layer-section-title";
      sectionTitle.textContent = language === "ar" ? "حالة مواقف السيارات" : "Parking Status";
      panel.appendChild(sectionTitle);

      PARKING_STATUS_CONFIG.forEach((config) => {
        const layer = parkingGroupLayer.layers.find((child) => child.title === config.label) as
          | FeatureLayer
          | undefined;
        if (!layer) return;

        panel.appendChild(
          createRow({
            label: config.label,
            iconUrl: config.icon,
            iconSize: "20px",
            isVisible: layer.visible,
            onToggle: () => {
              const hiddenStatuses = hiddenStatusesRef.current;
              if (hiddenStatuses.has(config.value)) {
                hiddenStatuses.delete(config.value);
              } else {
                hiddenStatuses.add(config.value);
              }
              layer.visible = !hiddenStatuses.has(config.value);
            },
          }),
        );
      });

      const clusterRow = document.createElement("label");
      clusterRow.className = "arcgis-custom-layer-cluster-row";

      const clusterCheckbox = document.createElement("input");
      clusterCheckbox.type = "checkbox";
      clusterCheckbox.checked = parkingClusteringEnabledRef.current;
      clusterCheckbox.addEventListener("change", (event) => {
        setParkingClusteringEnabled((event.target as HTMLInputElement).checked);
      });

      const clusterLabel = document.createElement("span");
      clusterLabel.textContent = language === "ar" ? "تجميع" : "Clustering";

      clusterRow.append(clusterCheckbox, clusterLabel);
      panel.appendChild(clusterRow);
    }
  };

  // Sync global callbacks and data
  useEffect(() => {
    globalOnFineClick = onFineClick;
    globalOnInspectionClick = onInspectionClick;
    globalFineLocations = [...fineLocations];
    globalParkingFineLocations = [...parkingFineLocations];
    globalWarningLocations = [...warningLocations];
    globalRoutineLocations = [...routineLocations];
    globalTowingLocations = [...towingLocations];
    globalObstacleLocations = [...obstacleLocations];
  }, [
    onFineClick,
    onInspectionClick,
    fineLocations,
    parkingFineLocations,
    warningLocations,
    routineLocations,
    towingLocations,
    obstacleLocations,
  ]);

  // Global popup button handler
  useEffect(() => {
    if (!globalClickHandlerRegistered) {
      const handleGlobalClick = (e: MouseEvent) => {
        const button = (e.target as HTMLElement).closest(".arcgis-more-details-btn");
        if (!button) return;
        e.preventDefault();
        e.stopPropagation();
        const itemId = button.getAttribute("data-id");
        const type = button.getAttribute("data-type");
        const inspectionGUID = button.getAttribute("data-inspection-guid");
        const inspectionId = button.getAttribute("data-inspection-id");
        const entityCode = button.getAttribute("data-entity-code");
        if (type === "fine") {
          const fine = globalFineLocations.find((f) => String(f.id) === itemId) ||
            globalParkingFineLocations.find((f) => String(f.id) === itemId) || {
              id: itemId,
              inspectionGUID: inspectionGUID || itemId,
              inspectionId: inspectionId || inspectionGUID || itemId,
              entityCode: entityCode || "parking-inspection",
            };
          if (fine && globalOnFineClick) globalOnFineClick(fine);
        } else if (type === "parking") {
          const allParking = parkingPointsRef.current.filter((p) => String(p.objectId) === itemId);
          if (allParking.length > 0 && onParkingClusterClickRef.current) onParkingClusterClickRef.current(allParking);
        } else {
          const all = [
            ...globalWarningLocations,
            ...globalRoutineLocations,
            ...globalTowingLocations,
            ...globalObstacleLocations,
          ];
          const item = all.find((i) => String(i.id) === itemId) || {
            id: itemId,
            inspectionGUID: inspectionGUID || itemId,
            inspectionId: inspectionId || inspectionGUID || itemId,
            entityCode: entityCode || "parking-inspection",
          };
          if (item && globalOnInspectionClick) globalOnInspectionClick(item);
        }
      };
      document.addEventListener("click", handleGlobalClick);
      globalClickHandlerRegistered = true;
      return () => {
        document.removeEventListener("click", handleGlobalClick);
        globalClickHandlerRegistered = false;
      };
    }
  }, []);

  // ── Map Initialization ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({ basemap });
    const view = new MapView({ container: mapRef.current, map, center, zoom });
    viewRef.current = view;
    setIsMapReady(false);

    // Auth interceptor
    esriConfig.request.interceptors.push({
      urls: featureServiceUrls,
      before(params) {
        params.requestOptions.query = params.requestOptions.query || {};
        params.requestOptions.query.token =
          "mzFcMRqhxzPAoRJavp2MJpSdUV_UVcsTrLt1Ox-VIw0tFjEM4ACDyL0H2CwsFUUc-qpr7tKNNafX4hbIhhJekyPNZP0hkq3qUnERH5uBsEuKSFY9_j_jftyQSq4685glDBt9-jy-dc2qvgxc8D_l5tBogE7INT8cd1bJjRvbBGXiQGHBVLyFhM4vCg6RdA17";
      },
    });

    // External feature service layers (hidden) - add FIRST so they're at bottom
    featureServiceLayersRef.current = featureServiceUrls.map((url) => {
      const layerUrl = url.endsWith("/0") ? url : `${url.replace(/\/+$/, "")}/0`;
      const fl = new FeatureLayer({ url: layerUrl, listMode: "hide" });
      map.add(fl);
      return fl;
    });

    // ── Graphics Layers (only for polylines and start points) ──────────
    GRAPHICS_LAYER_DEFS.forEach(({ key, titleEn, titleAr }) => {
      const gl = new GraphicsLayer({
        title: currentLanguage === "ar" ? titleAr : titleEn,
        listMode: "show",
        visible: true,
      });
      map.add(gl);
      graphicsLayersRef.current.set(key, gl);
    });

    // ── Layer Panel ─────────────────────────────────────────────────────
    view.when(() => {
      setIsMapReady(true);

      if (legendEnabled) {
        const panel = document.createElement("div");
        layerPanelContainerRef.current = panel;
        renderLayerPanelRef.current();

        const expand = new Expand({
          view,
          content: panel,
          expandIcon: "layers",
          collapseIcon: "chevrons-right",
          expandTooltip: currentLanguage === "ar" ? "قائمة الطبقات" : "Layer List",
          expanded: false,
          group: "bottom-right",
        });

        view.ui.add(expand, "bottom-right");
        expandRef.current = expand;

        // CSS for always-visible toggles
        const style = document.createElement("style");
        style.textContent = `
          .arcgis-custom-layer-panel {
            min-width: 220px;
            max-height: 300px;
            overflow-y: auto;
            background: #ffffff;
          }
          .arcgis-custom-layer-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 10px 12px;
            border-bottom: 1px solid #e8e8e8;
          }
          .arcgis-custom-layer-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            flex: 1;
          }
          .arcgis-custom-layer-label {
            color: #262626;
            font-size: 13px;
            line-height: 1.35;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .arcgis-custom-layer-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            padding: 0;
            border: none;
            background: transparent;
            color: #667085;
            cursor: pointer;
            border-radius: 50%;
            flex-shrink: 0;
            line-height: 1;
            box-shadow: none;
          }
          .arcgis-custom-layer-toggle.is-hidden {
            border-color: #d9d9d9;
            background: #ffffff;
            color: #595959;
            box-shadow: none;
          }
          .arcgis-custom-layer-toggle-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 0;
          }
          .arcgis-custom-layer-toggle-icon svg {
            width: 16px;
            height: 16px;
          }
          .arcgis-custom-layer-section-title {
            padding: 12px 12px 8px;
            font-size: 11px;
            font-weight: 700;
            color: #8c8c8c;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            background: #fafafa;
            border-top: 1px solid #e8e8e8;
          }
          .arcgis-custom-layer-cluster-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            color: #262626;
            font-size: 13px;
            border-bottom: 1px solid #e8e8e8;
            cursor: pointer;
          }
          .arcgis-custom-layer-cluster-row input {
            margin: 0;
            cursor: pointer;
          }
        `;
        document.head.appendChild(style);
      }

      Promise.all(featureServiceLayersRef.current.map((f) => f.when().catch(() => null))).then(() => {
        featureServiceLayersRef.current.forEach((fl) => view.whenLayerView(fl).catch(() => {}));
      });
    });

    // Cleanup
    return () => {
      expandRef.current?.destroy();
      expandRef.current = null;
      viewRef.current?.destroy();
      viewRef.current = null;
      setIsMapReady(false);
      featureServiceLayersRef.current = [];
      markerFeatureLayersRef.current.clear();
      graphicsLayersRef.current.clear();
      parkingGroupLayerRef.current = null;
      layerPanelContainerRef.current = null;
      locationMarkerRef.current = null;
    };
  }, []);

  // Initialize boundary graphics layer
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (!boundaryGraphicsLayerRef.current) {
      const boundaryLayer = new GraphicsLayer({
        title: "Boundary",
        listMode: "hide",
        visible: true,
      });
      view.map.add(boundaryLayer);
      boundaryGraphicsLayerRef.current = boundaryLayer;
    }

    return () => {
      if (boundaryGraphicsLayerRef.current && viewRef.current?.map) {
        const layer = boundaryGraphicsLayerRef.current;
        if (viewRef.current.map.layers.includes(layer)) {
          viewRef.current.map.remove(layer);
        }
        boundaryGraphicsLayerRef.current = null;
      }
    };
  }, [viewRef.current]);

  // Manage sketch widget for boundary drawing
  useEffect(() => {
    const view = viewRef.current;
    const boundaryLayer = boundaryGraphicsLayerRef.current;

    if (!view || !boundaryLayer) return;

    if (enableBoundaryDrawing && !sketchWidgetRef.current) {
      const sketch = new Sketch({
        layer: boundaryLayer,
        view: view,
        creationMode: "single",
        visibleElements: {
          createTools: {
            point: true,
            polyline: true,
            polygon: true,
            rectangle: true,
            circle: true,
          },
          selectionTools: false,
          undoRedoMenu: false,
        },
        defaultCreateOptions: {
          mode: "hybrid",
        },
      });

      sketchWidgetRef.current = sketch;
      view.ui.add(sketch, "top-right");

      const createHandle = sketch.on("create", (event) => {
        if (event.state === "complete") {
          const graphic = event.graphic;
          if (graphic && graphic.geometry) {
            const geometry: any = graphic.geometry;
            let shapeData: { type: "Polygon" | "LineString" | "Point"; coordinates: any } | null = null;

            if (geometry.type === "polygon") {
              let rings = geometry.rings;
              if (rings.length > 0 && rings[0].length > 0 && Math.abs(rings[0][0][0]) > 180) {
                rings = rings.map((ring: number[][]) =>
                  ring.map((pt) => {
                    const lon = (pt[0] / 20037508.34) * 180;
                    let lat = (pt[1] / 20037508.34) * 180;
                    lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
                    return [lon, lat];
                  }),
                );
              }
              shapeData = { type: "Polygon", coordinates: rings };
            } else if (geometry.type === "polyline") {
              let paths = geometry.paths;
              if (paths.length > 0 && paths[0].length > 0 && Math.abs(paths[0][0][0]) > 180) {
                paths = paths.map((path: number[][]) =>
                  path.map((pt) => {
                    const lon = (pt[0] / 20037508.34) * 180;
                    let lat = (pt[1] / 20037508.34) * 180;
                    lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
                    return [lon, lat];
                  }),
                );
              }
              shapeData = { type: "LineString", coordinates: paths[0] || [] };
            } else if (geometry.type === "point") {
              let lon = geometry.longitude;
              let lat = geometry.latitude;
              if (Math.abs(lon) > 180) {
                lon = (lon / 20037508.34) * 180;
                lat = (lat / 20037508.34) * 180;
                lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
              }
              shapeData = { type: "Point", coordinates: [lon, lat] };
            }

            setTimeout(() => {
              if (shapeData) {
                onBoundaryDrawn?.(shapeData);
              }
            }, 0);
          }
        }
      });

      (sketchWidgetRef.current as any)._createHandle = createHandle;
    } else if (!enableBoundaryDrawing && sketchWidgetRef.current) {
      const sketch = sketchWidgetRef.current;
      const createHandle = (sketch as any)._createHandle;
      if (createHandle) createHandle.remove();
      sketch.destroy();
      sketchWidgetRef.current = null;
    }

    return () => {
      if (sketchWidgetRef.current) {
        const sketch = sketchWidgetRef.current;
        const createHandle = (sketch as any)._createHandle;
        if (createHandle) createHandle.remove();
        sketch.destroy();
        sketchWidgetRef.current = null;
      }
    };
  }, [enableBoundaryDrawing]);

  // Display existing boundary shape when provided - FIXED VERSION
  useEffect(() => {
    const boundaryLayer = boundaryGraphicsLayerRef.current;
    const view = viewRef.current;
    if (!boundaryLayer || !view) return;

    if (boundaryShape && boundaryShape.coordinates) {
      boundaryLayer.removeAll();

      if (boundaryShape.type === "Polygon") {
        const polygonGeometry = new Polygon({
          rings: boundaryShape.coordinates,
          spatialReference: { wkid: 4326 },
        });

        const graphic = new Graphic({
          geometry: polygonGeometry,
          symbol: new SimpleFillSymbol({
            color: [33, 150, 243, 0.2],
            outline: {
              color: [33, 150, 243],
              width: 2,
            },
          }),
        });

        boundaryLayer.add(graphic);
        view.goTo(polygonGeometry.extent.expand(1.5)).catch(() => {});
      } else if (boundaryShape.type === "LineString") {
        const lineGeometry = new Polyline({
          paths: [boundaryShape.coordinates],
          spatialReference: { wkid: 4326 },
        });

        const graphic = new Graphic({
          geometry: lineGeometry,
          symbol: new SimpleLineSymbol({
            color: [33, 150, 243],
            width: 3,
          }),
        });

        boundaryLayer.add(graphic);
        view.goTo(lineGeometry.extent.expand(1.5)).catch(() => {});
      } else if (boundaryShape.type === "Point") {
        const pointGeometry = new Point({
          longitude: boundaryShape.coordinates[0],
          latitude: boundaryShape.coordinates[1],
          spatialReference: { wkid: 4326 },
        });

        const graphic = new Graphic({
          geometry: pointGeometry,
          symbol: new SimpleMarkerSymbol({
            color: [33, 150, 243],
            size: 12,
            outline: {
              color: [255, 255, 255],
              width: 2,
            },
          }),
        });

        boundaryLayer.add(graphic);
        view
          .goTo({
            center: [pointGeometry.longitude, pointGeometry.latitude],
            zoom: 15,
          })
          .catch(() => {});
      }
    } else {
      boundaryLayer.removeAll();
      sketchWidgetRef.current?.cancel();
    }
  }, [boundaryShape, isMapReady]);

  // Handle clear boundary action from parent
  useEffect(() => {
    const boundaryLayer = boundaryGraphicsLayerRef.current;
    if (!boundaryLayer) return;

    if (!boundaryShape) {
      boundaryLayer.removeAll();
      sketchWidgetRef.current?.cancel();
    }
  }, [boundaryShape]);

  useEffect(() => {
    const map = viewRef.current?.map;
    if (!map) return;

    markerFeatureLayersRef.current.forEach((layer) => {
      if (map.layers.includes(layer)) map.remove(layer);
      layer.destroy();
    });
    markerFeatureLayersRef.current.clear();

    if (parkingGroupLayerRef.current) {
      if (map.layers.includes(parkingGroupLayerRef.current)) map.remove(parkingGroupLayerRef.current);
      parkingGroupLayerRef.current.destroy();
      parkingGroupLayerRef.current = null;
    }

    const applyLayerVisibility = <T extends __esri.Layer>(layer: T, key?: LayerKey) => {
      if (!key) return layer;
      const isVisible = layerVisibility?.[key];
      if (typeof isVisible === "boolean") layer.visible = isVisible;
      return layer;
    };

    const addMarkerLayer = (key: LayerKey, layer: __esri.FeatureLayer | null) => {
      if (!layer) return;
      map.add(applyLayerVisibility(layer, key));
      markerFeatureLayersRef.current.set(key, layer);
    };

    if (showFineLocations && fineLocations.length > 0) {
      addMarkerLayer(
        "fine",
        createClusterLayer({
          title: currentLanguage === "ar" ? "المخالفات" : "Fines",
          icon: MAP_ICONS.fine,
          color: "#E53935CC",
          points: fineLocations.map((fine) => ({
            attributes: {
              id: fine.id,
              inspectionGUID: fine.inspectionGUID || fine.id,
              inspectionId: fine.inspectionId || fine.inspectionGUID || fine.id,
              entityCode: fine.entityCode || "parking-inspection",
              name: fine.plateNumber || fine.tradeLicenseNumber || "—",
              tradeLicenseNumber: fine.tradeLicenseNumber || "",
              fineAmount: fine.fineAmount ?? 0,
              entityNo: (fine as any).entityNo || "",
              timestamp: (fine as any).entityDateTime || fine.timestamp,
              plateNumber: fine.plateNumber,
            },
            longitude: fine.lng,
            latitude: fine.lat,
          })),
          iconWidth: PIN_W,
          iconHeight: PIN_H,
          objectIdField: "OBJECTID",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "id", type: "string" },
            { name: "inspectionGUID", type: "string" },
            { name: "inspectionId", type: "string" },
            { name: "entityCode", type: "string" },
            { name: "name", type: "string" },
            { name: "tradeLicenseNumber", type: "string" },
            { name: "fineAmount", type: "double" },
            { name: "entityNo", type: "string" },
            { name: "timestamp", type: "string" },
            { name: "plateNumber", type: "string" },
          ],
          clusterRadius,
          popupTemplate: new PopupTemplate({
            title: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              return attrs.plateNumber
                ? `${currentLanguage === "ar" ? "مخالفة:" : "Fine:"} ${attrs.plateNumber}`
                : `${currentLanguage === "ar" ? "مخالفة:" : "Fine:"} ${attrs.entityNo || attrs.id || "—"}`;
            },
            content: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              const fineId = String(attrs.id);
              const hasPlate = attrs.plateNumber?.trim();
              const plateDisplay = hasPlate ? attrs.plateNumber : attrs.tradeLicenseNumber || attrs.name || "—";
              const plateLabel = hasPlate
                ? currentLanguage === "ar"
                  ? "رقم اللوحة"
                  : "Plate Number"
                : currentLanguage === "ar"
                  ? "رقم الرخصة التجارية"
                  : "Trade License Number";
              const rows = [
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "المبلغ" : "Amount",
                  value: `AED ${attrs.fineAmount ?? 0}`,
                  valueColor: "#cf1322",
                },
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "الوقت" : "Time",
                  value: formatDateTime(attrs.timestamp),
                },
                { icon: "", label: plateLabel, value: plateDisplay },
              ];
              return createPopupDOMElement(fineId, rows, "fine", true, currentLanguage, {
                "inspection-guid": String(attrs.inspectionGUID || attrs.id || ""),
                "inspection-id": String(attrs.inspectionId || attrs.inspectionGUID || attrs.id || ""),
                "entity-code": String(attrs.entityCode || "parking-inspection"),
              });
            },
          }),
        }),
      );
    }

    // ─── Parking Fine Locations cluster block ───
    if (showFineLocations && parkingFineLocations.length > 0) {
      addMarkerLayer(
        "parkingFine",
        createClusterLayer({
          title: currentLanguage === "ar" ? "مخالفات مواقف" : "Parking Fines",
          icon: MAP_ICONS.parkingfine,
          color: "#1565C0CC",
          points: parkingFineLocations.map((fine) => ({
            attributes: {
              id: fine.id,
              inspectionGUID: fine.inspectionGUID || fine.id,
              inspectionId: fine.inspectionId || fine.inspectionGUID || fine.id,
              entityCode: fine.entityCode || "parking-inspection",
              name: fine.plateNumber || fine.tradeLicenseNumber || "—",
              tradeLicenseNumber: fine.tradeLicenseNumber || "",
              fineAmount: fine.fineAmount ?? 0,
              entityNo: (fine as any).entityNo || "",
              timestamp: (fine as any).entityDateTime || fine.timestamp,
              plateNumber: fine.plateNumber,
            },
            longitude: fine.lng,
            latitude: fine.lat,
          })),
          iconWidth: PIN_W,
          iconHeight: PIN_H,
          objectIdField: "OBJECTID",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "id", type: "string" },
            { name: "inspectionGUID", type: "string" },
            { name: "inspectionId", type: "string" },
            { name: "entityCode", type: "string" },
            { name: "name", type: "string" },
            { name: "tradeLicenseNumber", type: "string" },
            { name: "fineAmount", type: "double" },
            { name: "entityNo", type: "string" },
            { name: "timestamp", type: "string" },
            { name: "plateNumber", type: "string" },
          ],
          clusterRadius,
          popupTemplate: new PopupTemplate({
            title: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              return attrs.plateNumber
                ? `${currentLanguage === "ar" ? "مخالفة موقف:" : "Parking Fine:"} ${attrs.plateNumber}`
                : `${currentLanguage === "ar" ? "مخالفة موقف:" : "Parking Fine:"} ${attrs.entityNo || attrs.id || "—"}`;
            },
            content: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              const fineId = String(attrs.id);
              const hasPlate = attrs.plateNumber?.trim();
              const plateDisplay = hasPlate ? attrs.plateNumber : attrs.tradeLicenseNumber || attrs.name || "—";
              const plateLabel = hasPlate
                ? currentLanguage === "ar"
                  ? "رقم اللوحة"
                  : "Plate Number"
                : currentLanguage === "ar"
                  ? "رقم الرخصة التجارية"
                  : "Trade License Number";
              const rows = [
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "المبلغ" : "Amount",
                  value: `AED ${attrs.fineAmount ?? 0}`,
                  valueColor: "#eb2630",
                },
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "الوقت" : "Time",
                  value: formatDateTime(attrs.timestamp),
                },
                { icon: "", label: plateLabel, value: plateDisplay },
              ];
              return createPopupDOMElement(fineId, rows, "fine", true, currentLanguage, {
                "inspection-guid": String(attrs.inspectionGUID || attrs.id || ""),
                "inspection-id": String(attrs.inspectionId || attrs.inspectionGUID || attrs.id || ""),
                "entity-code": String(attrs.entityCode || "parking-inspection"),
              });
            },
          }),
        }),
      );
    }

    if (warningLocations.length > 0) {
      addMarkerLayer(
        "warning",
        createClusterLayer({
          title: currentLanguage === "ar" ? "التحذيرات" : "Warnings",
          icon: MAP_ICONS.warning,
          color: "#F9A825CC",
          points: warningLocations.map((warning) => ({
            attributes: {
              id: warning.id,
              inspectionGUID: warning.inspectionGUID || warning.id,
              inspectionId: warning.inspectionId || warning.inspectionGUID || warning.id,
              entityCode: warning.entityCode || "parking-inspection",
              name: warning.plateNumber || warning.tradeLicenseNumber || "—",
              tradeLicenseNumber: warning.tradeLicenseNumber || "",
              entityNo: warning.entityNo || "",
              timestamp: (warning as any).entityDateTime || warning.timestamp,
              plateNumber: warning.plateNumber,
            },
            longitude: warning.lng,
            latitude: warning.lat,
          })),
          iconWidth: PIN_W,
          iconHeight: PIN_H,
          objectIdField: "OBJECTID",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "id", type: "string" },
            { name: "inspectionGUID", type: "string" },
            { name: "inspectionId", type: "string" },
            { name: "entityCode", type: "string" },
            { name: "name", type: "string" },
            { name: "tradeLicenseNumber", type: "string" },
            { name: "entityNo", type: "string" },
            { name: "timestamp", type: "string" },
            { name: "plateNumber", type: "string" },
          ],
          clusterRadius,
          popupTemplate: new PopupTemplate({
            title: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              return attrs.plateNumber
                ? `${currentLanguage === "ar" ? "تحذير:" : "Warning:"} ${attrs.plateNumber}`
                : `${currentLanguage === "ar" ? "تحذير:" : "Warning:"} ${attrs.entityNo || attrs.id || "—"}`;
            },
            content: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              const itemId = String(attrs.id);
              const hasPlate = attrs.plateNumber?.trim();
              const plateDisplay = hasPlate ? attrs.plateNumber : attrs.tradeLicenseNumber || attrs.name || "—";
              const plateLabel = hasPlate
                ? currentLanguage === "ar"
                  ? "رقم اللوحة"
                  : "Plate Number"
                : currentLanguage === "ar"
                  ? "رقم الرخصة التجارية"
                  : "Trade License Number";
              const rows = [
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "النوع" : "Type",
                  value: currentLanguage === "ar" ? "تفتيش تحذيري" : "Warning Inspection",
                },
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "الوقت" : "Time",
                  value: formatDateTime(attrs.timestamp),
                },
                { icon: "", label: plateLabel, value: plateDisplay },
              ];
              return createPopupDOMElement(itemId, rows, "inspection", true, currentLanguage, {
                "inspection-guid": String(attrs.inspectionGUID || attrs.id || ""),
                "inspection-id": String(attrs.inspectionId || attrs.inspectionGUID || attrs.id || ""),
                "entity-code": String(attrs.entityCode || "parking-inspection"),
              });
            },
          }),
        }),
      );
    }

    if (routineLocations.length > 0) {
      addMarkerLayer(
        "routine",
        createClusterLayer({
          title: currentLanguage === "ar" ? "الروتينية" : "Routine",
          icon: MAP_ICONS.routine,
          color: "#34A853CC",
          points: routineLocations.map((routine) => ({
            attributes: {
              id: routine.id,
              inspectionGUID: routine.inspectionGUID || routine.id,
              inspectionId: routine.inspectionId || routine.inspectionGUID || routine.id,
              entityCode: routine.entityCode || "parking-inspection",
              name: routine.plateNumber || routine.tradeLicenseNumber || "—",
              tradeLicenseNumber: routine.tradeLicenseNumber || "",
              entityNo: routine.entityNo || "",
              timestamp: (routine as any).entityDateTime || routine.timestamp,
              plateNumber: routine.plateNumber,
            },
            longitude: routine.lng,
            latitude: routine.lat,
          })),
          iconWidth: PIN_W,
          iconHeight: PIN_H,
          objectIdField: "OBJECTID",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "id", type: "string" },
            { name: "inspectionGUID", type: "string" },
            { name: "inspectionId", type: "string" },
            { name: "entityCode", type: "string" },
            { name: "name", type: "string" },
            { name: "tradeLicenseNumber", type: "string" },
            { name: "entityNo", type: "string" },
            { name: "timestamp", type: "string" },
            { name: "plateNumber", type: "string" },
          ],
          clusterRadius,
          popupTemplate: new PopupTemplate({
            title: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              return attrs.plateNumber
                ? `${currentLanguage === "ar" ? "روتيني:" : "Routine:"} ${attrs.plateNumber}`
                : `${currentLanguage === "ar" ? "روتيني:" : "Routine:"} ${attrs.entityNo || attrs.id || "—"}`;
            },
            content: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              const itemId = String(attrs.id);
              const hasPlate = attrs.plateNumber?.trim();
              const plateDisplay = hasPlate ? attrs.plateNumber : attrs.tradeLicenseNumber || attrs.name || "—";
              const plateLabel = hasPlate
                ? currentLanguage === "ar"
                  ? "رقم اللوحة"
                  : "Plate Number"
                : currentLanguage === "ar"
                  ? "رقم الرخصة التجارية"
                  : "Trade License Number";
              const rows = [
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "النوع" : "Type",
                  value: currentLanguage === "ar" ? "تفتيش روتيني" : "Routine Inspection",
                },
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "الوقت" : "Time",
                  value: formatDateTime(attrs.timestamp),
                },
                { icon: "", label: plateLabel, value: plateDisplay },
              ];
              return createPopupDOMElement(itemId, rows, "inspection", true, currentLanguage, {
                "inspection-guid": String(attrs.inspectionGUID || attrs.id || ""),
                "inspection-id": String(attrs.inspectionId || attrs.inspectionGUID || attrs.id || ""),
                "entity-code": String(attrs.entityCode || "parking-inspection"),
              });
            },
          }),
        }),
      );
    }

    if (towingLocations.length > 0) {
      addMarkerLayer(
        "towing",
        createClusterLayer({
          title: currentLanguage === "ar" ? "السحب" : "Towing",
          icon: MAP_ICONS.towing,
          color: "#7B1FA2CC",
          points: towingLocations.map((tow) => ({
            attributes: {
              id: tow.id,
              inspectionGUID: tow.inspectionGUID || tow.id,
              inspectionId: tow.inspectionId || tow.inspectionGUID || tow.id,
              entityCode: tow.entityCode || "parking-inspection",
              name: tow.plateNumber || "—",
              entityNo: tow.entityNo || "",
              timestamp: (tow as any).entityDateTime || tow.timestamp,
              towingStatus: tow.towingStatus,
              plateNumber: tow.plateNumber,
            },
            longitude: tow.lng,
            latitude: tow.lat,
          })),
          iconWidth: PIN_W,
          iconHeight: PIN_H,
          objectIdField: "OBJECTID",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "id", type: "string" },
            { name: "inspectionGUID", type: "string" },
            { name: "inspectionId", type: "string" },
            { name: "entityCode", type: "string" },
            { name: "name", type: "string" },
            { name: "entityNo", type: "string" },
            { name: "timestamp", type: "string" },
            { name: "towingStatus", type: "string" },
            { name: "plateNumber", type: "string" },
          ],
          clusterRadius,
          popupTemplate: new PopupTemplate({
            title: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              return attrs.plateNumber
                ? `${currentLanguage === "ar" ? "سحب:" : "Towing:"} ${attrs.plateNumber}`
                : `${currentLanguage === "ar" ? "سحب:" : "Towing:"} ${attrs.entityNo || attrs.id || "—"}`;
            },
            content: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              const itemId = String(attrs.id);
              const rows = [
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "الحالة" : "Status",
                  value: attrs.towingStatus || (currentLanguage === "ar" ? "مطلوب" : "Requested"),
                },
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "الوقت" : "Time",
                  value: formatDateTime(attrs.timestamp),
                },
                { icon: "", label: currentLanguage === "ar" ? "رقم اللوحة" : "Plate", value: attrs.plateNumber || "—" },
              ];
              return createPopupDOMElement(itemId, rows, "inspection", false, currentLanguage, {
                "inspection-guid": String(attrs.inspectionGUID || attrs.id || ""),
                "inspection-id": String(attrs.inspectionId || attrs.inspectionGUID || attrs.id || ""),
                "entity-code": String(attrs.entityCode || "parking-inspection"),
              });
            },
          }),
        }),
      );
    }

    if (obstacleLocations.length > 0) {
      addMarkerLayer(
        "obstacle",
        createClusterLayer({
          title: currentLanguage === "ar" ? "العوائق" : "Obstacles",
          icon: MAP_ICONS.obstacle,
          color: "#F57C00CC",
          points: obstacleLocations.map((obstacle) => ({
            attributes: {
              id: obstacle.id,
              name: `Obstacle ${obstacle.id}`,
              createdDateTime: obstacle.createdDateTime,
            },
            longitude: obstacle.lng,
            latitude: obstacle.lat,
          })),
          iconWidth: PIN_W,
          iconHeight: PIN_H,
          objectIdField: "OBJECTID",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "id", type: "string" },
            { name: "name", type: "string" },
            { name: "createdDateTime", type: "string" },
          ],
          clusterRadius,
          popupTemplate: new PopupTemplate({
            title: currentLanguage === "ar" ? "عائق" : "Obstacle",
            content: (feature: any) => {
              const attrs = getPopupAttributes(feature);
              const rows = [
                {
                  icon: "",
                  label: currentLanguage === "ar" ? "تاريخ البلاغ" : "Reported Date",
                  value: formatDateTime(attrs.createdDateTime),
                },
              ];
              return createPopupDOMElement(String(attrs.id), rows, "inspection", false, currentLanguage);
            },
          }),
        }),
      );
    }

    const toDraw = onlyInspector ? [onlyInspector] : inspectors;
    if (toDraw.length > 0) {
      const lastPathPoint = showPath && inspectorPath.length > 0 ? inspectorPath[inspectorPath.length - 1] : null;
      addMarkerLayer(
        "inspector",
        createClusterLayer({
          title: currentLanguage === "ar" ? "المفتش" : "Inspector",
          icon: "/images/icon1.png",
          color: "#0070ffCC",
          points: toDraw.map((inspector) => ({
            attributes: {
              id: inspector.id,
              name: inspector.name,
              status: inspector.status,
              zone: inspector.zone || "N/A",
              markerType: inspector.markerType || "default",
            },
            longitude: lastPathPoint?.lng ?? inspector.lng,
            latitude: lastPathPoint?.lat ?? inspector.lat,
          })),
          iconWidth: AVATAR_SIZE,
          iconHeight: AVATAR_SIZE,
          objectIdField: "OBJECTID",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "id", type: "string" },
            { name: "name", type: "string" },
            { name: "status", type: "string" },
            { name: "zone", type: "string" },
            { name: "markerType", type: "string" },
          ],
          clusterRadius,
          popupTemplate: new PopupTemplate({
            title: "{name}",
            content: `<b>${currentLanguage === "ar" ? "الحالة:" : "Status:"}</b> {status}<br><b>${currentLanguage === "ar" ? "المنطقة:" : "Zone:"}</b> {zone}`,
          }),
        }),
      );
    }

    const parkingLayers = PARKING_STATUS_CONFIG.map((config) => {
      const statusPoints = parkingPoints.filter((point) => point.status === config.value);
      if (statusPoints.length === 0) return null;

      const layer = createClusterLayer({
        title: config.label,
        icon: config.icon,
        color: config.color,
        points: statusPoints.map((point) => ({
          attributes: { name: point.name, status: point.status },
          longitude: point.longitude,
          latitude: point.latitude,
        })),
        iconWidth: "36px",
        iconHeight: "36px",
        objectIdField: "OBJECTID",
        fields: [
          { name: "OBJECTID", type: "oid" },
          { name: "name", type: "string" },
          { name: "status", type: "string" },
        ],
        clusterRadius,
        listMode: "hide",
        popupTemplate: new PopupTemplate({
          title: "{name}",
          content: `Status: ${config.label}`,
        }),
      });

      if (!layer) return null;
      layer.visible = !hiddenStatusesRef.current.has(config.value);
      if (!parkingClusteringEnabled) layer.featureReduction = null;
      return layer;
    }).filter(Boolean) as FeatureLayer[];

    if (parkingLayers.length > 0) {
      const parkingGroupLayer = new GroupLayer({
        title: currentLanguage === "ar" ? "حالة مواقف السيارات" : "Parking Status",
        visibilityMode: "independent",
        listMode: "hide-children",
        layers: parkingLayers,
      });

      parkingGroupLayerRef.current = parkingGroupLayer;
      map.add(parkingGroupLayer);
    }

    renderLayerPanelRef.current();
  }, [
    clusterRadius,
    currentLanguage,
    fineLocations,
    parkingFineLocations,
    inspectors,
    inspectorPath,
    layerVisibility,
    obstacleLocations,
    onlyInspector,
    parkingClusteringEnabled,
    parkingPoints,
    routineLocations,
    showFineLocations,
    showPath,
    towingLocations,
    warningLocations,
  ]);

  // Sync external layerVisibility prop
  useEffect(() => {
    if (!layerVisibility) return;
    Object.entries(layerVisibility).forEach(([key, isVisible]) => {
      const gl = graphicsLayersRef.current.get(key);
      if (gl && typeof isVisible === "boolean") gl.visible = isVisible;

      const fl = markerFeatureLayersRef.current.get(key as LayerKey);
      if (fl && typeof isVisible === "boolean") fl.visible = isVisible;
    });
    renderLayerPanelRef.current();
  }, [layerVisibility]);

  // Basemap switch
  useEffect(() => {
    if (viewRef.current) viewRef.current.map.basemap = basemap as any;
  }, [basemap]);

  // Location picking
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const h = view.on("click", (e: any) => {
      if (onLocationPick) onLocationPick(e.mapPoint.latitude, e.mapPoint.longitude);
    });
    return () => h.remove();
  }, [onLocationPick]);

  // Picked location marker
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (locationMarkerRef.current) {
      view.graphics.remove(locationMarkerRef.current);
      locationMarkerRef.current = null;
    }
    if (pickedLat !== null && pickedLng !== null) {
      const symbol = pickedLocationIconUrl
        ? new PictureMarkerSymbol({
            url: pickedLocationIconUrl,
            width: pickedLocationIconSize,
            height: pickedLocationIconSize,
          })
        : new SimpleMarkerSymbol({ color: [255, 0, 0], size: 12, outline: { color: [255, 255, 255], width: 2 } });

      const m = new Graphic({
        geometry: new Point({ longitude: pickedLng, latitude: pickedLat, spatialReference: { wkid: 4326 } }),
        symbol,
      });
      view.graphics.add(m);
      locationMarkerRef.current = m;
      view.goTo({ center: [pickedLng, pickedLat], zoom: 16 }).catch(console.warn);
    }
  }, [pickedLat, pickedLng, pickedLocationIconSize, pickedLocationIconUrl]);

  // ── Draw polyline graphics (Path + Towing Route) ─────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const pathLayer = graphicsLayersRef.current.get("inspectorPath");
    const startLayer = graphicsLayersRef.current.get("startPoint");
    if (!pathLayer || !startLayer) return;

    pathLayer.removeAll();
    startLayer.removeAll();

    const toDraw = onlyInspector ? [onlyInspector] : inspectors;

    // Inspector Path
    if (showPath && inspectorPath && inspectorPath.length > 1) {
      pathLayer.add(
        new Graphic({
          geometry: new Polyline({
            paths: [inspectorPath.map((p) => [p.lng, p.lat])],
            spatialReference: { wkid: 4326 },
          }),
          symbol: new SimpleLineSymbol({ color: [0, 112, 255, 0.85], width: 4, style: "solid" }),
          attributes: { type: "path" },
        }),
      );
      const first = inspectorPath[0];
      startLayer.add(
        new Graphic({
          geometry: new Point({ longitude: first.lng, latitude: first.lat, spatialReference: { wkid: 4326 } }),
          symbol: new PictureMarkerSymbol({ url: MAP_ICONS.start, width: START_SIZE, height: START_SIZE }),
          attributes: { type: "start" },
          popupTemplate: new PopupTemplate({
            title: currentLanguage === "ar" ? "نقطة البداية" : "Start Point",
            content: `<b>${currentLanguage === "ar" ? "الوقت:" : "Time:"}</b> ${first.timestamp}`,
          }),
        }),
      );
    }

    // Towing Route
    if (showTowingRoute && towingStartPoint && towingEndPoint) {
      pathLayer.add(
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
      startLayer.add(
        new Graphic({
          geometry: new Point({
            longitude: towingStartPoint.lng,
            latitude: towingStartPoint.lat,
            spatialReference: { wkid: 4326 },
          }),
          symbol: new PictureMarkerSymbol({ url: MAP_ICONS.start, width: START_SIZE, height: START_SIZE }),
          attributes: { type: "towingStart" },
          popupTemplate: new PopupTemplate({
            title: currentLanguage === "ar" ? "بداية السحب" : "Towing Start",
            content: currentLanguage === "ar" ? "موقع استلام المركبة" : "Vehicle pickup location",
          }),
        }),
      );
    }

    // Auto-zoom
    if (onlyInspector) {
      view.goTo({ center: [onlyInspector.lng, onlyInspector.lat], zoom: 13 }, { duration: 600 }).catch(console.warn);
    } else {
      const pts: Array<{ lng: number; lat: number }> = [];
      toDraw.forEach((insp) => {
        if (showPath && inspectorPath?.length > 0) {
          const l = inspectorPath[inspectorPath.length - 1];
          pts.push({ lng: l.lng, lat: l.lat });
        } else pts.push({ lng: insp.lng, lat: insp.lat });
      });
      inspectorPath?.forEach((p) => pts.push({ lng: p.lng, lat: p.lat }));
      fineLocations?.forEach((f) => pts.push({ lng: f.lng, lat: f.lat }));
      parkingFineLocations?.forEach((f) => pts.push({ lng: f.lng, lat: f.lat }));
      obstacleLocations?.forEach((o) => pts.push({ lng: o.lng, lat: o.lat }));
      warningLocations?.forEach((w) => pts.push({ lng: w.lng, lat: w.lat }));
      routineLocations?.forEach((r) => pts.push({ lng: r.lng, lat: r.lat }));
      towingLocations?.forEach((t) => pts.push({ lng: t.lng, lat: t.lat }));
      parkingPoints?.forEach((p) => pts.push({ lng: p.longitude, lat: p.latitude }));
      if (showTowingRoute && towingStartPoint && towingEndPoint) {
        pts.push({ lng: towingStartPoint.lng, lat: towingStartPoint.lat });
        pts.push({ lng: towingEndPoint.lng, lat: towingEndPoint.lat });
      }
      if (pts.length > 1) {
        const lngs = pts.map((p) => p.lng);
        const lats = pts.map((p) => p.lat);
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
  }, [
    inspectors,
    onlyInspector,
    center,
    zoom,
    inspectorPath,
    fineLocations,
    parkingFineLocations,
    obstacleLocations,
    warningLocations,
    routineLocations,
    towingLocations,
    parkingPoints,
    showPath,
    showFineLocations,
    showTowingRoute,
    towingStartPoint,
    towingEndPoint,
    currentLanguage,
  ]);

  // ── Basemap Menu ──────────────────────────────────────────────────────
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
      {showBasemapToggle && (
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
              zIndex: 1000,
            }}
          />
        </Dropdown>
      )}
    </div>
  );
};

export default ArcGISMap;
