/* eslint-disable no-shadow-restricted-names */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ProactiveCampaignsPage.tsx
 *
 * - Uses proactiveCampaignsConfig.tsx (static data only)
 * - NO DELETE (per requirement)
 * - Dummy Google Map iframe is embedded; "Draw Boundary" generates a dummy polygon
 * - Auto-assign inspectors based on polygon (demo: picks nearest-like inspectors deterministically)
 * - Create / Edit / View campaigns supported
 *
 * Paste into: /pages/ProactiveCampaignsPage.tsx
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Space,
  Card,
  Input,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  App,
  Tag,
  Divider,
  message,
  Descriptions,
} from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined, FileTextOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import StatsDisplay from "../components/common/StatsDisplay";
import { formatDateByLocale } from "../utils/dateFormatter";
import {
  proactiveCampaignsConfig,
  staticProactiveCampaigns,
  proactiveLookupData,
} from "../config/pageConfigs/proactiveCampaignsConfig";
import ProactiveCampaignViewDrawer from "../components/ProactiveCampaigns/ProactiveCampaignViewDrawer";

const { RangePicker } = DatePicker;
const { Option } = Select;

const ProactiveCampaignsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const [form] = Form.useForm();

  // Data (static)
  const [campaigns, setCampaigns] = useState<any[]>(staticProactiveCampaigns);
  const lookups = proactiveCampaignsConfig.lookups || proactiveLookupData;

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // map/polygon state (in modal)
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const [autoAssignedInspectors, setAutoAssignedInspectors] = useState<number[]>([]);

  useEffect(() => {
    setPageTitle(t(proactiveCampaignsConfig.title));
  }, [setPageTitle, t]);

  // Helper label
  const getLabel = (value: string | number, category: string) => {
    const arr = (proactiveCampaignsConfig.lookups || lookups)[category] || [];
    const found = arr.find((i: any) => i.value === value);
    if (!found) return String(value);
    return i18n.language === "ar" ? found.labelAr : found.labelEn;
  };

  // Filtering logic
  const filtered = useMemo(() => {
    let list = [...campaigns];

    if (searchValue) {
      const q = searchValue.toLowerCase();
      list = list.filter(
        (c) =>
          String(c.titleEn || "")
            .toLowerCase()
            .includes(q) ||
          String(c.titleAr || "")
            .toLowerCase()
            .includes(q) ||
          String(c.notificationMessageEn || "")
            .toLowerCase()
            .includes(q) ||
          String(c.notificationMessageAr || "")
            .toLowerCase()
            .includes(q),
      );
    }

    if (filters.location) list = list.filter((c) => c.location === filters.location);
    if (filters.status) list = list.filter((c) => c.status === filters.status);
    if (filters.violationType) list = list.filter((c) => (c.violationTypes || []).includes(filters.violationType));

    if (dateRange) {
      const [start, end] = dateRange;
      list = list.filter((c) => {
        const s = dayjs(c.startTime);
        return s.isSame(start, "day") || (s.isAfter(start) && s.isBefore(end)) || s.isSame(end, "day");
      });
    }

    return list;
  }, [campaigns, searchValue, filters, dateRange]);

  // Stats metadata
  const statsMetadata = useMemo(
    () => ({
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === "active").length,
      draft: campaigns.filter((c) => c.status === "draft").length,
    }),
    [campaigns],
  );

  // Modal open
  const openModal = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setCurrentPolygon(record?.polygon || []);
    setAutoAssignedInspectors(record?.assignedInspectors || []);
    setIsModalOpen(true);

    if (mode === "edit" && record) {
      form.setFieldsValue({
        titleEn: record.titleEn,
        titleAr: record.titleAr,
        location: record.location,
        timeInterval: [dayjs(record.startTime), dayjs(record.endTime)],
        violationTypes: record.violationTypes,
        polygon: record.polygon,
        assignedInspectors: record.assignedInspectors,
        notificationMessageEn: record.notificationMessageEn,
        notificationMessageAr: record.notificationMessageAr,
        status: record.status,
        createdBy: record.createdBy,
      });
    } else {
      form.resetFields();
      setCurrentPolygon([]);
      setAutoAssignedInspectors([]);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
    setCurrentPolygon([]);
    setAutoAssignedInspectors([]);
  };

  // Dummy polygon generator (used when user clicks Draw Boundary)
  const generateDummyPolygon = (location?: string) => {
    // location-based seed for deterministic demo (simple hash)
    const seed = (location || "seed").split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
    // center coordinates vary by location to look realistic
    const centers: Record<string, [number, number]> = {
      downtown: [25.2048, 55.2708],
      "business-bay": [25.191, 55.276],
      jumeirah: [25.144, 55.185],
      deira: [25.263, 55.31],
      "bur-dubai": [25.253, 55.276],
    };
    const center = centers[location as string] || [25.2, 55.27];
    const [cx, cy] = center;
    // generate 4 points around center using seed
    const poly: [number, number][] = [
      [cx + ((seed % 10) - 5) * 0.0005, cy + ((seed % 7) - 3) * 0.0005],
      [cx + ((seed % 13) - 6) * 0.0006, cy + ((seed % 11) - 5) * 0.0006],
      [cx + ((seed % 17) - 8) * 0.0005, cy + ((seed % 19) - 9) * 0.0005],
      [cx + ((seed % 23) - 11) * 0.0006, cy + ((seed % 29) - 14) * 0.0006],
    ];
    return poly;
  };

  // Auto-assign inspectors based on polygon (demo logic: deterministic pick based on polygon centroid)
  const autoAssignInspectorsByPolygon = (poly: [number, number][]) => {
    if (!poly || poly.length === 0) return [];
    // compute centroid
    const centroid = poly.reduce(
      (acc, p) => {
        acc[0] += p[0];
        acc[1] += p[1];
        return acc;
      },
      [0, 0],
    ) as [number, number];
    centroid[0] /= poly.length;
    centroid[1] /= poly.length;
    // deterministic selection: pick inspectors whose id modulo 3 matches centroid lat rounded
    const selector = Math.abs(Math.round(centroid[0] * 100)) % 3;
    const inspectors = (lookups.inspectors || []).map((i: any) => i.value) as number[];
    // pick first 2 inspectors where id % 3 === selector, fallback to first two
    const matched = inspectors.filter((id) => id % 3 === selector);
    const result = matched.length >= 2 ? matched.slice(0, 3) : inspectors.slice(0, 3);
    return result;
  };

  // Draw Boundary button handler
  const handleDrawBoundary = (location?: string) => {
    const poly = generateDummyPolygon(location);
    setCurrentPolygon(poly);
    const assigned = autoAssignInspectorsByPolygon(poly);
    setAutoAssignedInspectors(assigned);
    message.success(t("messages.boundaryDrawn"));
    // fill form assignedInspectors if present
    form.setFieldsValue({ polygon: poly, assignedInspectors: assigned });
  };

  // Create or update campaign
  const onFinish = (values: any) => {
    const {
      titleEn,
      titleAr,
      location,
      timeInterval,
      violationTypes,
      polygon,
      assignedInspectors,
      notificationMessageEn,
      notificationMessageAr,
      status,
      createdBy,
    } = values;

    if (!polygon || polygon.length === 0) {
      message.error(t("validation.required", { field: t("form.polygon") }));
      return;
    }

    const newCampaign = {
      id: modalMode === "add" ? Math.max(0, ...campaigns.map((c) => c.id)) + 1 : selectedRecord.id,
      titleEn,
      titleAr,
      location,
      startTime: timeInterval[0].toISOString(),
      endTime: timeInterval[1].toISOString(),
      violationTypes,
      assignedInspectors: assignedInspectors || [],
      polygon,
      notificationMessageEn,
      notificationMessageAr,
      status,
      createdBy: createdBy || "System User",
      createdAt: selectedRecord?.createdAt || new Date().toISOString(),
    };

    if (modalMode === "add") {
      setCampaigns((prev) => [newCampaign, ...prev]);
      message.success(t("messages.addSuccess", { entity: t(proactiveCampaignsConfig.name.singular) }));
    } else {
      setCampaigns((prev) => prev.map((c) => (c.id === newCampaign.id ? newCampaign : c)));
      message.success(t("messages.updateSuccess", { entity: t(proactiveCampaignsConfig.name.singular) }));
    }
    closeModal();
  };

  // View record
  const handleView = (record: any) => {
    setViewRecord(record);
    setIsViewOpen(true);
  };

  // NOTE: no delete per requirement

  // Table columns (simple table rendering)
  const tableColumns = [
    { key: "titleEn", title: t("form.titleEn") },
    { key: "location", title: t("form.location") },
    { key: "startTime", title: t("form.startTime") },
    { key: "endTime", title: t("form.endTime") },
    { key: "violationTypes", title: t("form.violationTypes") },
    { key: "assignedInspectors", title: t("form.assignedInspectors") },
    { key: "status", title: t("form.status") },
    { key: "actions", title: t("common.actions") },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay
        statsConfig={proactiveCampaignsConfig.statsConfig}
        data={campaigns}
        metadata={statsMetadata}
        loading={false}
      />

      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Input
                placeholder={t("common.searchPlaceholder")}
                value={searchValue}
                allowClear
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 320 }}
              />
              <Select
                allowClear
                placeholder={t("form.location")}
                style={{ width: 180 }}
                onChange={(v) => setFilters((p: any) => ({ ...p, location: v }))}
              >
                {lookups.locations?.map((l: any) => (
                  <Option key={l.value} value={l.value}>
                    {i18n.language === "ar" ? l.labelAr : l.labelEn}
                  </Option>
                ))}
              </Select>
              <Select
                allowClear
                placeholder={t("form.status")}
                style={{ width: 150 }}
                onChange={(v) => setFilters((p: any) => ({ ...p, status: v }))}
              >
                {lookups.statuses?.map((s: any) => (
                  <Option key={s.value} value={s.value}>
                    {i18n.language === "ar" ? s.labelAr : s.labelEn}
                  </Option>
                ))}
              </Select>

              <RangePicker showTime onChange={(vals) => setDateRange(vals as any)} />
            </Space>
          </Col>

          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("add")}>
                {t("common.addNew")}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#fafafa" }}>
              {tableColumns.map((col) => (
                <th key={col.key} style={{ padding: 12, textAlign: "left", borderBottom: "1px solid #eee" }}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: 12, borderBottom: "1px solid #f5f5f5" }}>{c.titleEn}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f5f5f5" }}>{getLabel(c.location, "locations")}</td>
                <td style={{ padding: 12, borderBottom: "1px solid #f5f5f5" }}>
                  {formatDateByLocale(c.startTime, { en: "DD/MM/YYYY HH:mm", ar: "DD/MM/YYYY HH:mm" }, i18n.language)}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #f5f5f5" }}>
                  {formatDateByLocale(c.endTime, { en: "DD/MM/YYYY HH:mm", ar: "DD/MM/YYYY HH:mm" }, i18n.language)}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #f5f5f5" }}>
                  {(c.violationTypes || []).map((vt: string) => (
                    <Tag key={vt}>{getLabel(vt, "violationTypes")}</Tag>
                  ))}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #f5f5f5" }}>
                  {(c.assignedInspectors || []).map((id: number) => (
                    <Tag key={id}>{getLabel(id, "inspectors")}</Tag>
                  ))}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #f5f5f5" }}>
                  <Tag color={c.status === "active" ? "green" : c.status === "draft" ? "orange" : "blue"}>
                    {getLabel(c.status, "statuses")}
                  </Tag>
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid #f5f5f5" }}>
                  <Space>
                    <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(c)}>
                      {t("common.view")}
                    </Button>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal("edit", c)}>
                      {t("common.edit")}
                    </Button>
                    {/* No delete */}
                  </Space>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 30 }}>
            <FileTextOutlined style={{ fontSize: 36, color: "#bbb" }} />
            <p>{t("common.noData")}</p>
          </div>
        )}
      </Card>

      {/* Modal: Create / Edit Campaign */}
      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", {
          entity: t(proactiveCampaignsConfig.name.singular),
        })}
        onCancel={closeModal}
        style={{ top: 20 }}
        width={proactiveCampaignsConfig.formConfig?.modalWidth || 900}
        footer={[
          <Button key="back" onClick={closeModal}>
            {t("common.cancel")}
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="titleEn" label={t("form.titleEn")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.titleEn")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="titleAr" label={t("form.titleAr")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.titleAr")} dir="rtl" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="location" label={t("form.location")} rules={[{ required: true }]}>
                <Select
                  placeholder={t("placeholders.selectLocation")}
                  onChange={() => {
                    /* reset polygon when location changes */ setCurrentPolygon([]);
                    setAutoAssignedInspectors([]);
                    form.setFieldsValue({ polygon: [], assignedInspectors: [] });
                  }}
                >
                  {lookups.locations.map((l: any) => (
                    <Option key={l.value} value={l.value}>
                      {i18n.language === "ar" ? l.labelAr : l.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="timeInterval" label={t("form.timeInterval")} rules={[{ required: true }]}>
                <RangePicker showTime style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="violationTypes" label={t("form.violationTypes")} rules={[{ required: true }]}>
                <Select mode="multiple" placeholder={t("placeholders.selectViolationTypes")}>
                  {lookups.violationTypes.map((v: any) => (
                    <Option key={v.value} value={v.value}>
                      {i18n.language === "ar" ? v.labelAr : v.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Dummy Google Map + Draw Boundary */}
            <Col span={24}>
              <Divider orientation="left">
                <EnvironmentOutlined /> {t("form.drawBoundary")}
              </Divider>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  {/* Dummy Google Map iframe - visually realistic */}
                  <div style={{ border: "1px solid #eee", borderRadius: 4, overflow: "hidden" }}>
                    <iframe
                      title="dummy-google-map"
                      src="https://maps.google.com/maps?q=dubai&t=&z=13&ie=UTF8&iwloc=&output=embed"
                      style={{ width: "100%", height: 300, border: 0 }}
                    />
                  </div>
                </div>

                <div style={{ width: 260 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Button
                      block
                      onClick={() => {
                        const location = form.getFieldValue("location") || lookups.locations[0].value;
                        handleDrawBoundary(location);
                      }}
                    >
                      {t("form.drawBoundary")}
                    </Button>

                    <Button
                      block
                      onClick={() => {
                        form.setFieldsValue({ polygon: currentPolygon, assignedInspectors: autoAssignedInspectors });
                        message.info(t("messages.polygonSavedToForm"));
                      }}
                    >
                      {t("form.saveBoundaryToForm")}
                    </Button>

                    <div style={{ padding: 8, border: "1px dashed #eee", borderRadius: 4 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{t("form.currentPolygon")}</div>
                      {currentPolygon.length === 0 && (
                        <div style={{ color: "#888" }}>{t("placeholders.noPolygon")}</div>
                      )}
                      {currentPolygon.map((pt, idx) => (
                        <div key={idx}>
                          [{pt[0].toFixed(6)}, {pt[1].toFixed(6)}]
                        </div>
                      ))}
                    </div>

                    <Divider />

                    <div>
                      <div style={{ fontWeight: 600 }}>{t("form.autoAssignedInspectors")}</div>
                      <div style={{ marginTop: 8 }}>
                        {(autoAssignedInspectors || []).map((id) => (
                          <Tag key={id}>{getLabel(id, "inspectors")}</Tag>
                        ))}
                      </div>
                      <Button
                        style={{ marginTop: 8 }}
                        block
                        onClick={() => {
                          // allow manual adjustment: open assignedInspectors field in form
                          form.setFieldsValue({ assignedInspectors: autoAssignedInspectors });
                          message.info(t("messages.editAssignedInspectors"));
                        }}
                      >
                        {t("form.editAssigned")}
                      </Button>
                    </div>
                  </Space>
                </div>
              </div>
            </Col>

            <Col span={24}>
              <Form.Item name="polygon" label={t("form.polygon")} rules={[{ required: true }]}>
                {/* polygon stored in form as array; render read-only summary */}
                <Input.TextArea
                  rows={2}
                  readOnly
                  value={JSON.stringify(currentPolygon || form.getFieldValue("polygon") || [])}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="assignedInspectors" label={t("form.assignedInspectors")} rules={[{ required: true }]}>
                <Select mode="multiple" placeholder={t("placeholders.selectInspectors")}>
                  {lookups.inspectors.map((ins: any) => (
                    <Option key={ins.value} value={ins.value}>
                      {i18n.language === "ar" ? ins.labelAr : ins.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="status" label={t("form.status")} rules={[{ required: true }]}>
                <Select>
                  {lookups.statuses.map((s: any) => (
                    <Option key={s.value} value={s.value}>
                      {i18n.language === "ar" ? s.labelAr : s.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="notificationMessageEn"
                label={t("form.notificationMessageEn")}
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={2} placeholder={t("placeholders.notificationMessageEn")} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="notificationMessageAr"
                label={t("form.notificationMessageAr")}
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={2} placeholder={t("placeholders.notificationMessageAr")} dir="rtl" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="createdBy" label={t("form.createdBy")}>
                <Input placeholder={t("placeholders.createdBy")} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <ProactiveCampaignViewDrawer
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        record={viewRecord}
        getLabel={getLabel}
      />
    </Space>
  );
};

export default ProactiveCampaignsPage;
