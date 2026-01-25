// ShiftPlanner.tsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Modal,
  Button,
  Typography,
  Checkbox,
  DatePicker,
  Space,
  Tag,
  Empty,
  Tooltip,
  message,
  Select,
  Collapse,
  Spin,
} from "antd";
import {
  SettingOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  CopyOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

import {
  useLazyGetLookupsQuery,
  useLazyGetZonesQuery,
  useLazyGetShiftsQuery,
  useLazyGetAreasQuery,
  useGetActiveShiftsQuery,
  useUpdateShiftManagementMutation,
} from "../services/rtkApiFactory";
import { useAppNotification } from "../utils/notificationManager";
import { usePage } from "../contexts/PageContext";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Option } = Select;

const redPalette = {
  primaryRed: "#ee3a41",
  textBlack: "#231f20",
  infoBlue: "#00aeef",
  warningOrange: "#faa634",
  successGreen: "#00a967",
  bgLayout: "#f5f7f9",
  bgContainer: "#ffffff",
  borderLight: "#e8e8e8",
  textSecondary: "#6b7280",
};

interface Inspector {
  id: string;
  name: string;
  weeklyOffs?: string[];
}

interface Area {
  id: string;
  name: string;
  assignments: {
    [shiftId: string]: string[];
  };
}

interface Zone {
  id: string;
  name: string;
  zoneCode: string;
  areas: Area[];
}

type AssessmentType =
  | "Illegal Parking"
  | "Prohibited Parking"
  | "Residential Area"
  | "Reserved Parking"
  | "Parking Inspection"
  | "Towing";

interface ShiftInspector extends Inspector {
  weeklyOffs: string[];
  assessmentTypes?: AssessmentType[];
  employeeId: string;
  uswMcode: string;
  roleGUID: string;
  isActive: boolean;
}

interface Shift {
  id: string;
  name: string;
  code: string;
  inspectors: ShiftInspector[];
  zones: Zone[];
  dateRange?: [Dayjs, Dayjs];
}

const allAssessmentOptions: AssessmentType[] = [
  "Illegal Parking",
  "Prohibited Parking",
  "Residential Area",
  "Reserved Parking",
  "Parking Inspection",
  "Towing",
];

const assessmentTypeInitials: Record<AssessmentType, string> = {
  "Illegal Parking": "IP",
  "Prohibited Parking": "PP",
  "Residential Area": "RA",
  "Reserved Parking": "RP",
  "Parking Inspection": "PI",
  Towing: "TW",
};

