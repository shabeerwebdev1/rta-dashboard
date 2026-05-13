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
import PopupTemplate from "@arcgis/core/PopupTemplate";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { Dropdown, Menu } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import esriConfig from "@arcgis/core/config";
import { MAP_ICONS } from "./mapIconUrls";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

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
  onFineClick?: (fine: any) => void;
  onInspectionClick?: (inspection: any) => void;
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

// Store callbacks globally - use mutable refs so they're always up to date
let globalOnFineClick: ((fine: any) => void) | undefined;
let globalOnInspectionClick: ((inspection: any) => void) | undefined;
let globalFineLocations: any[] = [];
let globalWarningLocations: any[] = [];
let globalRoutineLocations: any[] = [];
let globalTowingLocations: any[] = [];
let globalObstacleLocations: any[] = [];

// Helper function to get Arabic labels based on type
const getArabicLabels = (type: string, data: any) => {
  const labels: Record<string, any> = {
    fine: {
      amount: "المبلغ",
      time: "الوقت",
      plate: "رقم اللوحة",
    },
    warning: {
      type: "النوع",
      time: "الوقت",
      plate: "رقم اللوحة",
    },
    routine: {
      type: "النوع",
      time: "الوقت",
      plate: "رقم اللوحة",
    },
    towing: {
      status: "الحالة",
      time: "الوقت",
      plate: "رقم اللوحة",
    },
    obstacle: {
      type: "النوع",
      reported: "تاريخ البلاغ",
      id: "المعرف",
    },
  };
  return labels[type] || labels.fine;
};

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
) => {
  const container = document.createElement("div");
  container.style.cssText =
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-width:220px;padding:4px 0;';

  // Create table
  const table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;";

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    const tdLabel = document.createElement("td");
    tdLabel.style.cssText = `padding:5px ${language === "ar" ? "0 12px 5px 0" : "5px 12px 5px 0"};color:#8c8c8c;font-weight:500;white-space:nowrap`;
    // Remove icon from label - only show text
    tdLabel.innerHTML = `${row.label}`;

    const tdValue = document.createElement("td");
    tdValue.style.cssText = `padding:5px 0;color:${row.valueColor || "#262626"};font-weight:600;${language === "ar" ? "text-align:right" : "text-align:left"}`;
    tdValue.textContent = row.value;

    tr.appendChild(tdLabel);
    tr.appendChild(tdValue);
    table.appendChild(tr);
  });

  container.appendChild(table);

  // Hide button if showButton = false
  if (showButton) {
    const buttonDiv = document.createElement("div");
    buttonDiv.style.cssText = "border-top:1px solid #f0f0f0;padding-top:10px;text-align:right;";

    const button = document.createElement("button");
    const buttonText = language === "ar" ? "مزيد من التفاصيل" : "More Details";

    button.innerHTML = `
      <svg
  width="14"
  height="14"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  style="flex-shrink:0;"
>
  <path d="M9 18l6-6-6-6"/>
</svg>
      ${buttonText}
    `;

    button.style.cssText = `
      background:linear-gradient(135deg,#1677ff 0%,#0958d9 100%);
      color:#fff;
      border:none;
      border-radius:6px;
      padding:7px 18px;
      font-size:13px;
      font-weight:600;
      cursor:pointer;
      letter-spacing:0.02em;
      box-shadow:0 2px 8px rgba(22,119,255,0.35);
      display:inline-flex;
      align-items:center;
      gap:6px;
    `;

    button.setAttribute("data-id", itemId);
    button.setAttribute("data-type", type);
    button.className = "arcgis-more-details-btn";

    buttonDiv.appendChild(button);
    container.appendChild(buttonDiv);
  }

  return container;
};

