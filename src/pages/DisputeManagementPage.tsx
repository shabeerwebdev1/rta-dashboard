import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Dropdown, Modal, Form, Row, Col, Select, App, DatePicker, Tooltip } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import { useGetDisputesQuery, useAddDisputeMutation, useUpdateDisputeMutation } from "../services/rtkApiFactory";
import { exportToCsv } from "../utils/csvExporter";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import DynamicViewDrawer from "../components/drawer";
import { pageConfigs } from "../config/pageConfigs";
import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";

const { Option } = Select;
const pageKey = "dispute-management";

const DisputeManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey];

  const { apiParams, handleTableChange, handlePaginationChange, setGlobalSearch, setDateRange, clearFilter, clearAll, state } =
    useTableParams(config.searchConfig!);
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

  const { data, isLoading, isFetching } = useGetDisputesQuery(apiParams, { refetchOnMountOrArgChange: true });
  const [addDispute, { isLoading: isAdding }] = useAddDisputeMutation();
  const [updateDispute, { isLoading: isUpdating }] = useUpdateDisputeMutation();

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

  const handleModalOpen = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
    if (mode === "edit" && record) {
      form.setFieldsValue(record);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    try {
      let response;
      if (modalMode === "add") {
        response = await addDispute(values).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      } else {
        response = await updateDispute({ ...values, dispute_Id: selectedRecord.dispute_Id }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
      }
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
        const selectedData = data.data.filter((item: any) => selectedRowKeys.includes(item.dispute_Id));
        exportToCsv(selectedData, `disputes_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
      },
    });
  };

  const columnLabels = useMemo(
    () =>
      Object.fromEntries(
        config.formConfig.fields
          .map((f) => [f.name, t(f.label)])
          .concat(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
      ),
    [t, config],
  );

  const actionMenuItems = (record: any) => [
    { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
    { key: "edit", label: t("common.edit"), icon: <EditOutlined />, onClick: () => handleModalOpen("edit", record) },
  ];

  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
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
        rowKey={config.tableConfig.rowKey}
      />

      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", { entity: t(config.name.singular) })}
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
              <Form.Item name="fine_Number" label={t("form.fineNumber")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label={t("form.department")} rules={[{ required: true }]}>
                <Select
                  options={
                    config.formConfig.fields.find((f) => f.name === "department")?.options as {
                      label: string;
                      value: unknown;
                    }[]
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_Type" label={t("form.paymentType")} rules={[{ required: true }]}>
                <Select
                  options={
                    config.formConfig.fields.find((f) => f.name === "payment_Type")?.options as {
                      label: string;
                      value: unknown;
                    }[]
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dispute_Reason" label={t("form.reason")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="crM_Ref" label={t("form.crmReference")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label={t("form.email")} rules={[{ required: true, type: "email" }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label={t("form.phoneNumber")}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label={t("form.address")} rules={[{ required: true }]}>
                <Input.TextArea />
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

export default DisputeManagementPage;