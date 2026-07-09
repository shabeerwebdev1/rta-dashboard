import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  Dropdown,
  Table,
  Typography,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
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
import ArcGISMap from "../components/common/ArcGISMap";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const CAMPAIGN_LOCATION_CENTERS: Record<string, [number, number]> = {
  downtown: [25.2048, 55.2708],
  "business-bay": [25.191, 55.276],
  jumeirah: [25.144, 55.185],
  deira: [25.263, 55.31],
  "bur-dubai": [25.253, 55.276],
};

const getCampaignLocationCenter = (location?: string): [number, number] => {
  if (!location) return [25.2, 55.27];
  return CAMPAIGN_LOCATION_CENTERS[location] || [25.2, 55.27];
};

const getPolygonCenterFromRings = (rings: number[][][]): [number, number] | null => {
  if (!rings || rings.length === 0 || rings[0].length === 0) return null;

  // Take the first ring (outer boundary)
  const points = rings[0];
  if (points.length === 0) return null;

  const [totalLat, totalLng] = points.reduce(
    (acc, point) => {
      acc[0] += point[1]; // point[1] is latitude, point[0] is longitude
      acc[1] += point[0];
      return acc;
    },
    [0, 0],
  );

  return [totalLat / points.length, totalLng / points.length];
};

const ProactiveCampaignsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const [form] = Form.useForm();

  // Data (static)
  const [campaigns, setCampaigns] = useState<any[]>(staticProactiveCampaigns);
  const lookups = proactiveCampaignsConfig.lookups || proactiveLookupData;
  const selectedLocation = Form.useWatch("location", form);

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // map/polygon state (in modal)
  const [currentPolygon, setCurrentPolygon] = useState<number[][][]>([]);

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

  const getLookupOptions = (category: keyof typeof lookups) => lookups[category] || [];

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

    let rings = record?.polygon?.rings || record?.polygon || [];
    if (rings.length > 0 && !Array.isArray(rings[0][0])) {
      rings = [rings.map((p: number[]) => [p[1], p[0]])];
    }
    setCurrentPolygon(rings);

    setIsModalOpen(true);

    if (mode === "edit" && record) {
      form.setFieldsValue({
        titleEn: record.titleEn,
        location: record.location,
        timeInterval: [dayjs(record.startTime), dayjs(record.endTime)],
        violationTypes: record.violationTypes,
        assignedInspectors: record.assignedInspectors,
        notificationMessageEn: record.notificationMessageEn,
        status: record.status,
        createdBy: record.createdBy,
      });
    } else {
      form.resetFields();
      setCurrentPolygon([]);
      form.setFieldsValue({
        assignedInspectors: [],
        createdBy: "System User",
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
    setCurrentPolygon([]);
  };

  // Handler for boundary drawing completion - FIXED
  const handleBoundaryDrawn = useCallback((rings: number[][][]) => {
    console.log("Polygon drawn with rings:", rings);
    setCurrentPolygon(rings);
    form.setFieldsValue({ polygon: rings });
    message.success(t("messages.boundaryDrawn"));
  }, [form, t]);

  // Handler for clearing boundary - FIXED
  const handleClearBoundary = useCallback(() => {
    setCurrentPolygon([]);
    form.setFieldsValue({ polygon: [] });
    message.info(t("messages.boundaryCleared"));
  }, [form, t]);

  const mapLocationValue = (selectedLocation || selectedRecord?.location) as string | undefined;
  const mapCenter = getPolygonCenterFromRings(currentPolygon) || getCampaignLocationCenter(mapLocationValue);
  const [mapLat, mapLng] = mapCenter;

  // Create or update campaign
  const onFinish = (values: any) => {
    const {
      titleEn,
      location,
      timeInterval,
      violationTypes,
      polygon,
      assignedInspectors,
      notificationMessageEn,
      status,
      createdBy,
    } = values;

    // Validate polygon exists
    if (!polygon || polygon.length === 0 || polygon[0]?.length === 0) {
      message.error(t("validation.required", { field: t("form.polygon") }));
      return;
    }

    const newCampaign = {
      id: modalMode === "add" ? Math.max(0, ...campaigns.map((c) => c.id)) + 1 : selectedRecord.id,
      titleEn,
      location,
      startTime: timeInterval[0].toISOString(),
      endTime: timeInterval[1].toISOString(),
      violationTypes,
      assignedInspectors: assignedInspectors || [],
      polygon: {
        rings: polygon, // Store as rings for ArcGIS format
        type: "polygon",
      },
      notificationMessageEn,
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

  const tableColumns = [
    {
      key: "titleEn",
      title: t("form.titleEn"),
      dataIndex: "titleEn",
    },
    {
      key: "location",
      title: t("form.location"),
      dataIndex: "location",
      render: (value: string) => getLabel(value, "locations"),
    },
    {
      key: "startTime",
      title: t("form.startTime"),
      dataIndex: "startTime",
      render: (value: string) =>
        formatDateByLocale(value, { en: "DD MMM  YYYY HH:mm", ar: "DD MMM YYYY HH:mm" }, i18n.language),
    },
    {
      key: "endTime",
      title: t("form.endTime"),
      dataIndex: "endTime",
      render: (value: string) =>
        formatDateByLocale(value, { en: "DD MMM  YYYY HH:mm", ar: "DD MMM YYYY HH:mm" }, i18n.language),
    },
    {
      key: "violationTypes",
      title: t("form.violationTypes"),
      dataIndex: "violationTypes",
      render: (values: string[]) =>
        (values || []).map((vt: string) => <Tag key={vt}>{getLabel(vt, "violationTypes")}</Tag>),
    },
    {
      key: "assignedInspectors",
      title: t("form.assignedInspectors"),
      dataIndex: "assignedInspectors",
      render: (values: number[]) =>
        (values || []).map((id: number) => <Tag key={id}>{getLabel(id, "inspectors")}</Tag>),
    },
    {
      key: "status",
      title: t("form.status"),
      dataIndex: "status",
      render: (value: string) => (
        <Tag color={value === "active" ? "green" : value === "draft" ? "orange" : "blue"}>
          {getLabel(value, "statuses")}
        </Tag>
      ),
    },
    {
      key: "actions",
      title: t("common.actions"),
      align: "center" as const,
      width: 90,
      render: (_: unknown, record: any) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: t("common.view"),
                icon: <EyeOutlined />,
                onClick: () => handleView(record),
              },
              {
                key: "edit",
                label: t("common.edit"),
                icon: <EditOutlined />,
                onClick: () => openModal("edit", record),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
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

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={tableColumns}
          dataSource={filtered}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
            getCheckboxProps: (record: any) => ({
              name: record.id,
            }),
          }}
          pagination={false}
          size="small"
          scroll={{ x: "max-content" }}
          sticky={{ offsetHeader: 64 }}
          locale={{
            emptyText: (
              <div style={{ textAlign: "center", padding: 30 }}>
                <FileTextOutlined style={{ fontSize: 36, color: "#bbb" }} />
                <p>{t("common.noData")}</p>
              </div>
            ),
          }}
        />
      </Card>

      {/* Modal: Create / Edit Campaign */}
      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", {
          entity: t(proactiveCampaignsConfig.name.singular),
        })}
        onCancel={closeModal}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
        width={proactiveCampaignsConfig.formConfig?.modalWidth || 900}
        footer={[
          <Button key="back" onClick={closeModal}>
            {t("common.cancel")}
          </Button>,
          <Button key="draft" htmlType="button" onClick={() => {}}>
            {t("common.saveAsDraft", { defaultValue: "Save as Draft" })}
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="polygon" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="titleEn" label={t("form.title")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.title", { defaultValue: "Enter Title" })} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label={t("form.location")} rules={[{ required: true }]}>
                <Select placeholder={t("placeholders.selectLocation", { defaultValue: "Select location" })} allowClear>
                  {getLookupOptions("locations").map((item: any) => (
                    <Option key={item.value} value={item.value}>
                      {i18n.language === "ar" ? item.labelAr : item.labelEn}
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

            <Col span={12}>
              <Form.Item name="violationTypes" label={t("form.violationTypes")} rules={[{ required: true }]}>
                <Select mode="multiple" placeholder={t("placeholders.selectViolationTypes")}>
                  {getLookupOptions("violationTypes").map((v: any) => (
                    <Option key={v.value} value={v.value} label={i18n.language === "ar" ? v.labelAr : v.labelEn}>
                      {i18n.language === "ar" ? v.labelAr : v.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="assignedInspectors" label={t("form.assignedInspectors")} rules={[{ required: true }]}>
                <Select
                  mode="multiple"
                  placeholder={t("placeholders.selectInspector", { defaultValue: "Select inspectors" })}
                  allowClear
                >
                  {getLookupOptions("inspectors").map((item: any) => (
                    <Option key={item.value} value={item.value}>
                      {i18n.language === "ar" ? item.labelAr : item.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="status" label={t("form.status")} rules={[{ required: true }]}>
                <Select placeholder={t("placeholders.selectStatus", { defaultValue: "Select status" })} allowClear>
                  {getLookupOptions("statuses").map((item: any) => (
                    <Option key={item.value} value={item.value}>
                      {i18n.language === "ar" ? item.labelAr : item.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="notificationMessageEn"
                label={t("form.campaignMessage", { defaultValue: "Campaign Message" })}
                rules={[{ required: true }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder={t("placeholders.campaignMessage", { defaultValue: "Enter campaign message" })}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Divider orientation="left">
                <EnvironmentOutlined /> {t("form.drawBoundary")}
              </Divider>

              <div style={{ position: "relative", border: "1px solid #eee", borderRadius: 4, overflow: "hidden" }}>
                <Tooltip title={t("common.clear") as string}>
                  <Button
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      zIndex: 5,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                    danger
                    shape="circle"
                    onClick={handleClearBoundary}
                    disabled={currentPolygon.length === 0}
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
                <ArcGISMap
                  inspectors={[]}
                  center={[mapLng, mapLat]}
                  zoom={currentPolygon.length > 0 ? 14 : 13}
                  height="400px"
                  clickable={false}
                  legendEnabled={false}
                  enableBoundaryDrawing={true}
                  onBoundaryDrawn={handleBoundaryDrawn}
                  boundaryPolygonRings={currentPolygon}
                  onClearBoundary={handleClearBoundary}
                  showBasemapToggle={false}
                />
              </div>
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