// Global click handler that will be registered once
let globalClickHandlerRegistered = false;

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
  onFineClick,
  onInspectionClick,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<__esri.MapView | null>(null);
  const featureLayersRef = useRef<__esri.FeatureLayer[]>([]);
  const [basemap, setBasemap] = useState("streets-navigation-vector");
  const locationMarkerRef = useRef<__esri.Graphic | null>(null);
  const graphicsRef = useRef<any[]>([]);
  const { i18n } = useTranslation();

  // Get current language
  const currentLanguage = document.documentElement.lang || localStorage.getItem("i18nextLng") || "en"; // Update global data and callbacks - use refs to ensure latest values
  useEffect(() => {
    globalOnFineClick = onFineClick;
    globalOnInspectionClick = onInspectionClick;
    globalFineLocations = [...fineLocations]; // Create new array to ensure reactivity
    globalWarningLocations = [...warningLocations];
    globalRoutineLocations = [...routineLocations];
    globalTowingLocations = [...towingLocations];
    globalObstacleLocations = [...obstacleLocations];

    console.log("🟢 Updated global callbacks and data");
    console.log("Fine locations count:", fineLocations.length);
    console.log("Warning locations count:", warningLocations.length);
    console.log("onFineClick exists:", !!onFineClick);
    console.log("onInspectionClick exists:", !!onInspectionClick);
  }, [
    onFineClick,
    onInspectionClick,
    fineLocations,
    warningLocations,
    routineLocations,
    towingLocations,
    obstacleLocations,
  ]);

  // Register a single global click listener for all "More Details" buttons
  useEffect(() => {
    if (!globalClickHandlerRegistered) {
      const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const button = target.closest(".arcgis-more-details-btn");

        if (button) {
          e.preventDefault();
          e.stopPropagation();

          const itemId = button.getAttribute("data-id");
          const type = button.getAttribute("data-type");

          console.log(`🟢 Global click handler: ${type} - ${itemId}`);

          if (type === "fine") {
            const fine = globalFineLocations.find((f) => String(f.id) === itemId);
            if (fine && globalOnFineClick) {
              console.log("🎯 Calling onFineClick with:", fine);
              globalOnFineClick(fine);
            } else {
              console.warn("Fine not found or no handler:", { itemId, fine, hasHandler: !!globalOnFineClick });
            }
          } else {
            const allInspections = [
              ...globalWarningLocations,
              ...globalRoutineLocations,
              ...globalTowingLocations,
              ...globalObstacleLocations,
            ];
            const inspection = allInspections.find((i) => String(i.id) === itemId);
            if (inspection && globalOnInspectionClick) {
              console.log("🎯 Calling onInspectionClick with:", inspection);
              globalOnInspectionClick(inspection);
            } else {
              console.warn("Inspection not found or no handler:", {
                itemId,
                inspection,
                hasHandler: !!globalOnInspectionClick,
              });
            }
          }
        }
      };

      document.addEventListener("click", handleGlobalClick);
      globalClickHandlerRegistered = true;
      console.log("✅ Global click handler registered");

      return () => {
        document.removeEventListener("click", handleGlobalClick);
        globalClickHandlerRegistered = false;
        console.log("❌ Global click handler removed");
      };
    }
  }, []);

  // Map init
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
  }, []);

  // Basemap switch
  useEffect(() => {
    if (viewRef.current) viewRef.current.map.basemap = basemap as any;
  }, [basemap]);

  // Location picking click handler
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const clickHandle = view.on("click", (event: any) => {
      const { latitude, longitude } = event.mapPoint;
      if (onLocationPick) onLocationPick(latitude, longitude);
    });
    return () => clickHandle.remove();
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

  // Main graphics draw
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    // Clear existing graphics
    view.graphics.forEach((g) => {
      if (g !== locationMarkerRef.current) view.graphics.remove(g);
    });
    graphicsRef.current = [];

    const toDraw = onlyInspector ? [onlyInspector] : inspectors;

    // 1. Inspector Path
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

      inspectorPath.forEach((pathPoint, index) => {
        if (index !== 0) return;
        view.graphics.add(
          new Graphic({
            geometry: new Point({
              longitude: pathPoint.lng,
              latitude: pathPoint.lat,
              spatialReference: { wkid: 4326 },
            }),
            symbol: new PictureMarkerSymbol({ url: MAP_ICONS.start, width: START_SIZE, height: START_SIZE }),
            attributes: { timestamp: pathPoint.timestamp, type: "start" },
            popupTemplate: new PopupTemplate({
              title: currentLanguage === "ar" ? "نقطة البداية" : "Start Point",
              content: `<b>${currentLanguage === "ar" ? "الوقت:" : "Time:"}</b> ${pathPoint.timestamp}`,
            }),
          }),
        );
      });
    }

    // 2. Fine Locations
    if (showFineLocations && fineLocations?.length > 0) {
      fineLocations.forEach((fine) => {
        const fineId = String(fine.id);
        const hasPlateNumber = fine.plateNumber && fine.plateNumber.trim() !== "";

        const plateDisplay = hasPlateNumber ? fine.plateNumber : fine.tradeLicenseNumber || "—";

        const plateLabel = hasPlateNumber
          ? currentLanguage === "ar"
            ? "رقم اللوحة"
            : "Plate Number"
          : currentLanguage === "ar"
            ? "رقم الرخصة التجارية"
            : "Trade License Number";
        const timeDisplay = formatDateTime((fine as any).entityDateTime || fine.timestamp);
        const popupTitle = fine.plateNumber
          ? `${currentLanguage === "ar" ? "مخالفة:" : "Fine:"} ${fine.plateNumber}`
          : `${currentLanguage === "ar" ? "مخالفة:" : "Fine:"} ${(fine as any).entityNo || fine.id || "—"}`;

        const rows = [
          {
            icon: "",
            label: currentLanguage === "ar" ? "المبلغ" : "Amount",
            value: `AED ${fine.fineAmount ?? 0}`,
            valueColor: "#cf1322",
          },
          {
            icon: "",
            label: currentLanguage === "ar" ? "الوقت" : "Time",
            value: timeDisplay,
          },
          {
            icon: "",
            label: plateLabel,
            value: plateDisplay,
          },
        ];

        const popupElement = createPopupDOMElement(fineId, rows, "fine", true, currentLanguage);

        const popupTemplate = new PopupTemplate({
          title: popupTitle,
          content: () => popupElement,
        });

        const graphic = new Graphic({
          geometry: new Point({ longitude: fine.lng, latitude: fine.lat, spatialReference: { wkid: 4326 } }),
          symbol: new PictureMarkerSymbol({ url: MAP_ICONS.fine, width: PIN_W, height: PIN_H }),
          attributes: { fine, type: "fine", fineId },
          popupTemplate: popupTemplate,
        });
        view.graphics.add(graphic);
        graphicsRef.current.push(graphic);
      });
    }

    // 3. Warning Locations
    if (warningLocations?.length > 0) {
      warningLocations.forEach((warning) => {
        const itemId = String(warning.id);
        const timeDisplay = formatDateTime((warning as any).entityDateTime || warning.timestamp);
        const hasPlateNumber = warning.plateNumber && warning.plateNumber.trim() !== "";

        const plateDisplay = hasPlateNumber ? warning.plateNumber : warning.tradeLicenseNumber || "—";

        const plateLabel = hasPlateNumber
          ? currentLanguage === "ar"
            ? "رقم اللوحة"
            : "Plate Number"
          : currentLanguage === "ar"
            ? "رقم الرخصة التجارية"
            : "Trade License Number";
        const popupTitle = warning.plateNumber
          ? `${currentLanguage === "ar" ? "تحذير:" : "Warning:"} ${warning.plateNumber}`
          : `${currentLanguage === "ar" ? "تحذير:" : "Warning:"} ${(warning as any).entityNo || warning.id || "—"}`;

        const rows = [
          {
            icon: "",
            label: currentLanguage === "ar" ? "النوع" : "Type",
            value: currentLanguage === "ar" ? "تفتيش تحذيري" : "Warning Inspection",
          },
          {
            icon: "",
            label: currentLanguage === "ar" ? "الوقت" : "Time",
            value: timeDisplay,
          },
          {
            icon: "",
            label: plateLabel,
            value: plateDisplay,
          },
        ];

        const popupElement = createPopupDOMElement(itemId, rows, "inspection", true, currentLanguage);

        const popupTemplate = new PopupTemplate({
          title: popupTitle,
          content: () => popupElement,
        });

        const graphic = new Graphic({
          geometry: new Point({ longitude: warning.lng, latitude: warning.lat, spatialReference: { wkid: 4326 } }),
          symbol: new PictureMarkerSymbol({ url: MAP_ICONS.warning, width: PIN_W, height: PIN_H }),
          attributes: { ...warning, type: "warning" },
          popupTemplate: popupTemplate,
        });
        view.graphics.add(graphic);
        graphicsRef.current.push(graphic);
      });
    }

    // 4. Routine Locations
    if (routineLocations?.length > 0) {
      routineLocations.forEach((routine) => {
        const itemId = String(routine.id);
        const timeDisplay = formatDateTime((routine as any).entityDateTime || routine.timestamp);
        const hasPlateNumber = routine.plateNumber && routine.plateNumber.trim() !== "";

        const plateDisplay = hasPlateNumber ? routine.plateNumber : routine.tradeLicenseNumber || "—";

        const plateLabel = hasPlateNumber
          ? currentLanguage === "ar"
            ? "رقم اللوحة"
            : "Plate Number"
          : currentLanguage === "ar"
            ? "رقم الرخصة التجارية"
            : "Trade License Number";
        const popupTitle = routine.plateNumber
          ? `${currentLanguage === "ar" ? "روتيني:" : "Routine:"} ${routine.plateNumber}`
          : `${currentLanguage === "ar" ? "روتيني:" : "Routine:"} ${(routine as any).entityNo || routine.id || "—"}`;

        const rows = [
          {
            icon: "",
            label: currentLanguage === "ar" ? "النوع" : "Type",
            value: currentLanguage === "ar" ? "تفتيش روتيني" : "Routine Inspection",
          },
          {
            icon: "",
            label: currentLanguage === "ar" ? "الوقت" : "Time",
            value: timeDisplay,
          },
          {
            icon: "",
            label: plateLabel,
            value: plateDisplay,
          },
        ];

        const popupElement = createPopupDOMElement(itemId, rows, "inspection", true, currentLanguage);

        const popupTemplate = new PopupTemplate({
          title: popupTitle,
          content: () => popupElement,
        });

        const graphic = new Graphic({
          geometry: new Point({ longitude: routine.lng, latitude: routine.lat, spatialReference: { wkid: 4326 } }),
          symbol: new PictureMarkerSymbol({ url: MAP_ICONS.routine, width: PIN_W, height: PIN_H }),
          attributes: { ...routine, type: "routine" },
          popupTemplate: popupTemplate,
        });
        view.graphics.add(graphic);
        graphicsRef.current.push(graphic);
      });
    }

    // 5. Towing Locations
    if (towingLocations?.length > 0) {
      towingLocations.forEach((tow) => {
        const itemId = String(tow.id);
        const timeDisplay = formatDateTime((tow as any).entityDateTime || tow.timestamp);
        const plateDisplay = tow.plateNumber || "—";
        const popupTitle = tow.plateNumber
          ? `${currentLanguage === "ar" ? "سحب:" : "Towing:"} ${tow.plateNumber}`
          : `${currentLanguage === "ar" ? "سحب:" : "Towing:"} ${(tow as any).entityNo || tow.id || "—"}`;

        const rows = [
          {
            icon: "",
            label: currentLanguage === "ar" ? "الحالة" : "Status",
            value: tow.towingStatus || (currentLanguage === "ar" ? "مطلوب" : "Requested"),
          },
          {
            icon: "",
            label: currentLanguage === "ar" ? "الوقت" : "Time",
            value: timeDisplay,
          },
          {
            icon: "",
            label: currentLanguage === "ar" ? "رقم اللوحة" : "Plate",
            value: plateDisplay,
          },
        ];

        const popupElement = createPopupDOMElement(itemId, rows, "inspection", false, currentLanguage);

        const popupTemplate = new PopupTemplate({
          title: popupTitle,
          content: () => popupElement,
        });

        const graphic = new Graphic({
          geometry: new Point({ longitude: tow.lng, latitude: tow.lat, spatialReference: { wkid: 4326 } }),
          symbol: new PictureMarkerSymbol({ url: MAP_ICONS.towing, width: PIN_W, height: PIN_H }),
          attributes: { ...tow, type: "towing" },
          popupTemplate: popupTemplate,
        });
        view.graphics.add(graphic);
        graphicsRef.current.push(graphic);
      });
    }

    // 6. Obstacle Locations
    if (obstacleLocations?.length > 0) {
      obstacleLocations.forEach((obstacle) => {
        const itemId = String(obstacle.id);
        const dateDisplay = formatDateTime(obstacle.createdDateTime);
        const rows = [
          // {
          //   icon: "",
          //   label: currentLanguage === "ar" ? "النوع" : "Type",
          //   value: currentLanguage === "ar" ? "عائق طريق" : "Road Obstacle",
          // },
          {
            icon: "",
            label: currentLanguage === "ar" ? "تاريخ البلاغ" : "  Reported Date",
            value: dateDisplay,
          },
          // {
          //   icon: "",
          //   label: currentLanguage === "ar" ? "المعرف" : "ID",
          //   value: itemId,
          // },
        ];

        const popupElement = createPopupDOMElement(itemId, rows, "inspection", false, currentLanguage);

        const popupTemplate = new PopupTemplate({
          title: `${currentLanguage === "ar" ? "عائق:" : "Obstacle"} `,
          content: () => popupElement,
        });

        const graphic = new Graphic({
          geometry: new Point({ longitude: obstacle.lng, latitude: obstacle.lat, spatialReference: { wkid: 4326 } }),
          symbol: new PictureMarkerSymbol({ url: MAP_ICONS.obstacle, width: PIN_W, height: PIN_H }),
          attributes: { ...obstacle, type: "obstacle" },
          popupTemplate: popupTemplate,
        });
        view.graphics.add(graphic);
        graphicsRef.current.push(graphic);
      });
    }

    // 7. Towing Route
    if (showTowingRoute && towingStartPoint && towingEndPoint) {
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
      view.graphics.add(
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

    // 8. Inspector Avatar
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
          popupTemplate: new PopupTemplate({
            title: inspector.name,
            content: `<b>${currentLanguage === "ar" ? "الحالة:" : "Status:"}</b> ${inspector.status}<br><b>${currentLanguage === "ar" ? "المنطقة:" : "Zone:"}</b> ${inspector.zone || "N/A"}`,
          }),
        }),
      );
    });

    // 9. Auto-zoom
    if (onlyInspector) {
      view.goTo({ center: [onlyInspector.lng, onlyInspector.lat], zoom: 13 }, { duration: 600 }).catch(console.warn);
    } else {
      const allPoints: Array<{ lng: number; lat: number }> = [];
      toDraw.forEach((inspector) => {
        if (showPath && inspectorPath?.length > 0) {
          const last = inspectorPath[inspectorPath.length - 1];
          allPoints.push({ lng: last.lng, lat: last.lat });
        } else allPoints.push({ lng: inspector.lng, lat: inspector.lat });
      });
      inspectorPath?.forEach((p) => allPoints.push({ lng: p.lng, lat: p.lat }));
      fineLocations?.forEach((f) => allPoints.push({ lng: f.lng, lat: f.lat }));
      obstacleLocations?.forEach((o) => allPoints.push({ lng: o.lng, lat: o.lat }));
      warningLocations?.forEach((w) => allPoints.push({ lng: w.lng, lat: w.lat }));
      routineLocations?.forEach((r) => allPoints.push({ lng: r.lng, lat: r.lat }));
      towingLocations?.forEach((t) => allPoints.push({ lng: t.lng, lat: t.lat }));
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
  }, [
    inspectors,
    onlyInspector,
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
    currentLanguage,
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
            zIndex: 1000,
          }}
        />
      </Dropdown>
    </div>
  );
};

export default ArcGISMap;
