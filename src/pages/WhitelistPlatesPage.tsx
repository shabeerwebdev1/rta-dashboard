import React, { useState, useEffect, useMemo } from "react";
import {
  Space,
  Card,
  Input,
  Button,
  Table,
  Dropdown,
  Tag,
  Badge,
  Modal,
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  App,
  Drawer,
  Descriptions,
  Tooltip,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetPlatesQuery,
  useAddPlateMutation,
  useUpdatePlateMutation,
  useDeletePlateMutation,
} from "../services/rtkApiFactory";
import { STATUS_COLORS } from "../constants/ui";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import { searchConfig } from "../config/searchConfig";

const { Option } = Select;
const pageKey = "whitelist-plates";

const exemptionReasons = [
  { label: "Government Vehicle", value: 1 },
  { label: "Diplomatic Vehicle", value: 2 },
  { label: "Emergency Vehicle", value: 3 },
];

const WhitelistPlatesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const { apiParams, handleTableChange, handlePaginationChange, setGlobalSearch, setDateRange, clearFilter, clearAll, state } = useTableParams(
    searchConfig[pageKey],
  );
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetPlatesQuery(apiParams, { refetchOnMountOrArgChange: true });
  const [addPlate, { isLoading: isAdding }] = useAddPlateMutation();
  const [updatePlate, { isLoading: isUpdating }] = useUpdatePlateMutation();
  const [deletePlate, { isLoading: isDeleting }] = useDeletePlateMutation();

  useEffect(() => {
    setPageTitle(t("page.title.whitelist-plates"));
  }, [setPageTitle, t]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") {
      setSearchValue("");
    }
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const handleModalOpen = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
    if (mode === "edit" && record) {
      form.setFieldsValue({
        ...record,
        dateRange: record.fromDate && record.toDate ? [dayjs(record.fromDate), dayjs(record.toDate)] : null,
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    const { dateRange, ...rest } = values;
    const payload = {
      ...rest,
      fromDate: dateRange[0].toISOString(),
      toDate: dateRange[1].toISOString(),
    };

    try {
      let response;
      if (modalMode === "add") {
        response = await addPlate(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: "Plate" }));
      } else {
        response = await updatePlate({ ...payload, id: selectedRecord.id }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: "Plate" }));
      }
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: t("messages.deleteConfirmTitle"),
      content: t("messages.deleteConfirmContent", { entity: "Plate" }),
      onOk: async () => {
        try {
          const response = await deletePlate(id).unwrap();
          notification.success(response, t("messages.deleteSuccess", { entity: "Plate" }));
        } catch (err) {
          notification.error(err as any, "Delete Failed");
        }
      },
    });
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        notification.success({ data: { en_Msg: "Share link copied to clipboard!" } }, "Link Copied!");
      },
      () => {
        notification.error({ data: { en_Msg: "Failed to copy link." } }, "Copy Failed");
      },
    );
  };

  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      notification.error({ data: { en_Msg: t("messages.selectRows") } }, t("messages.selectRows"));
      return;
    }
    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      content: t("messages.csvConfirmContent"),
      onOk: () => {
        const selectedData = data.data.filter((item: any) => selectedRowKeys.includes(item.id));
        exportToCsv(selectedData, `whitelist-plates_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
      },
    });
  };

  const stats = useMemo(
    () => [
      { title: "Total Plates", icon: <IdcardOutlined />, value: data?.total || 0 },
      {
        title: "Active Plates",
        icon: <CheckCircleOutlined />,
        value: data?.data?.filter((d: any) => d.plateStatus?.toLowerCase() === "active").length || 0,
        color: "#52c41a",
      },
      {
        title: "Inactive Plates",
        icon: <CloseCircleOutlined />,
        value: data?.data?.filter((d: any) => d.plateStatus?.toLowerCase() === "inactive").length || 0,
        color: "#ff4d4f",
      },
    ],
    [data],
  );

  const columnLabels = useMemo(
    () => ({
      plateNumber: t("form.plateNumber"),
      plateSource: t("form.plateSource"),
      plateType: t("form.plateType"),
      plateColor: t("form.plateColor"),
      plateStatus: t("form.status"),
      fromDate: t("form.fromDate"),
      toDate: t("form.toDate"),
      exemptionReason_ID: t("form.exemptionReason_ID"),
    }),
    [t],
  );

  const columns = useMemo(() => {
    const getUniqueFilters = (key: string) => {
      if (!data?.data) return [];
      const uniqueValues = [...new Set(data.data.map((item: any) => item[key]).filter(Boolean))];
      return uniqueValues.map((value) => ({ text: String(value), value: String(value) }));
    };

    const baseColumns = [
      { key: "plateNumber", title: columnLabels.plateNumber, dataIndex: "plateNumber", sorter: true },
      { key: "plateSource", title: columnLabels.plateSource, dataIndex: "plateSource", sorter: true },
      { key: "plateType", title: columnLabels.plateType, dataIndex: "plateType", sorter: true },
      {
        key: "plateColor",
        title: columnLabels.plateColor,
        dataIndex: "plateColor",
        render: (text: string) => <Badge color={text?.toLowerCase()} text={text} />,
      },
      {
        key: "fromDate",
        title: columnLabels.fromDate,
        dataIndex: "fromDate",
        render: (text: string) => (text ? dayjs(text).format("YYYY-MM-DD") : "-"),
        sorter: true,
      },
      {
        key: "toDate",
        title: columnLabels.toDate,
        dataIndex: "toDate",
        render: (text: string) => (text ? dayjs(text).format("YYYY-MM-DD") : "-"),
        sorter: true,
      },
      {
        key: "plateStatus",
        title: columnLabels.plateStatus,
        dataIndex: "plateStatus",
        render: (text: string) => <Tag color={STATUS_COLORS[text?.toLowerCase()]}>{text}</Tag>,
      },
      {
        key: "action",
        // title: t("common.action"),
        align: "center" as const,
        fixed: 'right',
        width: 50,
        render: (_: any, record: any) => (
          <Dropdown
            menu={{
              items: [
                { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
                {
                  key: "edit",
                  label: t("common.edit"),
                  icon: <EditOutlined />,
                  onClick: () => handleModalOpen("edit", record),
                },
                {
                  key: "delete",
                  label: t("common.delete"),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDelete(record.id),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ];

    return baseColumns.map((col) => {
      if (searchConfig[pageKey].columnFilterKeys.includes(col.key)) {
        return { ...col, filters: getUniqueFilters(col.key), filterMode: "tree", filterSearch: true };
      }
      return col;
    });
  }, [t, data, columnLabels]);

  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 150 }}>
      {searchConfig[pageKey].globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay stats={stats} loading={isLoading} />
      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Input
                addonBefore={searchAddon}
                placeholder={t("common.searchPlaceholder")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 450 }}
                allowClear
              />
              <DatePicker.RangePicker
                value={state.dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
                {t("common.downloadCsv")}
              </Button>
              <Tooltip title={tableSize === "middle" ? "Compact view" : "Standard view"}>
                <Button
                  icon={tableSize === "middle" ? <AppstoreOutlined /> : <UnorderedListOutlined />}
                  onClick={() => setTableSize(tableSize === "middle" ? "small" : "middle")}
                />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleModalOpen("add")}>
                {t("common.addNew")}
              </Button>
            </Space>
          </Col>
        </Row>
        <ActiveFiltersDisplay
          state={state}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
        />
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
        scroll={{ x: 1500 }}
          sticky={{ offsetHeader: 64 }}
          dataSource={data?.data}
          loading={isLoading || isFetching || isDeleting}
          pagination={false}
          onChange={handleTableChange}
          rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
          size={tableSize}
        />
<div
    style={{
      position: "sticky",
      bottom: 0,
      background: "#fff",
      padding: "12px 16px",
      textAlign: "right",
      borderTop: "1px solid #f0f0f0",
      zIndex: 10,
    }}
  >
    <Pagination
      current={apiParams.PageNumber}
      pageSize={apiParams.PageSize}
      total={data?.total}
      showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} ${t("common.items")}`}
      showSizeChanger={ true}
      pageSizeOptions={["10", "20", "50"]}
    onChange={handlePaginationChange}
    />
    </div>
      </Card>

      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", { entity: "Plate" })}
        onCancel={handleModalClose}
        width="720px"
        footer={[
          <Button key="back" onClick={handleModalClose}>
            {t("common.cancel")}
          </Button>,
          <Button key="submit" type="primary" loading={isAdding || isUpdating} onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="plateNumber" label={t("form.plateNumber")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateSource" label={t("form.plateSource")} rules={[{ required: true }]}>
                <Select
                  options={[
                    "Dubai",
                    "Abu Dhabi",
                    "Sharjah",
                    "Ajman",
                    "Ras Al Khaimah",
                    "Fujairah",
                    "Umm Al Quwain",
                  ].map((o) => ({ label: o, value: o }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateType" label={t("form.plateType")} rules={[{ required: true }]}>
                <Select
                  options={["Private", "Commercial", "Motorcycle", "Taxi"].map((o) => ({ label: o, value: o }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateColor" label={t("form.plateColor")} rules={[{ required: true }]}>
                <Select
                  options={["White", "Red", "Blue", "Green", "Black", "Yellow", "Orange", "Purple"].map((o) => ({
                    label: o,
                    value: o,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="dateRange" label={t("form.dateRange")} rules={[{ required: true }]}>
                <DatePicker.RangePicker
                  style={{ width: "100%" }}
                  disabledDate={(d) => d && d < dayjs().startOf("day")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="exemptionReason_ID" label={t("form.exemptionReason_ID")} rules={[{ required: true }]}>
                <Select options={exemptionReasons} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateStatus" label={t("form.status")} rules={[{ required: true }]}>
                <Select options={["Active", "Inactive"].map((o) => ({ label: o, value: o }))} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={500}
        title={t("page.viewTitle", { entity: "Plate" })}
        extra={
          <Button icon={<ShareAltOutlined />} onClick={handleShare}>
            {t("common.share")}
          </Button>
        }
      >
        {viewRecord && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label={columnLabels.plateNumber}>{viewRecord.plateNumber}</Descriptions.Item>
            <Descriptions.Item label={columnLabels.plateSource}>{viewRecord.plateSource}</Descriptions.Item>
            <Descriptions.Item label={columnLabels.plateType}>{viewRecord.plateType}</Descriptions.Item>
            <Descriptions.Item label={columnLabels.plateColor}>
              <Badge color={viewRecord.plateColor.toLowerCase()} text={viewRecord.plateColor} />
            </Descriptions.Item>
            <Descriptions.Item label={columnLabels.fromDate}>
              {dayjs(viewRecord.fromDate).format("YYYY-MM-DD")}
            </Descriptions.Item>
            <Descriptions.Item label={columnLabels.toDate}>
              {dayjs(viewRecord.toDate).format("YYYY-MM-DD")}
            </Descriptions.Item>
            <Descriptions.Item label={columnLabels.plateStatus}>
              <Tag color={STATUS_COLORS[viewRecord.plateStatus.toLowerCase()]}>{viewRecord.plateStatus}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={columnLabels.exemptionReason_ID}>
              {exemptionReasons.find((r) => r.value === viewRecord.exemptionReason_ID)?.label ||
                viewRecord.exemptionReason_ID}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Space>
  );
};

export default WhitelistPlatesPage;
