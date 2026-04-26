import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Radio, Space, Spin, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SyncOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useAppNotification } from "../utils/notificationManager";
import { useGetActiveShiftsQuery, useUpdateSpecialZoneMutation } from "../services/rtkApiFactory";
import { inspectionManagementConfig } from "../config/pageConfigs/inspectionManagementConfig";

const { Search } = Input;

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
  specialZone?: number | null;
  addOn?: string;
}

interface InspectionManagementRow {
  key: string;
  employeeId: string;
  employeeName: string;
  role: string;
  shiftId: string;
  wO_Days: string;
  assignmentTypes: number[];
  zoneIds: string[];
  addOnMeta: Record<string, unknown>;
  specialZone: number | null;
}

const specialZoneOptions = [
  { label: "G1", value: 1 },
  { label: "GX", value: 2 },
  { label: "G90", value: 3 },
];

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
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
};

const normalizeSearchValue = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeSpecialZoneNumber = (specialZone?: number | null): number => {
  if (specialZone === 1 || specialZone === 2 || specialZone === 3) return specialZone;
  return 1;
};

const specialZoneCodeToValue = (specialZone?: string | null): number | null => {
  if (specialZone === "G1") return 1;
  if (specialZone === "GX") return 2;
  if (specialZone === "G90") return 3;
  return null;
};

const InspectionManagementPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const notification = useAppNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState<InspectionManagementRow[]>([]);
  const isArabic = i18n.language === "ar" || i18n.language === "ar-SA";

  const { data: activeUsersResponse, isLoading } = useGetActiveShiftsQuery();
  const [updateSpecialZone, { isLoading: isUpdating }] = useUpdateSpecialZoneMutation();

  useEffect(() => {
    setPageTitle(t(inspectionManagementConfig.title));
  }, [setPageTitle, t]);

  useEffect(() => {
    const activeUsers = Array.isArray(activeUsersResponse) ? activeUsersResponse : activeUsersResponse?.data || [];

    const mappedRows: InspectionManagementRow[] = activeUsers
      .filter((item: ActiveShiftData) => item.role !== "Parking Portal User")
      .map((item: ActiveShiftData, index: number) => {
        const addOnMeta = parseAddOnData(item.addOn);
        const parsedSpecialZones = toStringArray(addOnMeta.specialZones ?? addOnMeta.specialZoneCodes);
        const resolvedSpecialZone =
          parsedSpecialZones.length > 0 ? specialZoneCodeToValue(parsedSpecialZones[0]) : item.specialZone;

        return {
          key: item.uswMcode || item.employeeId || `active-user-${index}`,
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          role: item.role || item.roleCode,
          shiftId: item.shiftId || "",
          wO_Days: item.wO_Days || "",
          assignmentTypes: item.assignmentTypes || [],
          zoneIds: (item.zoneIds || []).map((zoneId) => String(zoneId)),
          addOnMeta,
          specialZone: normalizeSpecialZoneNumber(resolvedSpecialZone),
        };
      });

    setRows(mappedRows);
  }, [activeUsersResponse]);

  const filteredRows = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    if (!normalizedSearchTerm) return rows;

    return rows.filter((row) =>
      [row.employeeName, row.employeeId, row.role, row.key]
        .map(normalizeSearchValue)
        .some((value) => value.includes(normalizedSearchTerm)),
    );
  }, [rows, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSpecialZoneChange = (value: number | null, record: InspectionManagementRow) => {
    setRows((prev) => prev.map((item) => (item.key === record.key ? { ...item, specialZone: value } : item)));
  };

  const handleUpdate = async (record: InspectionManagementRow) => {
    try {
      const specialZoneValue = record.specialZone ?? 1;
      const payload = {
        employeeId: record.employeeId,
        specialZone: specialZoneValue,
      };

      await updateSpecialZone(payload).unwrap();
      setRows((prev) =>
        prev.map((item) =>
          item.key === record.key
            ? {
                ...item,
                specialZone: record.specialZone,
              }
            : item,
        ),
      );
      notification.success(
        t("Update successful"),
        isArabic ? "تم تحديث بيانات التفتيش بنجاح." : "Inspection data has been updated successfully.",
      );
    } catch {
      notification.error(
        t("Update failed"),
        isArabic
          ? "فشل تحديث بيانات التفتيش. يرجى المحاولة مرة أخرى."
          : "Failed to update inspection data. Please try again.",
      );
    }
  };

  const columns: ColumnsType<InspectionManagementRow> = [
    {
      title: isArabic ? "الاسم" : "Name",
      dataIndex: "employeeName",
      key: "employeeName",
      width: 260,
      render: (_value, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.employeeName || "-"}</div>
          {/* <div style={{ color: "#8c8c8c", fontSize: 12 }}>{record.employeeId || "-"}</div> */}
        </div>
      ),
    },
    {
      title: isArabic ? "المنطقة الخاصة" : "Special Zone",
      dataIndex: "specialZone",
      key: "specialZone",
      render: (_value, record) => (
        <Radio.Group value={record.specialZone ?? 1} onChange={(e) => handleSpecialZoneChange(e.target.value, record)}>
          <Space wrap>
            {specialZoneOptions.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      ),
    },
    {
      title: isArabic ? "الإجراءات" : "Actions",
      key: "action",
      width: 120,
      align: "center",
      render: (_value, record) => (
        <Tooltip title={t("common.update")}>
          <Button
            type="primary"
            shape="circle"
            icon={<SyncOutlined />}
            onClick={() => handleUpdate(record)}
            loading={isUpdating}
            style={{
              backgroundColor: "#00a967",
              borderColor: "#00a967",
              color: "#ffffff",
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Search
            placeholder={isArabic ? "ابحث عن مستخدم" : "Search user"}
            allowClear
            enterButton={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 360 }}
          />
          <div style={{ color: "#666", fontSize: 14 }}>
            {filteredRows.length > 0
              ? isArabic
                ? `${filteredRows.length} مستخدم نشط`
                : `${filteredRows.length} active users`
              : isArabic
                ? "لا يوجد مستخدمون"
                : "No users found"}
          </div>
        </div>

        <Spin spinning={isLoading || isUpdating}>
          <Table
            rowKey="key"
            columns={columns}
            dataSource={filteredRows}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 900 }}
          />
        </Spin>
      </Card>
    </Space>
  );
};

export default InspectionManagementPage;
