// SupervisorManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Space, Select, Checkbox, Button, Spin, Pagination, Input, Tooltip, Radio } from "antd";
import { SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { SupervisorManagemnetConfig } from "../config/pageConfigs/SupervisorManagementConfig";
import { useTranslation } from "react-i18next";
import {
  useLazyGetLookupsQuery,
  useLazyGetShiftsQuery,
  useLazyGetZonesQuery,
  useGetAllAreasQuery,
  useGetActiveShiftsQuery,
  useUpdateShiftManagementMutation,
} from "../services/rtkApiFactory";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { useAppNotification } from "../utils/notificationManager";

const { Option } = Select;
const { Search } = Input;

interface SupervisorData {
  key: string;
  SupervisorName: string;
  zone?: string[];
  area?: string[];
  shift?: string;
  weekOffs?: number[];
  assignmentType?: number[];
  specialZone?: string | null;
  addOnMeta?: Record<string, unknown>;
  role: string;
  employeeId: string;
  uswMcode: string;
  isActive: boolean;
}

interface Zone {
  zoneId: number;
  zoneName: string;
  zoneNameAr?: string;
  zoneCode?: string;
  zone?: string;
}

interface Shift {
  shiftTypeGUID: string;
  shiftTypeCode: string;
  shiftTypeNameEn: string;
  shiftTypeNameAr: string;
}

interface Area {
  areaId?: string | number;
  area_Id?: string | number;
  id?: string | number;
  areaGUID?: string | number;
  areaCode?: string;
  area?: string;
  areaName?: string;
  name?: string;
  zoneId?: string | number;
  zone_Id?: string | number;
}

interface LookupItem {
  categoryId: number;
  categoryName: string;
  value: number;
  labelEn: string;
  labelAr: string;
}

interface ActiveShiftData {
  uswMcode: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  roleGUID: string;
  roleCode: string;
  role: string;
  wO_Days: string;
  isActive: boolean;
  assignmentTypes: number[];
  zoneIds: number[];
  specialZone?: boolean | null;
  addOn: string;
}

function SupervisorManagement() {
  const { t, i18n } = useTranslation();
  const notification = useAppNotification();

  const [data, setData] = useState<SupervisorData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [lookupOptions, setLookupOptions] = useState<LookupItem[]>([]);
  const [updatingRowKey, setUpdatingRowKey] = useState<string | null>(null);

  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetShifts] = useLazyGetShiftsQuery();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: activeShiftsResponse,
    isLoading: isLoadingActiveShifts,
    refetch: refetchActiveShifts,
  } = useGetActiveShiftsQuery();
  const { data: allAreasResponse = [], isLoading: isLoadingAreas } = useGetAllAreasQuery(undefined);

  const [updateShiftManagement, { isLoading: isUpdating }] = useUpdateShiftManagementMutation();

  useEffect(() => {
    fetchLookupData();
    fetchZonesData();
    fetchShiftsData();
  }, [i18n.language]);

  const availableShiftIds = useMemo(() => shifts.map((shift) => shift.shiftTypeGUID), [shifts]);
  const specialZoneOptions = useMemo(() => ["G9", "GX"], []);

  const parseAddOnData = (rawAddOn?: string): Record<string, unknown> => {
    if (!rawAddOn) return {};
    try {
      const parsed = JSON.parse(rawAddOn);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  };

  const toStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
    if (value === null || value === undefined || value === "") return [];
    return [String(value)];
  };

  const normalizeSearchValue = (value: unknown): string =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const specialZoneFlagToSelection = (specialZone?: boolean | null): string | null => {
    if (specialZone === true) return "G9";
    if (specialZone === false) return "GX";
    return null;
  };

  const specialZoneSelectionToFlag = (specialZone?: string | null): boolean | null => {
    if (specialZone === "G9") return true;
    if (specialZone === "GX") return false;
    return null;
  };

  useEffect(() => {
    if (activeShiftsResponse) {
      const activeShiftsData = Array.isArray(activeShiftsResponse)
        ? activeShiftsResponse
        : activeShiftsResponse.data || [];

      const transformedData: SupervisorData[] = activeShiftsData
        .filter((item: ActiveShiftData) => item.roleCode === "PARSUP")
        .map((item: ActiveShiftData, index: number) => {
          const isValidShift = item.shiftId && availableShiftIds.includes(item.shiftId);
          const zoneIds = item.zoneIds?.map((id) => id.toString()) || [];
          const addOnData = parseAddOnData(item.addOn);
          const parsedAreaIds = toStringArray(
            addOnData.areaIds ?? addOnData.areasIds ?? addOnData.areaId ?? addOnData.assignedAreaIds,
          );
          const parsedSpecialZones = toStringArray(addOnData.specialZones ?? addOnData.specialZoneCodes);
          const resolvedSpecialZone =
            parsedSpecialZones.length > 0 ? parsedSpecialZones[0] : specialZoneFlagToSelection(item.specialZone);
          const addOnMeta = { ...addOnData };
          delete addOnMeta.areaIds;
          delete addOnMeta.areasIds;
          delete addOnMeta.areaId;
          delete addOnMeta.assignedAreaIds;
          delete addOnMeta.specialZones;
          delete addOnMeta.specialZoneCodes;

          return {
            key: item.employeeId || item.uswMcode || `supervisor-${index}`,
            SupervisorName: item.employeeName,
            zone: zoneIds,
            area: parsedAreaIds,
            shift: isValidShift ? item.shiftId : undefined,
            weekOffs: item.wO_Days ? item.wO_Days.split(",").map((d) => parseInt(d)) : [],
            assignmentType: item.assignmentTypes || [],
            specialZone: resolvedSpecialZone,
            addOnMeta,
            role: item.role,
            employeeId: item.employeeId,
            uswMcode: item.uswMcode,
            isActive: item.isActive,
          };
        });

      setData(transformedData);
    }
  }, [activeShiftsResponse, availableShiftIds]);

  // ===== Search & Filter Logic =====
  const filteredData = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    if (!normalizedSearchTerm) return data;

    return data.filter((item) =>
      [
        item.SupervisorName,
        item.employeeId,
        item.uswMcode,
        item.role,
        item.shift,
        ...(item.zone || []),
      ]
        .map(normalizeSearchValue)
        .some((value) => value.includes(normalizedSearchTerm)),
    );
  }, [data, searchTerm]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredData.length, pageSize, currentPage]);

  // ===== Pagination Logic =====
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, pageSize]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  // Handle search input change
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // === Fetch functions ===
  const fetchZonesData = async () => {
    setIsLoadingZones(true);
    try {
      const result = await triggerGetZones().unwrap();
      setZones(result);
    } catch {
      notification.error(t("Fetch failed"), t("Failed to fetch zones data."));
    } finally {
      setIsLoadingZones(false);
    }
  };

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([1400]).unwrap();
      setLookupOptions(result);
    } catch {
      notification.error(t("Fetch failed"), t("Failed to fetch lookup data."));
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const fetchShiftsData = async () => {
    setIsLoadingShifts(true);
    try {
      const result = await triggerGetShifts().unwrap();
      setShifts(result);
    } catch {
      notification.error(t("Fetch failed"), t("Failed to fetch shifts data."));
    } finally {
      setIsLoadingShifts(false);
    }
  };

  // === Options ===
  const zoneOptions = useMemo(
    () =>
      zones.map((zone) => ({
        value: zone.zoneId.toString(),
        label: `${zone.zoneCode}-${zone.zone}`,
        original: zone,
      })),
    [zones, i18n.language],
  );

  const shiftOptions = useMemo(
    () =>
      shifts.map((shift) => ({
        value: shift.shiftTypeGUID,
        label: `${shift.shiftTypeCode} - ${i18n.language === "ar" ? shift.shiftTypeNameAr : shift.shiftTypeNameEn}`,
        original: shift,
      })),
    [shifts, i18n.language],
  );

  const areaOptions = useMemo(() => {
    const raw = Array.isArray(allAreasResponse) ? allAreasResponse : [];
    return (raw as Area[]).map((a) => {
      const value = a.areaId ?? a.area_Id ?? a.id ?? a.areaGUID ?? a.areaCode ?? a.area;
      const zoneId = a.zoneId ?? a.zone_Id;
      return {
        value: String(value ?? ""),
        label: a.area || a.areaName || a.name || String(value ?? ""),
        zoneId: zoneId ? String(zoneId) : "",
      };
    });
  }, [allAreasResponse]);

  const assignmentTypeOptions = useMemo(
    () =>
      lookupOptions
        .filter((item) => item.categoryId === 1400)
        .map((item) => ({
          value: item.value,
          label: i18n.language === "ar" ? item.labelAr : item.labelEn,
        })),
    [lookupOptions, i18n.language],
  );

  const weekDayOptions = useMemo(
    () =>
      SupervisorManagemnetConfig.tableConfig.weekDays.map((d) => ({
        label: t(d.label),
        value: parseInt(d.value),
      })),
    [i18n.language, t],
  );

  // === Handlers ===
  const handleZoneChange = (value: string[], record: SupervisorData) => {
    setData((prev) =>
      prev.map((item) => {
        if (item.key !== record.key) return item;
        const allowedAreaIds = new Set(
          areaOptions.filter((option) => value.includes(option.zoneId)).map((option) => option.value),
        );
        const nextAreas = (item.area || []).filter((areaId) => allowedAreaIds.has(areaId));
        return { ...item, zone: value, area: nextAreas };
      }),
    );
  };

  const handleShiftChange = (value: string, record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, shift: value } : item)));
  };

  const handleAreaChange = (value: string[], record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, area: value } : item)));
  };

  const handleWeekOffChange = (checkedValues: number[], record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, weekOffs: checkedValues } : item)));
  };

  const handleAssignmentTypeChange = (value: number[], record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, assignmentType: value } : item)));
  };

  const handleSpecialZoneChange = (value: string | null, record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, specialZone: value } : item)));
  };

  // === Update Handler ===
  const handleUpdate = async (record: SupervisorData) => {
    try {
      setUpdatingRowKey(record.key);

      const zoneIds = record.zone?.map((zoneId) => zoneId) || [];
      const selectedSpecialZone = record.specialZone ?? null;
      const assignmentTypes = record.assignmentType || [];
      const specialZone = specialZoneSelectionToFlag(selectedSpecialZone);

      const updateData = {
        employeeId: record.employeeId,
        shiftId: record.shift || "",
        wO_Days: record.weekOffs?.join(",") || "",
        role: "Supervisor",
        assignmentTypes,
        zoneIds,
        specialZone,
      };

      await updateShiftManagement(updateData).unwrap();

      notification.success(t("Update successful"), t("Supervisor data has been updated successfully."));

      refetchActiveShifts();
    } catch {
      notification.error(t("Update failed"), t("Failed to update supervisor data. Please try again."));
    } finally {
      setUpdatingRowKey(null);
    }
  };

  // === Columns with custom render ===
  const tableColumns = useMemo(() => {
    return SupervisorManagemnetConfig.tableConfig.columns.map((col: any) => {
      if (col.key === "zone") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Select
              mode="multiple"
              value={record.zone || []}
              style={{ width: 170 }}
              onChange={(val) => handleZoneChange(val, record)}
              placeholder={t("placeholders.selectZones")}
              loading={isLoadingZones}
              maxTagCount="responsive"
            >
              {zoneOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          ),
        };
      }

      if (col.key === "area") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => {
            const selectedZoneIds = record.zone || [];
            const filteredAreaOptions =
              selectedZoneIds.length > 0
                ? areaOptions.filter((option) => selectedZoneIds.includes(option.zoneId))
                : [];

            return (
              <Select
                mode="multiple"
                value={record.area || []}
                style={{ width: 170 }}
                onChange={(val) => handleAreaChange(val, record)}
                placeholder={t("placeholders.selectAreas")}
                loading={isLoadingAreas}
                maxTagCount="responsive"
                maxCount={2}
                allowClear
                disabled={selectedZoneIds.length === 0}
              >
                {filteredAreaOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            );
          },
        };
      }

      if (col.key === "shift") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Select
              value={record.shift}
              style={{ width: 150 }}
              onChange={(val) => handleShiftChange(val, record)}
              placeholder={t("placeholders.selectShift")}
              loading={isLoadingShifts}
              allowClear
            >
              {shiftOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          ),
        };
      }

      if (col.key === "AssignmentType") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Select
              mode="multiple"
              value={record.assignmentType || []}
              style={{ width: 160 }}
              onChange={(val) => handleAssignmentTypeChange(val, record)}
              placeholder={t("placeholders.selectAssignmentTypes")}
              loading={isLoadingLookups}
              maxTagCount="responsive"
            >
              {assignmentTypeOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          ),
        };
      }

      if (col.key === "SpecialZone") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Radio.Group value={record.specialZone ?? null} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {specialZoneOptions.map((option) => (
                <Radio
                  key={option}
                  value={option}
                  onClick={() => handleSpecialZoneChange(record.specialZone === option ? null : option, record)}
                >
                  {option}
                </Radio>
              ))}
            </Radio.Group>
          ),
        };
      }

      if (col.key === "weekOffs") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Checkbox.Group
              options={weekDayOptions}
              value={record.weekOffs}
              onChange={(vals) => handleWeekOffChange(vals as number[], record)}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(130px, 1fr))",
                columnGap: 16,
                rowGap: 6,
                minWidth: 300,
                whiteSpace: "nowrap",
              }}
            />
          ),
        };
      }

      if (col.key === "Actions") {
        return {
          ...col,
          fixed: "right",
          width: 80,
          render: (_: any, record: SupervisorData) => (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingRight: 8,
              }}
            >
              <Tooltip title={t("common.update")}>
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SyncOutlined />}
                  onClick={() => handleUpdate(record)}
                  loading={updatingRowKey === record.key}
                />
              </Tooltip>
            </div>
          ),
        };
      }

      return { ...col, dataIndex: col.key };
    });
  }, [
    zones,
    shifts,
    data,
    isLoadingZones,
    isLoadingShifts,
    isLoadingAreas,
    isLoadingLookups,
    updatingRowKey,
    weekDayOptions,
    areaOptions,
    assignmentTypeOptions,
    specialZoneOptions,
    t,
  ]);

  return (
    <Spin
      spinning={isLoadingActiveShifts || isLoadingZones || isLoadingShifts || isLoadingAreas || isLoadingLookups || isUpdating}
    >
      {/* Search Bar */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Search
          placeholder={t("placeholders.searchSupervisor") || "Search by supervisor name or employee ID"}
          allowClear
          enterButton={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 320 }}
        />
        <div style={{ color: "#666", fontSize: 14 }}>
          {filteredData.length > 0 ? (
            <>
              {t("common.showing") || "Showing"} <strong>{filteredData.length}</strong> {t("common.of") || "of"}{" "}
              <strong>{data.length}</strong> {t("common.supervisors") || "supervisors"}
            </>
          ) : (
            <span style={{ color: "#ff4d4f" }}>{t("common.noResults") || "No supervisors found"}</span>
          )}
        </div>
      </div>

      <DataTableWrapper
        pageConfig={{
          ...SupervisorManagemnetConfig,
          tableConfig: {
            ...SupervisorManagemnetConfig.tableConfig,
            columns: tableColumns,
          },
        }}
        data={paginatedData}
        total={filteredData.length}
        isLoading={isLoadingActiveShifts}
        handleTableChange={() => {}}
        handlePaginationChange={() => {}}
        tableSize="small"
        state={{ columnFilters: {} }}
        showPagination={false}
        rowKey={(record: SupervisorData) => record.key}
        scroll={{ x: 1180 }}
      />

      {/* Custom Pagination */}
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredData.length}
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={["5", "10", "20", "50"]}
          showQuickJumper={false}
          showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        />
      </div>
    </Spin>
  );
}

export default SupervisorManagement;
