import React, { useState, useEffect, useMemo } from "react";
import {
  Space,
  Card,
  Input,
  Button,
  Dropdown,
  Modal,
  Form,
  Row,
  Col,
  Select,
  App,
  Upload,
  DatePicker,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import { useGetInspectionObstaclesQuery, useAddInspectionObstacleMutation } from "../services/rtkApiFactory";
import { useUploadFilesMutation } from "../services/fileApi";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { exportToCsv } from "../utils/csvExporter";
import DynamicViewDrawer from "../components/drawer";
import { pageConfigs } from "../config/pageConfigs";
import DataTableWrapper from "../components/common/DataTableWrapper";

const { Option } = Select;
const pageKey = "inspection-obstacles";

const InspectionObstaclesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey];
  const {
    apiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    setDateRange,
    clearFilter,
    clearAll,
    state,
  } = useTableParams(config.searchConfig!);
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const { data, isLoading, isFetching } = useGetInspectionObstaclesQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [addObstacle, { isLoading: isAdding }] = useAddInspectionObstacleMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

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

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    const { Photo } = values;
    let finalPayload: Record<string, any> = {};

    try {
      let savedFileName = "";
      if (Photo && Photo.length > 0 && Photo[0].originFileObj) {
        const formData = new FormData();
        formData.append("Category", "Obstacles");
        formData.append("Files", Photo[0].originFileObj);
        const uploadResult = await uploadFiles(formData).unwrap();
        savedFileName = (uploadResult as any[])[0].savedAs;
      }

      finalPayload = {
        obstacleNumber: values.ObstacleNumber,
        zone: values.Zone,
        area: values.Area,
        sourceOfObstacle: values.SourceOfObstacle,
        closestPaymentDevice: values.ClosestPaymentDevice,
        reportedBy: values.ReportedBy,
        comments: values.Comments,
        photo: savedFileName,
      };

      const response = await addObstacle(finalPayload).unwrap();
      notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => notification.success({ data: { en_Msg: "Share link copied to clipboard!" } }, "Link Copied!"),
      () => notification.error({ data: { en_Msg: "Failed to copy link." } }, "Copy Failed"),
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
        exportToCsv(selectedData, `obstacles_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
      },
    });
  };

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns],
  );

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
  ];

  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key] || key}
        </Option>
      ))}
    </Select>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={config.statsConfig} data={data?.data || []} loading={isLoading} />
      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
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
              <Button type="primary" icon={<PlusOutlined />} onClick={handleModalOpen}>
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

      <DataTableWrapper
        pageConfig={config}
        data={data?.data || []}
        total={data?.total || 0}
        isLoading={isLoading || isFetching}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{ selectedRowKeys, onChange: (keys: React.Key[]) => setSelectedRowKeys(keys) }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={state}
      />

      <Modal
        open={isModalOpen}
        title={t("page.addTitle", { entity: t(config.name.singular) })}
        onCancel={handleModalClose}
        width="720px"
        footer={[
          <Button key="reset" onClick={() => form.resetFields()}>
            {t("common.reset")}
          </Button>,
          <Button key="back" onClick={handleModalClose}>
            {t("common.cancel")}
          </Button>,
          <Button key="submit" type="primary" loading={isAdding || isUploading} onClick={() => form.submit()}>
            {t("common.submit")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="ObstacleNumber" label={t("form.obstacleNumber")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.obstacleNumber")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Zone" label={t("form.zone")} rules={[{ required: true }]}>
                <Select
                  placeholder={t("placeholders.zone")}
                  options={["North", "South", "East", "West"].map((o) => ({ label: o, value: o }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Area" label={t("form.area")} rules={[{ required: true }]}>
                <Select
                  placeholder={t("placeholders.area")}
                  options={["Residential", "Commercial", "Industrial"].map((o) => ({ label: o, value: o }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="SourceOfObstacle" label={t("form.sourceOfObstacle")} rules={[{ required: true }]}>
                <Select
                  placeholder={t("placeholders.sourceOfObstacle")}
                  options={["Construction", "Parked Vehicle", "Natural Obstacle", "Road Work"].map((o) => ({
                    label: o,
                    value: o,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ClosestPaymentDevice"
                label={t("form.closestPaymentDevice")}
                rules={[{ required: true }]}
              >
                <Input placeholder={t("placeholders.closestPaymentDevice")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ReportedBy" label={t("form.reportedBy")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.reportedBy")} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="Photo"
                label={t("form.photo")}
                rules={[{ required: true }]}
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload listType="picture-card" beforeUpload={() => false} multiple={true} accept=".jpg,.jpeg">
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>{t("form.UploadJPG/JPEG")}</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="Comments" label={t("form.comments")}>
                <Input.TextArea placeholder={t("placeholders.comments")} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {viewRecord && (
        <DynamicViewDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          record={viewRecord}
          config={config}
          onShare={handleShare}
        />
      )}
    </Space>
  );
};

export default InspectionObstaclesPage;