const shiftColors: Record<string, string> = {
  S1: "#1890ff",
  S2: "#52c41a",
  S3: "#faad14",
  S4: "#722ed1",
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type DraggableInspectorProps = {
  inspector: ShiftInspector;
  id: string;
  contextData?: {
    from: "unassigned" | "shift" | "area";
    shiftId?: string;
    zoneId?: string;
    areaId?: string;
  };
  showAssessmentTags?: boolean;
  showWeeklyOffTag?: boolean;
  onRemoveAssessmentType?: (type: AssessmentType) => void;
  shiftName?: string;
  shiftColor?: string;
};

// Memoized DraggableInspector component to prevent unnecessary re-renders
const DraggableInspector = React.memo(
  ({
    inspector,
    id,
    contextData,
    showAssessmentTags = false,
    showWeeklyOffTag = false,
    onRemoveAssessmentType,
    shiftName,
    shiftColor,
  }: DraggableInspectorProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id,
      data: {
        type: "inspector",
        inspectorId: inspector.id,
        from: contextData?.from ?? "unassigned",
        shiftId: contextData?.shiftId,
        zoneId: contextData?.zoneId,
        areaId: contextData?.areaId,
      },
    });

    const assessmentTypes = inspector.assessmentTypes || [];
    const weeklyOffs = inspector.weeklyOffs || [];
    const cardStyle = useMemo(
      () => ({
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        padding: "10px 14px",
        background: "white",
        color: redPalette.textBlack,
        borderRadius: "6px",
        cursor: "grab",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        fontSize: "13px",
        fontWeight: 500,
        userSelect: "none",
        border: `1px solid ${redPalette.borderLight}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }),
      [transform, isDragging],
    );

    return (
      <div ref={setNodeRef} {...listeners} {...attributes} style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <UserOutlined style={{ fontSize: "14px", color: redPalette.infoBlue }} />
          <span>{inspector.name}</span>
          {shiftName && (
            <Tag color={shiftColor} icon={<ClockCircleOutlined />} style={{ margin: 0, fontSize: "11px" }}>
              {shiftName}
            </Tag>
          )}
          {showWeeklyOffTag && weeklyOffs.length > 0 && (
            <Tooltip title={`Weekly Offs: ${weeklyOffs.join(", ")}`}>
              <Tag color="orange" icon={<CalendarOutlined />} style={{ margin: 0, fontSize: "11px" }}>
                {weeklyOffs.length} Day
                {weeklyOffs.length > 1 ? "s" : ""} Off
              </Tag>
            </Tooltip>
          )}
        </div>
        {showAssessmentTags && assessmentTypes.length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {assessmentTypes.map((type) => (
              <Tooltip key={type} title={type}>
                <Tag
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onRemoveAssessmentType) {
                      onRemoveAssessmentType(type);
                    }
                  }}
                  style={{
                    margin: 0,
                    fontSize: "10px",
                    padding: "0 4px",
                    cursor: "pointer",
                  }}
                  color="blue"
                >
                  {assessmentTypeInitials[type]}
                </Tag>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    );
  },
);

DraggableInspector.displayName = "DraggableInspector";

const DroppableShift: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: "shift" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: "200px",
        maxHeight: "500px",
        overflowY: "auto",
        padding: "16px",
        borderRadius: "8px",
        background: redPalette.bgLayout,
        border: `2px dashed ${isOver ? redPalette.primaryRed : redPalette.borderLight}`,
        boxShadow: isOver ? `0 4px 12px ${redPalette.primaryRed}20` : "none",
        transition: "all 0.3s",
      }}
    >
      {children}
    </div>
  );
};

const DroppableArea: React.FC<{
  id: string;
  children: React.ReactNode;
  hasAssignment: boolean;
}> = ({ id, children, hasAssignment }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: "area" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: "120px",
        padding: "16px",
        border: `2px dashed ${
          isOver ? redPalette.primaryRed : hasAssignment ? redPalette.successGreen : redPalette.borderLight
        }`,
        background: isOver ? "#fff0f0" : hasAssignment ? "#f0f9f4" : redPalette.bgContainer,
        borderRadius: "8px",
        transition: "all 0.3s",
      }}
    >
      {children}
    </div>
  );
};

const ShiftPlanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const notification = useAppNotification();
  const { setPageTitle } = usePage();

  const [unassignedInspectors, setUnassignedInspectors] = useState<Inspector[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentView, setCurrentView] = useState<
    "inspector-shift" | "zones" | "area-assignment" | "global-zones" | "global-area-assignment"
  >("inspector-shift");
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [globalZoneId, setGlobalZoneId] = useState<string | null>(null);
  // PERF FIX: store only ID during drag
  const [draggedInspectorId, setDraggedInspectorId] = useState<string | null>(null);

  const [weeklyOffModal, setWeeklyOffModal] = useState<{
    visible: boolean;
    inspector: ShiftInspector | null;
    shiftId: string | null;
  }>({ visible: false, inspector: null, shiftId: null });

  const [selectedWeeklyOffs, setSelectedWeeklyOffs] = useState<string[]>([]);
  const [selectedInspectorIdsByShift, setSelectedInspectorIdsByShift] = useState<Record<string, string[]>>({});
  const [bulkModal, setBulkModal] = useState<{
    visible: boolean;
    shiftId: string | null;
  }>({ visible: false, shiftId: null });
  const [bulkAssessmentTypes, setBulkAssessmentTypes] = useState<AssessmentType[]>([]);

  const [copyModal, setCopyModal] = useState<{
    visible: boolean;
    shiftId: string | null;
    zoneId: string | null;
    inspectorId: string | null;
    sourceAreaId: string | null;
    targetAreaIds: string[];
  }>({
    visible: false,
    shiftId: null,
    zoneId: null,
    inspectorId: null,
    sourceAreaId: null,
    targetAreaIds: [],
  });

  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [allZones, setAllZones] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const [globalDateRange, setGlobalDateRange] = useState<[Dayjs, Dayjs] | undefined>(undefined);

  // Use refs to store processed data to prevent re-processing
  const assessmentTypeMapRef = useRef<Record<number, AssessmentType>>({});
  const assessmentTypeToValueRef = useRef<Record<string, number>>({});
  // PERF FIX: Single source of truth for inspectors (no objects in DnD)
  const inspectorsByIdRef = useRef<Record<string, ShiftInspector>>({});

  const activeShiftsProcessedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // PERF FIX: Faster drag start, no delay
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 0,
        tolerance: 5,
      },
    }),
  );

  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetShifts] = useLazyGetShiftsQuery();
  const [triggerGetAreas] = useLazyGetAreasQuery();

  const {
    data: activeShiftsResponse,
    isLoading: isLoadingActiveShifts,
    refetch: refetchActiveShifts,
  } = useGetActiveShiftsQuery();

  const [updateShiftManagement, { isLoading: isUpdating }] = useUpdateShiftManagementMutation();

  // Helper function for fetch timeout
  const fetchWithTimeout = useCallback(async (promise: Promise<any>, timeout: number = 30000) => {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout));
    return Promise.race([promise, timeoutPromise]);
  }, []);

  // FIX: Create assessment type mapping with memoization
  const createAssessmentTypeMaps = useCallback(
    (lookupData: any[]) => {
      const map: Record<number, AssessmentType> = {};
      const reverseMap: Record<string, number> = {};

      const lookupItems = lookupData.filter((item) => item.categoryId === 1400);
      console.log("Creating assessment type map from lookups:", lookupItems.length);

      lookupItems.forEach((item) => {
        const label = i18n.language === "ar" && item.labelAr ? item.labelAr : item.labelEn;
        const matchedType = allAssessmentOptions.find((opt) => opt.toLowerCase() === label.toLowerCase());
        if (matchedType) {
          map[item.value] = matchedType;
          reverseMap[matchedType] = parseInt(item.value);
        }
      });

      console.log("Final assessment type map created with", Object.keys(map).length, "entries");
      return { map, reverseMap };
    },
    [i18n.language],
  );

  // FIX: Process active shifts with proper assessment type mapping
  const processActiveShifts = useCallback(
    (activeData: any[], currentShifts: Shift[], assessmentTypeMap: Record<number, AssessmentType>) => {
      const inspectorsByShift: Record<string, ShiftInspector[]> = {};
      const unassigned: Inspector[] = [];

      console.log("Processing active shifts data:", activeData.length);

      activeData
        .filter((item: any) => item.roleCode === "PARINSP")
        .forEach((item: any) => {
          const weekOffDays = item.wO_Days ? item.wO_Days.split(",").filter(Boolean) : [];
          const weekOffNumbers = weekOffDays.map((day: string) => {
            const dayMap: Record<string, string> = {
              Monday: "1",
              Tuesday: "2",
              Wednesday: "3",
              Thursday: "4",
              Friday: "5",
              Saturday: "6",
              Sunday: "7",
              "1": "1",
              "2": "2",
              "3": "3",
              "4": "4",
              "5": "5",
              "6": "6",
              "7": "7",
            };
            return dayMap[day.trim()] || day;
          });

          // FIX: Use the provided assessmentTypeMap
          const assessmentTypes: AssessmentType[] = (item.assignmentTypes || [])
            .map((val: number) => assessmentTypeMap[val])
            .filter((type: AssessmentType | undefined): type is AssessmentType => type !== undefined);

          const inspector: ShiftInspector = {
            id: item.uswMcode || item.employeeId,
            name: item.employeeName,
            employeeId: item.employeeId,
            uswMcode: item.uswMcode,
            roleGUID: item.roleGUID,
            isActive: item.isActive,
            weeklyOffs: weekOffNumbers,
            assessmentTypes,
          };
          // PERF FIX: cache inspector by id (used during drag)
          inspectorsByIdRef.current[inspector.id] = inspector;

          if (item.shiftId && currentShifts.some((s) => s.id === item.shiftId)) {
            if (!inspectorsByShift[item.shiftId]) {
              inspectorsByShift[item.shiftId] = [];
            }
            inspectorsByShift[item.shiftId].push(inspector);
          } else {
            unassigned.push({
              id: inspector.id,
              name: inspector.name,
              weeklyOffs: inspector.weeklyOffs,
            });
          }
        });

      console.log("Inspectors by shift processed:", Object.keys(inspectorsByShift).length, "shifts");
      console.log("Unassigned inspectors:", unassigned.length);

      return { inspectorsByShift, unassigned };
    },
    [],
  );

  // FIX: Optimized data fetching with proper sequencing
  const fetchAllData = useCallback(async () => {
    console.log("fetchAllData called, isInitialLoad:", isInitialLoad, "isLoadingData:", isLoadingData);

    if (isFetchingRef.current) {
      console.log("Already fetching, skipping...");
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingData(true);
    activeShiftsProcessedRef.current = false;

    try {
      console.log("Starting data fetch...");

      // Step 1: Fetch lookups FIRST to create assessment type maps
      console.log("Fetching lookups...");
      const lookups = await fetchWithTimeout(triggerGetLookups([1400]).unwrap(), 30000);
      console.log("Lookups fetched:", lookups.length);

      // Create assessment type maps immediately
      const { map: assessmentMap, reverseMap: assessmentReverseMap } = createAssessmentTypeMaps(lookups);
      assessmentTypeMapRef.current = assessmentMap;
      assessmentTypeToValueRef.current = assessmentReverseMap;
      setLookupOptions(lookups);

      // Step 2: Fetch zones and shifts in parallel
      console.log("Fetching zones and shifts...");
      const [zones, shiftsData] = await Promise.all([
        fetchWithTimeout(triggerGetZones().unwrap(), 30000),
        fetchWithTimeout(triggerGetShifts().unwrap(), 30000),
      ]);

      console.log("Zones fetched:", zones.length);
      console.log("Shifts fetched:", shiftsData.length);
      setAllZones(zones);

      // Step 3: Process zones with areas
      console.log("Processing zones with areas...");
      const zonesWithAreas: Zone[] = await Promise.all(
        zones.map(async (zone: any) => {
          try {
            const areasResponse = await fetchWithTimeout(triggerGetAreas(zone.zoneId).unwrap(), 30000);
            const areasData = areasResponse?.data || areasResponse || [];
            const areas = Array.isArray(areasData)
              ? areasData.map((area: any) => ({
                  id: area.area_Id,
                  name: area.area,
                  assignments: {},
                }))
              : [];

            return {
              id: zone.zoneId.toString(),
              name: i18n.language === "ar" && zone.zoneNameAr ? zone.zoneNameAr : zone.zone,
              zoneCode: zone.zoneCode,
              areas,
            };
          } catch (error) {
            console.error(`Failed to fetch areas for zone ${zone.zoneId}:`, error);
            return {
              id: zone.zoneId.toString(),
              name: i18n.language === "ar" && zone.zoneNameAr ? zone.zoneNameAr : zone.zone,
              zoneCode: zone.zoneCode,
              areas: [],
            };
          }
        }),
      );

      console.log("All zones with areas processed:", zonesWithAreas.length);

      // Create shifts with empty inspectors
      const transformedShifts: Shift[] = shiftsData.map((shift: any) => ({
        id: shift.shiftTypeGUID,
        name: i18n.language === "ar" && shift.shiftTypeNameAr ? shift.shiftTypeNameAr : shift.shiftTypeNameEn,
        code: shift.shiftTypeCode,
        inspectors: [],
        zones: JSON.parse(JSON.stringify(zonesWithAreas)),
      }));

      console.log("Created", transformedShifts.length, "shifts");

      // Step 4: Set shifts FIRST
      setShifts(transformedShifts);

      // Step 5: Process active shifts if data is available
      if (activeShiftsResponse && Object.keys(assessmentTypeMapRef.current).length > 0) {
        console.log("Processing active shifts with assessment map...");
        const activeData = Array.isArray(activeShiftsResponse) ? activeShiftsResponse : activeShiftsResponse.data || [];
        const { inspectorsByShift, unassigned } = processActiveShifts(
          activeData,
          transformedShifts,
          assessmentTypeMapRef.current,
        );

        // Update shifts with inspectors
        setShifts((prev) =>
          prev.map((shift) => ({
            ...shift,
            inspectors: inspectorsByShift[shift.id] || [],
          })),
        );
        setUnassignedInspectors(unassigned);
        activeShiftsProcessedRef.current = true;
        console.log("Active shifts processed successfully");
      }

      setIsInitialLoad(false);
      console.log("Data fetch completed successfully");
    } catch (error) {
      console.error("Error fetching data:", error);
      notification.error(
        t("Fetch failed") || "Fetch failed",
        t("Failed to fetch initial data.") || "Failed to fetch initial data.",
      );
    } finally {
      setIsLoadingData(false);
      isFetchingRef.current = false;
    }
  }, [
    activeShiftsResponse,
    createAssessmentTypeMaps,
    i18n.language,
    notification,
    processActiveShifts,
    triggerGetAreas,
    triggerGetLookups,
    triggerGetShifts,
    triggerGetZones,
    t,
    fetchWithTimeout,
  ]);

  useEffect(() => {
    setPageTitle("Dnd Shift Management");
  });
  // FIX: Load data on initial mount only
  useEffect(() => {
    if (isInitialLoad) {
      console.log("Initial mount - fetching data");
      fetchAllData();
    }
  }, [isInitialLoad, fetchAllData]);

  // FIX: Handle language changes separately to avoid re-fetching all data
  useEffect(() => {
    if (!isInitialLoad && shifts.length > 0) {
      console.log("Language changed - updating existing data");

      // Update shift names based on language
      setShifts((prev) =>
        prev.map((shift) => {
          // In a real app, you would have the original shift data with translations
          // For now, we'll keep the current name
          return shift;
        }),
      );

      // Update zone names based on language
      setShifts((prev) =>
        prev.map((shift) => ({
          ...shift,
          zones: shift.zones.map((zone) => {
            const originalZone = allZones.find((z) => z.zoneId?.toString() === zone.id);
            return {
              ...zone,
              name: i18n.language === "ar" && originalZone?.zoneNameAr ? originalZone.zoneNameAr : zone.name,
            };
          }),
        })),
      );
    }
  }, [i18n.language, isInitialLoad, allZones, shifts.length]);

  // FIX: Process active shifts when response changes AND we have assessment type maps
  useEffect(() => {
    if (
      activeShiftsResponse &&
      !activeShiftsProcessedRef.current &&
      shifts.length > 0 &&
      Object.keys(assessmentTypeMapRef.current).length > 0
    ) {
      console.log("Processing active shifts from useEffect");
      const activeData = Array.isArray(activeShiftsResponse) ? activeShiftsResponse : activeShiftsResponse.data || [];
      const { inspectorsByShift, unassigned } = processActiveShifts(activeData, shifts, assessmentTypeMapRef.current);

      setShifts((prev) =>
        prev.map((shift) => ({
          ...shift,
          inspectors: inspectorsByShift[shift.id] || [],
        })),
      );
      setUnassignedInspectors(unassigned);
      activeShiftsProcessedRef.current = true;
    }
  }, [activeShiftsResponse, shifts, processActiveShifts]);

  // Retry mechanism for failed fetches
  const retryFetchData = useCallback(() => {
    console.log("Retrying data fetch...");
    setIsInitialLoad(true);
    activeShiftsProcessedRef.current = false;
    fetchAllData();
  }, [fetchAllData]);

  // Optimized helper functions with memoization
  const getShiftSelections = useCallback(
    (shiftId: string): string[] => selectedInspectorIdsByShift[shiftId] || [],
    [selectedInspectorIdsByShift],
  );

  const setShiftSelections = useCallback((shiftId: string, ids: string[]) => {
    setSelectedInspectorIdsByShift((prev) => ({
      ...prev,
      [shiftId]: ids,
    }));
  }, []);

  const toggleInspectorSelection = useCallback((shiftId: string, inspectorId: string) => {
    setSelectedInspectorIdsByShift((prev) => {
      const current = prev[shiftId] || [];
      const exists = current.includes(inspectorId);
      return {
        ...prev,
        [shiftId]: exists ? current.filter((id) => id !== inspectorId) : [...current, inspectorId],
      };
    });
  }, []);

  const selectAllInShift = useCallback(
    (shift: Shift, checked: boolean) => {
      setShiftSelections(shift.id, checked ? shift.inspectors.map((i) => i.id) : []);
    },
    [setShiftSelections],
  );

  // Memoized calculations for better performance
  const getMappedZonesCount = useCallback((shift: Shift): number => {
    return shift.zones.filter((zone) => zone.areas.some((area) => area.assignments[shift.id]?.length > 0)).length;
  }, []);

  const isZoneMapped = useCallback((shift: Shift, zoneId: string): boolean => {
    const zone = shift.zones.find((z) => z.id === zoneId);
    return zone?.areas.some((area) => area.assignments[shift.id]?.length > 0) ?? false;
  }, []);

  const getMappedAreasCount = useCallback((shift: Shift, zoneId: string): number => {
    const zone = shift.zones.find((z) => z.id === zoneId);
    return zone?.areas.filter((area) => area.assignments[shift.id]?.length > 0).length ?? 0;
  }, []);

  const getUnmappedInspectorsForShift = useCallback((shift: Shift): ShiftInspector[] => {
    const mappedInspectorIds = new Set<string>();
    shift.zones.forEach((zone) => {
      zone.areas.forEach((area) => {
        (area.assignments[shift.id] || []).forEach((id) => mappedInspectorIds.add(id));
      });
    });
    return shift.inspectors.filter((inspector) => !mappedInspectorIds.has(inspector.id));
  }, []);

  const getAvailableInspectorsForZone = useCallback((): ShiftInspector[] => {
    if (!selectedShift || !selectedZone) return [];

    const mappedInspectorIds = new Set<string>();
    selectedZone.areas.forEach((area) => {
      const inspectorIds = area.assignments[selectedShift.id] || [];
      inspectorIds.forEach((id) => mappedInspectorIds.add(id));
    });

    return selectedShift.inspectors.filter((inspector) => !mappedInspectorIds.has(inspector.id));
  }, [selectedShift, selectedZone]);

  const areAllInspectorsMapped = useCallback((): boolean => {
    for (const shift of shifts) {
      if (shift.inspectors.length === 0) continue;

      for (const inspector of shift.inspectors) {
        const hasZoneAssignment = shift.zones.some((zone) =>
          zone.areas.some((area) => (area.assignments[shift.id] || []).includes(inspector.id)),
        );
        if (!hasZoneAssignment) return false;
      }
    }
    return true;
  }, [shifts]);

  const getGlobalZone = useCallback(
    (zoneId: string): Zone | null => {
      const baseZone = shifts[0]?.zones.find((z) => z.id === zoneId);
      if (!baseZone) return null;

      return {
        ...baseZone,
        areas: baseZone.areas.map((area) => {
          const combinedAssignments: { [shiftId: string]: string[] } = {};
          shifts.forEach((shift) => {
            const shiftArea = shift.zones.find((z) => z.id === zoneId)?.areas.find((a) => a.id === area.id);
            if (shiftArea?.assignments[shift.id]) {
              combinedAssignments[shift.id] = shiftArea.assignments[shift.id];
            }
          });
          return {
            ...area,
            assignments: combinedAssignments,
          };
        }),
      };
    },
    [shifts],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.inspectorId) {
      setDraggedInspectorId(event.active.data.current.inspectorId);
    }
  }, []);

  // Optimized drag end handler
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedInspectorId(null);

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (!activeData || activeData.type !== "inspector" || !overData) return;

      const inspectorId = activeData.inspectorId as string;
      const inspector = inspectorsByIdRef.current[inspectorId];
      if (!inspector) return;
      const from = activeData.from as "unassigned" | "shift" | "area";
      const sourceShiftId = activeData.shiftId as string | undefined;
      const sourceZoneId = activeData.zoneId as string | undefined;
      const sourceAreaId = activeData.areaId as string | undefined;

      if (overData.type === "shift") {
        const targetShiftId = over.id.toString().replace("shift-drop-", "");
        const sourceShiftId = activeData.shiftId;
        const from = activeData.from;

        setShifts((prev) =>
          prev.map((shift) => {
            if (from === "shift" && shift.id === sourceShiftId) {
              return {
                ...shift,
                inspectors: shift.inspectors.filter((i) => i.id !== inspectorId),
              };
            }

            if (shift.id === targetShiftId) {
              if (shift.inspectors.some((i) => i.id === inspectorId)) return shift;
              return {
                ...shift,
                inspectors: [...shift.inspectors, inspector],
              };
            }

            return shift;
          }),
        );

        if (from === "unassigned") {
          setUnassignedInspectors((prev) => prev.filter((i) => i.id !== inspectorId));
        }

        return;
      }

      if (overData.type === "area") {
        const dropId = over.id.toString();
        let targetShiftId: string;
        let targetZoneId: string;
        let targetAreaId: string;

        if (currentView === "global-area-assignment") {
          targetAreaId = dropId.replace("global-area-", "");
          targetShiftId = sourceShiftId!;
          targetZoneId = globalZoneId!;
        } else {
          const parts = dropId.split("-area-");
          targetShiftId = parts[0];
          targetAreaId = parts[1];
          targetZoneId = selectedZone?.id!;
        }

        if (!targetShiftId || !targetZoneId || !targetAreaId) return;

        if (
          from === "area" &&
          sourceShiftId === targetShiftId &&
          sourceZoneId === targetZoneId &&
          sourceAreaId === targetAreaId
        ) {
          return;
        }

        setShifts((prev) => {
          let next = [...prev];

          // Remove from source area if needed
          if (from === "area" && sourceShiftId && sourceZoneId && sourceAreaId) {
            next = next.map((shift) => {
              if (shift.id !== sourceShiftId) return shift;
              return {
                ...shift,
                zones: shift.zones.map((zone) => {
                  if (zone.id !== sourceZoneId) return zone;
                  return {
                    ...zone,
                    areas: zone.areas.map((area) => {
                      if (area.id !== sourceAreaId) return area;
                      return {
                        ...area,
                        assignments: {
                          ...area.assignments,
                          [sourceShiftId]: (area.assignments[sourceShiftId] || []).filter((id) => id !== inspectorId),
                        },
                      };
                    }),
                  };
                }),
              };
            });
          }

          // Add to target area
          next = next.map((shift) => {
            if (shift.id !== targetShiftId) return shift;

            let inspectors = shift.inspectors;
            if (!inspectors.find((i) => i.id === inspectorId)) {
              const foundInspector =
                prev
                  .find((s) => s.inspectors.some((i) => i.id === inspectorId))
                  ?.inspectors.find((i) => i.id === inspectorId) ||
                ({
                  id: inspectorId,
                  name: activeData.inspector.name,
                  weeklyOffs: [],
                  assessmentTypes: [],
                  employeeId: activeData.inspector.employeeId,
                  uswMcode: activeData.inspector.uswMcode,
                  roleGUID: activeData.inspector.roleGUID,
                  isActive: activeData.inspector.isActive,
                } as ShiftInspector);
              inspectors = [...inspectors, foundInspector];
            }

            return {
              ...shift,
              inspectors,
              zones: shift.zones.map((zone) => {
                if (zone.id !== targetZoneId) return zone;
                return {
                  ...zone,
                  areas: zone.areas.map((area) => {
                    if (area.id !== targetAreaId) return area;
                    const current = area.assignments[targetShiftId] || [];
                    if (current.includes(inspectorId)) return area;
                    return {
                      ...area,
                      assignments: {
                        ...area.assignments,
                        [targetShiftId]: [...current, inspectorId],
                      },
                    };
                  }),
                };
              }),
            };
          });

          return next;
        });

        if (selectedShift && selectedZone) {
          setShifts((currentShifts) => {
            const updatedShift = currentShifts.find((s) => s.id === targetShiftId);
            if (updatedShift) {
              setSelectedShift(updatedShift);
              const updatedZone = updatedShift.zones.find((z) => z.id === targetZoneId);
              if (updatedZone) setSelectedZone(updatedZone);
            }
            return currentShifts;
          });
        }
      }
    },
    [currentView, globalZoneId, selectedZone],
  );

  // Optimized modal handlers
  const openWeeklyOffModal = useCallback((shiftId: string, inspector: ShiftInspector) => {
    setSelectedWeeklyOffs(inspector.weeklyOffs || []);
    setWeeklyOffModal({
      visible: true,
      inspector: inspector,
      shiftId: shiftId,
    });
  }, []);

  const confirmWeeklyOff = useCallback(() => {
    if (!weeklyOffModal.inspector || !weeklyOffModal.shiftId) return;

    setShifts((prev) =>
      prev.map((shift) =>
        shift.id === weeklyOffModal.shiftId
          ? {
              ...shift,
              inspectors: shift.inspectors.map((insp) =>
                insp.id === weeklyOffModal.inspector?.id
                  ? {
                      ...insp,
                      weeklyOffs: selectedWeeklyOffs,
                      assessmentTypes: weeklyOffModal.inspector?.assessmentTypes || [],
                    }
                  : insp,
              ),
            }
          : shift,
      ),
    );

    if (selectedShift?.id === weeklyOffModal.shiftId) {
      setSelectedShift((prev) =>
        prev
          ? {
              ...prev,
              inspectors: prev.inspectors.map((insp) =>
                insp.id === weeklyOffModal.inspector?.id
                  ? {
                      ...insp,
                      weeklyOffs: selectedWeeklyOffs,
                      assessmentTypes: weeklyOffModal.inspector?.assessmentTypes || [],
                    }
                  : insp,
              ),
            }
          : prev,
      );
    }

    setWeeklyOffModal({ visible: false, inspector: null, shiftId: null });
    setSelectedWeeklyOffs([]);
  }, [weeklyOffModal, selectedShift, selectedWeeklyOffs]);

  const handleWeeklyOffChange = useCallback((day: string, checked: boolean) => {
    setSelectedWeeklyOffs((prev) => (checked ? [...prev, day] : prev.filter((d) => d !== day)));
  }, []);

  const updateInspectorAssessmentTypes = useCallback(
    (shiftId: string, inspectorId: string, types: AssessmentType[]) => {
      setShifts((prev) =>
        prev.map((shift) =>
          shift.id === shiftId
            ? {
                ...shift,
                inspectors: shift.inspectors.map((insp) =>
                  insp.id === inspectorId ? { ...insp, assessmentTypes: types } : insp,
                ),
              }
            : shift,
        ),
      );

      if (selectedShift?.id === shiftId) {
        setSelectedShift((prev) =>
          prev
            ? {
                ...prev,
                inspectors: prev.inspectors.map((insp) =>
                  insp.id === inspectorId ? { ...insp, assessmentTypes: types } : insp,
                ),
              }
            : prev,
        );
      }

      if (weeklyOffModal.inspector?.id === inspectorId && weeklyOffModal.shiftId === shiftId) {
        setWeeklyOffModal((prev) =>
          prev.inspector
            ? {
                ...prev,
                inspector: { ...prev.inspector, assessmentTypes: types },
              }
            : prev,
        );
      }
    },
    [selectedShift, weeklyOffModal],
  );

  const removeAssessmentTypeFromInspector = useCallback(
    (shiftId: string, inspectorId: string, typeToRemove: AssessmentType) => {
      const shift = shifts.find((s) => s.id === shiftId);
      const inspector = shift?.inspectors.find((i) => i.id === inspectorId);
      if (!inspector) return;

      const updatedTypes = (inspector.assessmentTypes || []).filter((t) => t !== typeToRemove);
      updateInspectorAssessmentTypes(shiftId, inspectorId, updatedTypes);
      message.success(`Removed ${typeToRemove} from ${inspector.name}`);
    },
    [shifts, updateInspectorAssessmentTypes],
  );

  const removeInspectorFromShift = useCallback(
    (shiftId: string, inspectorId: string) => {
      const shift = shifts.find((s) => s.id === shiftId);
      const removedInspector = shift?.inspectors.find((i) => i.id === inspectorId);

      setShifts((prev) =>
        prev.map((s) =>
          s.id === shiftId
            ? {
                ...s,
                inspectors: s.inspectors.filter((i) => i.id !== inspectorId),
                zones: s.zones.map((zone) => ({
                  ...zone,
                  areas: zone.areas.map((area) => ({
                    ...area,
                    assignments: {
                      ...area.assignments,
                      [shiftId]: (area.assignments[shiftId] || []).filter((id) => id !== inspectorId),
                    },
                  })),
                })),
              }
            : s,
        ),
      );

      if (removedInspector) {
        setUnassignedInspectors((prev) => [...prev, { id: removedInspector.id, name: removedInspector.name }]);
      }

      setShiftSelections(
        shiftId,
        getShiftSelections(shiftId).filter((id) => id !== inspectorId),
      );
    },
    [shifts, getShiftSelections, setShiftSelections],
  );

  const removeInspectorFromArea = useCallback(
    (areaId: string, inspectorId: string, shiftId: string) => {
      const zoneId = currentView === "global-area-assignment" ? globalZoneId : selectedZone?.id;
      if (!zoneId) return;

      setShifts((prev) =>
        prev.map((shift) => {
          if (shift.id !== shiftId) return shift;
          return {
            ...shift,
            zones: shift.zones.map((zone) => {
              if (zone.id !== zoneId) return zone;
              return {
                ...zone,
                areas: zone.areas.map((area) => {
                  if (area.id !== areaId) return area;
                  return {
                    ...area,
                    assignments: {
                      ...area.assignments,
                      [shiftId]: (area.assignments[shiftId] || []).filter((id) => id !== inspectorId),
                    },
                  };
                }),
              };
            }),
          };
        }),
      );

      if (currentView === "area-assignment" && selectedShift?.id === shiftId && selectedZone) {
        setShifts((currentShifts) => {
          const updatedShift = currentShifts.find((s) => s.id === shiftId);
          if (updatedShift) {
            setSelectedShift(updatedShift);
            const updatedZone = updatedShift.zones.find((z) => z.id === zoneId);
            if (updatedZone) setSelectedZone(updatedZone);
          }
          return currentShifts;
        });
      }
    },
    [currentView, globalZoneId, selectedShift, selectedZone],
  );

  const openShiftSettings = useCallback((shift: Shift) => {
    setSelectedShift(shift);
    setCurrentView("zones");
  }, []);

  const openZoneSettings = useCallback(
    (zone: Zone) => {
      if (!selectedShift) return;
      const currentZone = selectedShift.zones.find((z) => z.id === zone.id);
      setSelectedZone(currentZone || zone);
      setCurrentView("area-assignment");
    },
    [selectedShift],
  );

  const openGlobalZones = useCallback(() => {
    setCurrentView("global-zones");
  }, []);

  const openGlobalZoneSettings = useCallback((zoneId: string) => {
    setGlobalZoneId(zoneId);
    setCurrentView("global-area-assignment");
  }, []);

  const handleShiftDateRangeChange = useCallback(
    (shiftId: string, dates: [Dayjs, Dayjs] | null) => {
      setShifts((prev) =>
        prev.map((shift) => (shift.id === shiftId ? { ...shift, dateRange: dates || undefined } : shift)),
      );

      if (selectedShift?.id === shiftId) {
        setSelectedShift((prev) => (prev ? { ...prev, dateRange: dates || undefined } : prev));
      }
    },
    [selectedShift],
  );

  const openBulkModal = useCallback(
    (shiftId: string) => {
      const selectedIds = getShiftSelections(shiftId);
      if (selectedIds.length === 0) {
        message.warning("Select at least one inspector in this shift first.");
        return;
      }
      setSelectedWeeklyOffs([]);
      setBulkAssessmentTypes([]);
      setBulkModal({ visible: true, shiftId });
    },
    [getShiftSelections],
  );

  const confirmBulk = useCallback(() => {
    if (!bulkModal.shiftId) return;
    const shiftId = bulkModal.shiftId;
    const selectedIds = getShiftSelections(shiftId);
    if (selectedIds.length === 0) {
      setBulkModal({ visible: false, shiftId: null });
      return;
    }

    setShifts((prev) =>
      prev.map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              inspectors: shift.inspectors.map((insp) =>
                selectedIds.includes(insp.id)
                  ? {
                      ...insp,
                      weeklyOffs: selectedWeeklyOffs.length > 0 ? selectedWeeklyOffs : insp.weeklyOffs,
                      assessmentTypes:
                        bulkAssessmentTypes.length > 0 ? bulkAssessmentTypes : insp.assessmentTypes || [],
                    }
                  : insp,
              ),
            }
          : shift,
      ),
    );

    if (selectedShift?.id === shiftId) {
      setSelectedShift((prev) =>
        prev
          ? {
              ...prev,
              inspectors: prev.inspectors.map((insp) =>
                selectedIds.includes(insp.id)
                  ? {
                      ...insp,
                      weeklyOffs: selectedWeeklyOffs.length > 0 ? selectedWeeklyOffs : insp.weeklyOffs,
                      assessmentTypes:
                        bulkAssessmentTypes.length > 0 ? bulkAssessmentTypes : insp.assessmentTypes || [],
                    }
                  : insp,
              ),
            }
          : prev,
      );
    }

    setBulkModal({ visible: false, shiftId: null });
    setSelectedWeeklyOffs([]);
    setBulkAssessmentTypes([]);
  }, [bulkModal, getShiftSelections, selectedShift, selectedWeeklyOffs, bulkAssessmentTypes]);

  const openCopyModal = useCallback((shiftId: string, zoneId: string, sourceAreaId: string, inspectorId: string) => {
    setCopyModal({
      visible: true,
      shiftId,
      zoneId,
      inspectorId,
      sourceAreaId,
      targetAreaIds: [],
    });
  }, []);

  const toggleCopyAreaSelection = useCallback((areaId: string) => {
    setCopyModal((prev) => ({
      ...prev,
      targetAreaIds: prev.targetAreaIds.includes(areaId)
        ? prev.targetAreaIds.filter((id) => id !== areaId)
        : [...prev.targetAreaIds, areaId],
    }));
  }, []);

  const getAvailableAreasForCopy = useCallback((): Area[] => {
    if (!copyModal.visible || !copyModal.shiftId) return [];

    const zone = currentView === "global-area-assignment" ? getGlobalZone(copyModal.zoneId!) : selectedZone;

    if (!zone) return [];

    return zone.areas.filter((area) => {
      const inspectorIds = area.assignments[copyModal.shiftId!] || [];
      return !inspectorIds.includes(copyModal.inspectorId!);
    });
  }, [copyModal, currentView, getGlobalZone, selectedZone]);

  const confirmCopy = useCallback(() => {
    if (!copyModal.shiftId || !copyModal.zoneId || !copyModal.inspectorId) {
      setCopyModal({
        visible: false,
        shiftId: null,
        zoneId: null,
        inspectorId: null,
        sourceAreaId: null,
        targetAreaIds: [],
      });
      return;
    }

    const { shiftId, zoneId, inspectorId, targetAreaIds } = copyModal;
    if (targetAreaIds.length === 0) {
      message.warning("Please select at least one target area to copy to.");
      return;
    }

    setShifts((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;
        return {
          ...shift,
          zones: shift.zones.map((zone) => {
            if (zone.id !== zoneId) return zone;
            return {
              ...zone,
              areas: zone.areas.map((area) => {
                if (!targetAreaIds.includes(area.id)) return area;
                const current = area.assignments[shiftId] || [];
                if (current.includes(inspectorId)) return area;
                return {
                  ...area,
                  assignments: {
                    ...area.assignments,
                    [shiftId]: [...current, inspectorId],
                  },
                };
              }),
            };
          }),
        };
      }),
    );

    if (currentView === "area-assignment" && selectedShift?.id === shiftId && selectedZone?.id === zoneId) {
      setShifts((currentShifts) => {
        const updatedShift = currentShifts.find((s) => s.id === shiftId);
        if (updatedShift) {
          setSelectedShift(updatedShift);
          const updatedZone = updatedShift.zones.find((z) => z.id === zoneId);
          if (updatedZone) setSelectedZone(updatedZone);
        }
        return currentShifts;
      });
    }

    message.success(`Inspector copied to ${targetAreaIds.length} area${targetAreaIds.length > 1 ? "s" : ""}`);

    setCopyModal({
      visible: false,
      shiftId: null,
      zoneId: null,
      inspectorId: null,
      sourceAreaId: null,
      targetAreaIds: [],
    });
  }, [copyModal, currentView, selectedShift, selectedZone]);

  const saveAreaAssignments = useCallback(() => {
    message.success("Area assignments saved successfully!");
    setCurrentView(currentView === "global-area-assignment" ? "global-zones" : "zones");
    if (currentView !== "global-area-assignment") {
      setSelectedZone(null);
    } else {
      setGlobalZoneId(null);
    }
  }, [currentView]);

  // Optimized publish function
  const handlePublish = useCallback(async () => {
    // Check if there are unmapped inspectors
    const hasUnmappedInspectors = !areAllInspectorsMapped();

    if (hasUnmappedInspectors) {
      const unmappedDetails: string[] = [];
      shifts.forEach((shift) => {
        const unmappedInspectors = getUnmappedInspectorsForShift(shift);
        if (unmappedInspectors.length > 0) {
          unmappedDetails.push(`${shift.name}: ${unmappedInspectors.map((i) => i.name).join(", ")}`);
        }
      });

      Modal.confirm({
        title: "Unmapped Inspectors Warning",
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <Paragraph>
              Some inspectors are not mapped to any zone. You can still publish, but these inspectors won't be assigned
              to zones.
            </Paragraph>
            <Paragraph>The following inspectors are not mapped:</Paragraph>
            <ul style={{ marginTop: "16px", paddingLeft: "20px", maxHeight: "200px", overflowY: "auto" }}>
              {unmappedDetails.map((detail, index) => (
                <li key={index} style={{ marginBottom: "8px" }}>
                  <Text>{detail}</Text>
                </li>
              ))}
            </ul>
            <Paragraph strong style={{ marginTop: "16px" }}>
              Do you want to proceed with publishing?
            </Paragraph>
          </div>
        ),
        okText: "Publish Anyway",
        cancelText: "Cancel",
        okButtonProps: {
          style: {
            background: redPalette.primaryRed,
            borderColor: redPalette.primaryRed,
          },
        },
        width: 600,
        onOk: async () => {
          await performPublish();
        },
      });
    } else {
      await performPublish();
    }
  }, [areAllInspectorsMapped, shifts, getUnmappedInspectorsForShift]);

  const performPublish = useCallback(async () => {
    const updates: Promise<any>[] = [];

    shifts.forEach((shift) => {
      shift.inspectors.forEach((inspector) => {
        const assignedZoneIds = shift.zones
          .filter((zone) => zone.areas.some((area) => (area.assignments[shift.id] || []).includes(inspector.id)))
          .map((zone) => zone.id);

        const assignmentTypes = (inspector.assessmentTypes || [])
          .map((type) => assessmentTypeToValueRef.current[type])
          .filter((val) => val !== undefined);

        const weekOffsString = (inspector.weeklyOffs || []).join(",");

        const updateData = {
          employeeId: inspector.employeeId,
          shiftId: shift.id,
          wO_Days: weekOffsString,
          role: "Inspector",
          assignmentTypes,
          zoneIds: assignedZoneIds,
        };

        console.log("Sending update:", updateData);

        updates.push(updateShiftManagement(updateData).unwrap());
      });
    });

    try {
      await Promise.all(updates);

      notification.success(
        t("Publish successful") || "Publish successful",
        t("Shift plan has been published successfully.") || "Shift plan has been published successfully.",
      );

      refetchActiveShifts();

      const output = shifts.map((shift) => ({
        shift: shift.name,
        dateRange: shift.dateRange
          ? [shift.dateRange[0].format("YYYY-MM-DD"), shift.dateRange[1].format("YYYY-MM-DD")]
          : null,
        inspectors: shift.inspectors.map((i) => ({
          name: i.name,
          employeeId: i.employeeId,
          weeklyOffs: i.weeklyOffs || [],
          assessmentTypes: i.assessmentTypes || [],
        })),
        zoneAssignments: shift.zones
          .map((zone) => ({
            zone: zone.name,
            areas: zone.areas
              .filter((area) => area.assignments[shift.id]?.length > 0)
              .map((area) => ({
                area: area.name,
                assignedTo: (area.assignments[shift.id] || [])
                  .map((id) => shift.inspectors.find((i) => i.id === id)?.name)
                  .filter(Boolean),
              })),
          }))
          .filter((z) => z.areas.length > 0),
      }));

      console.log("Published Shift Plan:", JSON.stringify(output, null, 2));
      Modal.success({
        title: "Plan Published Successfully",
        content: "Your shift plan has been published. Check the console for details.",
        okButtonProps: {
          style: {
            background: redPalette.primaryRed,
            borderColor: redPalette.primaryRed,
          },
        },
      });
    } catch (error) {
      console.error("Publish error:", error);
      notification.error(
        t("Publish failed") || "Publish failed",
        t("Failed to publish shift plan. Please try again.") || "Failed to publish shift plan. Please try again.",
      );
    }
  }, [shifts, updateShiftManagement, notification, t, refetchActiveShifts]);

  const currentGlobalZone = useMemo(
    () => (globalZoneId ? getGlobalZone(globalZoneId) : null),
    [globalZoneId, getGlobalZone],
  );

  const availableInspectors = useMemo(() => getAvailableInspectorsForZone(), [getAvailableInspectorsForZone]);

  // Memoized render functions
  const renderInspectorCard = useCallback(
    (inspector: ShiftInspector, shiftId: string, shiftName: string, areaId?: string, zoneId?: string) => (
      <div
        key={`${shiftId}-${inspector.id}-${areaId || "shift"}`}
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <div style={{ flex: 1 }}>
          <DraggableInspector
            inspector={inspector}
            id={inspector.id}
            contextData={{
              from: areaId ? "area" : "shift",
              shiftId,
              zoneId,
              areaId,
            }}
            showAssessmentTags={currentView === "inspector-shift"}
            showWeeklyOffTag={true}
            onRemoveAssessmentType={(type) => removeAssessmentTypeFromInspector(shiftId, inspector.id, type)}
            shiftName={
              currentView === "global-area-assignment" || (currentView === "area-assignment" && areaId)
                ? shiftName
                : undefined
            }
            shiftColor={
              currentView === "global-area-assignment" || (currentView === "area-assignment" && areaId)
                ? shiftColors[shiftId] || redPalette.infoBlue
                : undefined
            }
          />
        </div>
        <Space>
          {areaId && (
            <>
              <Tooltip title="Copy to other areas">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => openCopyModal(shiftId, zoneId!, areaId, inspector.id)}
                  style={{ color: redPalette.infoBlue }}
                />
              </Tooltip>
              <Tooltip title="Remove from area">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => removeInspectorFromArea(areaId, inspector.id, shiftId)}
                />
              </Tooltip>
            </>
          )}
          {!areaId && currentView === "inspector-shift" && (
            <>
              <Tooltip title="Configure Weekly Offs & Assessment">
                <Button
                  type="text"
                  size="small"
                  icon={<CalendarOutlined />}
                  onClick={() => openWeeklyOffModal(shiftId, inspector)}
                  style={{ color: redPalette.infoBlue }}
                />
              </Tooltip>
              <Tooltip title="Remove from Shift">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => removeInspectorFromShift(shiftId, inspector.id)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      </div>
    ),
    [
      currentView,
      openCopyModal,
      openWeeklyOffModal,
      removeAssessmentTypeFromInspector,
      removeInspectorFromArea,
      removeInspectorFromShift,
    ],
  );

  // Memoized render content for each view
  const renderInspectorShiftView = useMemo(
    () => (
      <>
        <Row gutter={32}>
          <Col xs={24} sm={24} md={6}>
            <Card
              title="Available Inspectors"
              style={{
                background: redPalette.bgContainer,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                height: "100%",
              }}
              headStyle={{
                background: redPalette.primaryRed,
                color: "white",
                borderRadius: "8px 8px 0 0",
              }}
              bodyStyle={{ padding: 16 }}
            >
              {unassignedInspectors.length > 0 ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {unassignedInspectors.map((inspector) => (
                    <DraggableInspector
                      key={inspector.id}
                      inspector={
                        {
                          ...inspector,
                          weeklyOffs: inspector.weeklyOffs || [],
                          assessmentTypes: [],
                          employeeId: inspector.id,
                          uswMcode: inspector.id,
                          roleGUID: "",
                          isActive: true,
                        } as ShiftInspector
                      }
                      id={`unassigned-${inspector.id}`}
                      contextData={{ from: "unassigned" }}
                    />
                  ))}
                </Space>
              ) : (
                <Empty description="All inspectors assigned" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>

          <Col xs={24} sm={24} md={18}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                Shift Configuration
              </Title>
              <Space>
                <Button
                  type="primary"
                  icon={<ApartmentOutlined />}
                  onClick={openGlobalZones}
                  style={{
                    background: redPalette.infoBlue,
                    borderColor: redPalette.infoBlue,
                  }}
                >
                  Global Zone Configuration
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handlePublish}
                  style={{
                    background: redPalette.primaryRed,
                    borderColor: redPalette.primaryRed,
                  }}
                  loading={isUpdating}
                >
                  Publish Plan
                </Button>
              </Space>
            </div>

            <Row gutter={[16, 16]}>
              {shifts.map((shift) => (
                <Col xs={24} sm={24} md={12} key={shift.id}>
                  <Card
                    style={{
                      background: redPalette.bgContainer,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      borderTop: `4px solid ${redPalette.primaryRed}`,
                    }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <Title level={5} style={{ margin: 0 }}>
                        {shift.name}
                      </Title>
                      <Space>
                        <Tooltip title="Configure Zones">
                          <Button
                            type="text"
                            icon={<SettingOutlined />}
                            onClick={() => openShiftSettings(shift)}
                            style={{ color: redPalette.infoBlue }}
                          />
                        </Tooltip>
                        <Tooltip title="Bulk Edit Selected">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => openBulkModal(shift.id)}
                            style={{ color: redPalette.warningOrange }}
                          />
                        </Tooltip>
                      </Space>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Space>
                        <Text strong>Inspectors</Text>
                        <Text>{shift.inspectors.length}</Text>
                      </Space>
                      <Space>
                        <Checkbox
                          checked={
                            shift.inspectors.length > 0 &&
                            getShiftSelections(shift.id).length === shift.inspectors.length
                          }
                          indeterminate={
                            getShiftSelections(shift.id).length > 0 &&
                            getShiftSelections(shift.id).length < shift.inspectors.length
                          }
                          onChange={(e) => selectAllInShift(shift, e.target.checked)}
                        >
                          Select All
                        </Checkbox>
                        <Tag color={getMappedZonesCount(shift) === shift.zones.length ? "success" : "warning"}>
                          {getMappedZonesCount(shift)}/{shift.zones.length} Zones
                        </Tag>
                      </Space>
                    </div>

                    <DroppableShift id={`shift-drop-${shift.id}`}>
                      {shift.inspectors.length > 0 ? (
                        <Space direction="vertical" style={{ width: "100%" }} size="small">
                          {shift.inspectors.map((inspector) => (
                            <div
                              key={inspector.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Checkbox
                                checked={getShiftSelections(shift.id).includes(inspector.id)}
                                onChange={() => toggleInspectorSelection(shift.id, inspector.id)}
                              />
                              {renderInspectorCard(inspector, shift.id, shift.name)}
                            </div>
                          ))}
                        </Space>
                      ) : (
                        <Empty description="Drag inspectors here" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </DroppableShift>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </>
    ),
    [
      shifts,
      unassignedInspectors,
      getShiftSelections,
      getMappedZonesCount,
      openShiftSettings,
      openBulkModal,
      selectAllInShift,
      toggleInspectorSelection,
      renderInspectorCard,
      openGlobalZones,
      handlePublish,
      isUpdating,
    ],
  );

  const renderZonesView = useMemo(
    () =>
      selectedShift && (
        <div>
          <Title level={4} style={{ marginBottom: 24 }}>
            {selectedShift.name} - Zone Configuration
          </Title>
          <Row gutter={[16, 16]}>
            {selectedShift.zones.map((zone) => (
              <Col xs={24} sm={12} md={8} lg={6} key={zone.id} style={{ display: "flex" }}>
                <Card
                  hoverable
                  onClick={() => openZoneSettings(zone)}
                  style={{
                    flex: 1,
                    background: redPalette.bgContainer,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    borderTop: `4px solid ${
                      isZoneMapped(selectedShift, zone.id) ? redPalette.successGreen : redPalette.borderLight
                    }`,
                    display: "flex",
                    flexDirection: "column",
                  }}
                  bodyStyle={{ padding: 20, flex: 1 }}
                >
                  <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Text strong style={{ fontSize: 16 }}>
                        {zone.name}
                      </Text>
                      <Space>
                        <Tooltip title="Configure Areas">
                          <Button
                            type="text"
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openZoneSettings(zone);
                            }}
                            style={{ color: redPalette.infoBlue }}
                          />
                        </Tooltip>
                      </Space>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                        Areas ({zone.areas.length})
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          marginTop: 8,
                        }}
                      >
                        {zone.areas.length > 0 ? (
                          zone.areas.slice(0, 5).map((area) => (
                            <Tag
                              key={area.id}
                              color={area.assignments[selectedShift.id]?.length > 0 ? "success" : "default"}
                              style={{ margin: 0, fontSize: 11 }}
                            >
                              {area.name}
                            </Tag>
                          ))
                        ) : (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            No areas available
                          </Text>
                        )}
                        {zone.areas.length > 5 && (
                          <Tag style={{ margin: 0, fontSize: 11 }}>+{zone.areas.length - 5} more</Tag>
                        )}
                      </div>
                    </div>
                    <div>
                      <Tag
                        color={
                          getMappedAreasCount(selectedShift, zone.id) === zone.areas.length
                            ? "success"
                            : getMappedAreasCount(selectedShift, zone.id) > 0
                              ? "warning"
                              : "default"
                        }
                        style={{
                          width: "100%",
                          textAlign: "center",
                          marginTop: "auto",
                        }}
                      >
                        {getMappedAreasCount(selectedShift, zone.id)}/{zone.areas.length} Assigned
                      </Tag>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ),
    [selectedShift, isZoneMapped, getMappedAreasCount, openZoneSettings],
  );

  const renderAreaAssignmentView = useMemo(
    () =>
      selectedShift &&
      selectedZone && (
        <div>
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {selectedShift.name} - {selectedZone.name}
              </Title>
              <Text type="secondary">Assign inspectors to areas</Text>
            </div>
            <Space>
              <RangePicker
                value={selectedShift.dateRange}
                onChange={(dates) => handleShiftDateRangeChange(selectedShift.id, (dates as [Dayjs, Dayjs]) || null)}
                placeholder={["Start Date", "End Date"]}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={saveAreaAssignments}
                style={{
                  background: redPalette.successGreen,
                  borderColor: redPalette.successGreen,
                }}
              >
                Save Assignments
              </Button>
            </Space>
          </div>

          <Row gutter={32}>
            <Col xs={24} md={6}>
              <Card
                title={`Available Inspectors - ${selectedShift.name}`}
                style={{
                  background: redPalette.bgContainer,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  position: "sticky",
                  top: 24,
                }}
                headStyle={{
                  background: redPalette.infoBlue,
                  color: "white",
                }}
                bodyStyle={{
                  padding: 16,
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                {availableInspectors.length > 0 ? (
                  <Space direction="vertical" style={{ width: "100%" }} size="small">
                    {availableInspectors.map((inspector) => (
                      <DraggableInspector
                        key={inspector.id}
                        inspector={inspector}
                        id={`area-sidebar-${selectedShift.id}-${inspector.id}`}
                        contextData={{
                          from: "shift",
                          shiftId: selectedShift.id,
                        }}
                        showWeeklyOffTag={true}
                      />
                    ))}
                  </Space>
                ) : (
                  <Empty description="All inspectors assigned to areas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>

            <Col xs={24} md={18}>
              <Row gutter={[16, 16]}>
                {selectedZone.areas.map((area) => {
                  const assignedInspectorIds = area.assignments[selectedShift.id] || [];
                  const assignedInspectors = assignedInspectorIds
                    .map((id) => selectedShift.inspectors.find((i) => i.id === id))
                    .filter(Boolean) as ShiftInspector[];

                  return (
                    <Col xs={24} sm={12} md={12} lg={8} key={area.id}>
                      <Card
                        title={area.name}
                        style={{
                          background: redPalette.bgContainer,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          borderTop: `4px solid ${
                            assignedInspectors.length > 0 ? redPalette.successGreen : redPalette.borderLight
                          }`,
                        }}
                        headStyle={{
                          background: redPalette.bgLayout,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                        bodyStyle={{ padding: 12 }}
                      >
                        <DroppableArea
                          id={`${selectedShift.id}-area-${area.id}`}
                          hasAssignment={assignedInspectors.length > 0}
                        >
                          {assignedInspectors.length > 0 ? (
                            <Space direction="vertical" style={{ width: "100%" }} size="small">
                              {assignedInspectors.map((inspector) =>
                                renderInspectorCard(
                                  inspector,
                                  selectedShift.id,
                                  selectedShift.name,
                                  area.id,
                                  selectedZone.id,
                                ),
                              )}
                            </Space>
                          ) : (
                            <Empty description="Drag inspectors here" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          )}
                        </DroppableArea>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Col>
          </Row>
        </div>
      ),
    [
      selectedShift,
      selectedZone,
      availableInspectors,
      handleShiftDateRangeChange,
      saveAreaAssignments,
      renderInspectorCard,
    ],
  );

  const renderGlobalZonesView = useMemo(
    () => (
      <div>
        <Title level={4} style={{ marginBottom: 24 }}>
          Global Zone Configuration - Map All Shifts at Once
        </Title>
        <Row gutter={[16, 16]}>
          {shifts[0]?.zones.map((zone) => {
            let totalAssignments = 0;
            const areaAssignmentCounts: Record<string, number> = {};

            shifts.forEach((shift) => {
              const shiftZone = shift.zones.find((z) => z.id === zone.id);
              shiftZone?.areas.forEach((area) => {
                const count = area.assignments[shift.id]?.length || 0;
                totalAssignments += count;
                areaAssignmentCounts[area.id] = (areaAssignmentCounts[area.id] || 0) + count;
              });
            });

            const assignedAreasCount = Object.values(areaAssignmentCounts).filter((count) => count > 0).length;

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={zone.id} style={{ display: "flex" }}>
                <Card
                  hoverable
                  onClick={() => openGlobalZoneSettings(zone.id)}
                  style={{
                    flex: 1,
                    background: redPalette.bgContainer,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    borderTop: `4px solid ${totalAssignments > 0 ? redPalette.successGreen : redPalette.borderLight}`,
                    display: "flex",
                    flexDirection: "column",
                  }}
                  bodyStyle={{ padding: 20, flex: 1 }}
                >
                  <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Text strong style={{ fontSize: 16 }}>
                        {zone.name}
                      </Text>
                      <Space>
                        <Tooltip title="Configure Areas">
                          <Button
                            type="text"
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openGlobalZoneSettings(zone.id);
                            }}
                            style={{ color: redPalette.infoBlue }}
                          />
                        </Tooltip>
                      </Space>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                        Areas ({zone.areas.length})
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          marginTop: 8,
                        }}
                      >
                        {zone.areas.length > 0 ? (
                          zone.areas.slice(0, 5).map((area) => {
                            const areaCount = areaAssignmentCounts[area.id] || 0;
                            return (
                              <Tag
                                key={area.id}
                                color={areaCount > 0 ? "success" : "default"}
                                style={{ margin: 0, fontSize: 11 }}
                              >
                                {area.name}
                              </Tag>
                            );
                          })
                        ) : (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            No areas available
                          </Text>
                        )}
                        {zone.areas.length > 5 && (
                          <Tag style={{ margin: 0, fontSize: 11 }}>+{zone.areas.length - 5} more</Tag>
                        )}
                      </div>
                    </div>
                    <Space direction="vertical" size="small" style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary">Assigned Areas</Text>
                        <Text
                          strong
                          style={{
                            color: assignedAreasCount === zone.areas.length ? redPalette.successGreen : undefined,
                          }}
                        >
                          {assignedAreasCount}/{zone.areas.length}
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary">Total Inspectors</Text>
                        <Text
                          strong
                          style={{
                            color: totalAssignments > 0 ? redPalette.infoBlue : undefined,
                          }}
                        >
                          {totalAssignments}
                        </Text>
                      </div>
                    </Space>
                    <Tag
                      color={
                        assignedAreasCount === zone.areas.length && totalAssignments > 0
                          ? "success"
                          : totalAssignments > 0
                            ? "warning"
                            : "default"
                      }
                      style={{
                        width: "100%",
                        textAlign: "center",
                        marginTop: "auto",
                      }}
                    >
                      {assignedAreasCount === zone.areas.length && totalAssignments > 0
                        ? "Fully Mapped"
                        : totalAssignments > 0
                          ? "Partially Mapped"
                          : "Not Mapped"}
                    </Tag>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    ),
    [shifts, openGlobalZoneSettings],
  );

  const renderGlobalAreaAssignmentView = useMemo(
    () =>
      globalZoneId &&
      currentGlobalZone && (
        <div>
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Global Configuration - {currentGlobalZone.name}
              </Title>
              <Text type="secondary">Assign inspectors from all shifts to areas</Text>
            </div>
            <Space>
              <RangePicker
                value={globalDateRange}
                onChange={(dates) => setGlobalDateRange((dates as [Dayjs, Dayjs]) || undefined)}
                placeholder={["Start Date", "End Date"]}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={saveAreaAssignments}
                style={{
                  background: redPalette.successGreen,
                  borderColor: redPalette.successGreen,
                }}
              >
                Save Assignments
              </Button>
            </Space>
          </div>

          <Row gutter={32}>
            <Col xs={24} md={6}>
              <Card
                title="All Inspectors"
                style={{
                  background: redPalette.bgContainer,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  position: "sticky",
                  top: 24,
                }}
                headStyle={{
                  background: redPalette.infoBlue,
                  color: "white",
                }}
                bodyStyle={{
                  padding: 16,
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                <Collapse
                  bordered={false}
                  defaultActiveKey={shifts.map((s) => s.id)}
                  style={{ background: "transparent" }}
                >
                  {shifts.map((shift) => {
                    const mappedIds = new Set<string>();
                    if (currentGlobalZone) {
                      currentGlobalZone.areas.forEach((area) => {
                        (area.assignments[shift.id] || []).forEach((id) => mappedIds.add(id));
                      });
                    }

                    const availableShiftInspectors = shift.inspectors.filter((insp) => !mappedIds.has(insp.id));

                    return (
                      <Panel
                        header={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Space>
                              <ClockCircleOutlined
                                style={{
                                  color: shiftColors[shift.code] || redPalette.infoBlue,
                                }}
                              />
                              <Text strong>{shift.name}</Text>
                            </Space>
                            <Space>
                              <Tag color={shiftColors[shift.code] || redPalette.infoBlue}>
                                {availableShiftInspectors.length}
                              </Tag>
                            </Space>
                          </div>
                        }
                        key={shift.id}
                      >
                        {availableShiftInspectors.length > 0 ? (
                          <Space direction="vertical" style={{ width: "100%" }} size="small">
                            {availableShiftInspectors.map((inspector) => (
                              <DraggableInspector
                                key={inspector.id}
                                inspector={inspector}
                                id={`global-${shift.id}-${inspector.id}`}
                                contextData={{
                                  from: "shift",
                                  shiftId: shift.id,
                                }}
                                shiftName={shift.name}
                                shiftColor={shiftColors[shift.code] || redPalette.infoBlue}
                                showWeeklyOffTag={true}
                              />
                            ))}
                          </Space>
                        ) : (
                          <Empty
                            description="All inspectors assigned in this zone"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        )}
                      </Panel>
                    );
                  })}
                </Collapse>
              </Card>
            </Col>

            <Col xs={24} md={18}>
              <Row gutter={[16, 16]}>
                {currentGlobalZone.areas.map((area) => {
                  const allAssignedInspectors: {
                    inspector: ShiftInspector;
                    shiftId: string;
                    shiftName: string;
                  }[] = [];

                  shifts.forEach((shift) => {
                    const assignedIds = area.assignments[shift.id] || [];
                    assignedIds.forEach((inspectorId) => {
                      const inspector = shift.inspectors.find((i) => i.id === inspectorId);
                      if (inspector) {
                        allAssignedInspectors.push({
                          inspector,
                          shiftId: shift.id,
                          shiftName: shift.name,
                        });
                      }
                    });
                  });

                  return (
                    <Col xs={24} sm={12} md={12} lg={8} key={area.id}>
                      <Card
                        title={area.name}
                        style={{
                          background: redPalette.bgContainer,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          borderTop: `4px solid ${
                            allAssignedInspectors.length > 0 ? redPalette.successGreen : redPalette.borderLight
                          }`,
                        }}
                        headStyle={{
                          background: redPalette.bgLayout,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                        bodyStyle={{ padding: 12 }}
                      >
                        <DroppableArea id={`global-area-${area.id}`} hasAssignment={allAssignedInspectors.length > 0}>
                          {allAssignedInspectors.length > 0 ? (
                            <Space direction="vertical" style={{ width: "100%" }} size="small">
                              {allAssignedInspectors.map(({ inspector, shiftId, shiftName }) =>
                                renderInspectorCard(inspector, shiftId, shiftName, area.id, currentGlobalZone.id),
                              )}
                            </Space>
                          ) : (
                            <Empty description="Drag inspectors here" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          )}
                        </DroppableArea>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Col>
          </Row>
        </div>
      ),
    [globalZoneId, currentGlobalZone, shifts, globalDateRange, saveAreaAssignments, renderInspectorCard],
  );
  const dndChildren = useMemo(
    () => (
      <>
        {currentView === "inspector-shift" && renderInspectorShiftView}
        {currentView === "zones" && renderZonesView}
        {currentView === "area-assignment" && renderAreaAssignmentView}
        {currentView === "global-zones" && renderGlobalZonesView}
        {currentView === "global-area-assignment" && renderGlobalAreaAssignmentView}
      </>
    ),
    [
      currentView,
      renderInspectorShiftView,
      renderZonesView,
      renderAreaAssignmentView,
      renderGlobalZonesView,
      renderGlobalAreaAssignmentView,
    ],
  );

  // Show loading screen for initial load
  if (isLoadingData && isInitialLoad && shifts.length === 0 && unassignedInspectors.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <Spin size="large" tip="Loading Shift Planner..." />
        <Button type="primary" onClick={retryFetchData} style={{ marginTop: "20px" }}>
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <Spin spinning={isLoadingData && !isInitialLoad} tip="Updating data...">
      <div
        style={{
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <div
            style={{
              marginBottom: 32,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              {currentView !== "inspector-shift" && (
                <Button
                  onClick={() => {
                    if (currentView === "area-assignment") {
                      setCurrentView("zones");
                      setSelectedZone(null);
                    } else if (currentView === "zones") {
                      setCurrentView("inspector-shift");
                      setSelectedShift(null);
                    } else if (currentView === "global-area-assignment") {
                      setCurrentView("global-zones");
                      setGlobalZoneId(null);
                    } else if (currentView === "global-zones") {
                      setCurrentView("inspector-shift");
                    }
                  }}
                  style={{
                    borderColor: redPalette.primaryRed,
                    color: redPalette.primaryRed,
                  }}
                >
                  Back
                </Button>
              )}
            </div>
          </div>

          {shifts.length === 0 && !isLoadingData ? (
            <Empty
              description="No shifts available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: "100px" }}
            >
              <Button type="primary" onClick={retryFetchData}>
                Load Data
              </Button>
            </Empty>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {dndChildren}
              <DragOverlay>
                {draggedInspectorId ? (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "white",
                      color: redPalette.textBlack,
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13px",
                      fontWeight: 500,
                      border: `2px solid ${redPalette.primaryRed}`,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <UserOutlined style={{ fontSize: "14px", color: redPalette.infoBlue }} />
                    {inspectorsByIdRef.current[draggedInspectorId]?.name}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          <Modal
            title="Configure Inspector"
            open={weeklyOffModal.visible}
            onCancel={() =>
              setWeeklyOffModal({
                visible: false,
                inspector: null,
                shiftId: null,
              })
            }
            onOk={confirmWeeklyOff}
            okText="Save"
            cancelText="Cancel"
            okButtonProps={{
              style: {
                background: redPalette.primaryRed,
                borderColor: redPalette.primaryRed,
              },
            }}
            width={600}
          >
            {weeklyOffModal.inspector && (
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {weeklyOffModal.inspector.name}
                  </Text>
                </div>
                <div>
                  <Text strong>Weekly Offs</Text>
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    {daysOfWeek.map((day) => (
                      <Checkbox
                        key={day}
                        checked={selectedWeeklyOffs.includes(day)}
                        onChange={(e) => handleWeeklyOffChange(day, e.target.checked)}
                      >
                        {day}
                      </Checkbox>
                    ))}
                  </div>
                </div>
                <div>
                  <Text strong>Assessment Types</Text>
                  <Select
                    mode="multiple"
                    style={{ width: "100%", marginTop: 12 }}
                    placeholder="Select assessment types"
                    value={weeklyOffModal.inspector.assessmentTypes}
                    onChange={(values) => {
                      if (weeklyOffModal.shiftId && weeklyOffModal.inspector) {
                        updateInspectorAssessmentTypes(
                          weeklyOffModal.shiftId,
                          weeklyOffModal.inspector.id,
                          values as AssessmentType[],
                        );
                      }
                    }}
                    options={allAssessmentOptions.map((type) => ({
                      label: type,
                      value: type,
                    }))}
                  />
                </div>
              </Space>
            )}
          </Modal>

          <Modal
            title="Bulk Edit Selected Inspectors"
            open={bulkModal.visible}
            onCancel={() => {
              setBulkModal({ visible: false, shiftId: null });
              setSelectedWeeklyOffs([]);
              setBulkAssessmentTypes([]);
            }}
            onOk={confirmBulk}
            okText="Apply to Selected"
            cancelText="Cancel"
            okButtonProps={{
              style: {
                background: redPalette.primaryRed,
                borderColor: redPalette.primaryRed,
              },
            }}
            width={600}
          >
            {bulkModal.shiftId && (
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                <div>
                  <Text strong>Editing {getShiftSelections(bulkModal.shiftId).length} inspectors</Text>
                </div>
                <div>
                  <Text strong>Weekly Offs</Text>
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    {daysOfWeek.map((day) => (
                      <Checkbox
                        key={day}
                        checked={selectedWeeklyOffs.includes(day)}
                        onChange={(e) => handleWeeklyOffChange(day, e.target.checked)}
                      >
                        {day}
                      </Checkbox>
                    ))}
                  </div>
                </div>
                <div>
                  <Text strong>Assessment Types</Text>
                  <Select
                    mode="multiple"
                    style={{ width: "100%", marginTop: 12 }}
                    placeholder="Select assessment types"
                    value={bulkAssessmentTypes}
                    onChange={(values) => setBulkAssessmentTypes(values as AssessmentType[])}
                    options={allAssessmentOptions.map((type) => ({
                      label: type,
                      value: type,
                    }))}
                  />
                </div>
              </Space>
            )}
          </Modal>

          <Modal
            title="Copy Inspector to Areas"
            open={copyModal.visible}
            onCancel={() =>
              setCopyModal({
                visible: false,
                shiftId: null,
                zoneId: null,
                inspectorId: null,
                sourceAreaId: null,
                targetAreaIds: [],
              })
            }
            onOk={confirmCopy}
            okText="Copy"
            cancelText="Cancel"
            okButtonProps={{
              style: {
                background: redPalette.primaryRed,
                borderColor: redPalette.primaryRed,
              },
            }}
            width={500}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Text>Select areas to copy this inspector to</Text>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {getAvailableAreasForCopy().map((area) => (
                    <Checkbox
                      key={area.id}
                      checked={copyModal.targetAreaIds.includes(area.id)}
                      onChange={() => toggleCopyAreaSelection(area.id)}
                    >
                      {area.name}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            </Space>
          </Modal>
        </div>
      </div>
    </Spin>
  );
};

export default ShiftPlanner;
