import React, { useState, useEffect, useMemo } from "react";
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
  App,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";

import DataTableWrapper from "../components/common/DataTableWrapper";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import StatsDisplay from "../components/common/StatsDisplay";
import ParkonicLocationViewDrawer from "../components/ParkonicLocation/ParkonicLocationViewDrawer";
import { parkonicLocationPageConfig } from "../config/pageConfigs/parkonicLocationConfig";
import { exportToCsv } from "../utils/csvExporter";

const { Option } = Select;

const ParkonicLocationPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = parkonicLocationPageConfig;

  const {
    apiParams: rawApiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    clearFilter,
    clearAll,
    state,
  } = useTableParams(config.searchConfig!);

  const apiParams = {
    PageNumber: rawApiParams.PageNumber || 1,
    PageSize: rawApiParams.PageSize || 10,
    ...rawApiParams,
  };

  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Dummy dataset
  const [data, setData] = useState<any[]>([
    {
      locationId: 1,
      zone: "Zone A",
      area: "Downtown",
      street: "Main St",
      lat: "25.276987",
      long: "55.296249",
    },
    {
      locationId: 2,
      zone: "Zone B",
      area: "Marina",
      street: "Beach Rd",
      lat: "25.197197",
      long: "55.274376",
    },
  ]);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  // Page title
  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

  // Sync search
  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  const handleClearFilter = (
    type: "search" | "date" | "column" | "sorter",
    key?: string,
    value?: string | number
  ) => {
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
      form.setFieldsValue({ ...record });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleFormSubmit = (values: any) => {
    if (modalMode === "add") {
      const newRecord = {
        ...values,
        locationId: data.length + 1,
      };
      setData((prev) => [...prev, newRecord]);
      notification.success(
        { data: { en_Msg: "Location added successfully" } },
        "Success"
      );
    } else {
      setData((prev) =>
        prev.map((item) =>
          item.locationId === selectedRecord.locationId
            ? { ...selectedRecord, ...values }
            : item
        )
      );
      notification.success(
        { data: { en_Msg: "Location updated successfully" } },
        "Success"
      );
    }
    handleModalClose();
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      notification.error(
        { data: { en_Msg: t("messages.selectRows") } },
        t("messages.selectRows")
      );
      return;
    }

    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      content: t("messages.csvConfirmContent"),
      onOk: () => {
        const selectedData = data.filter((item) =>
          selectedRowKeys.includes(item.locationId)
        );
        exportToCsv(selectedData, `parkonic-locations.csv`);
        notification.success(
          { data: { en_Msg: t("messages.csvDownloaded") } },
          t("messages.csvDownloaded")
        );
        setSelectedRowKeys([]);
      },
    });
  };

  const columnLabels = useMemo(
    () =>
      Object.fromEntries(
        config.tableConfig.columns.map((c) => [c.key, t(c.title)])
      ),
    [t, config.tableConfig.columns, i18n.language]
  );

  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "zone") {
          return {
            ...column,
            render: (value: any) => <Tag color="blue">{value}</Tag>,
          };
        }
        return column;
      }),
    }),
    [config.tableConfig]
  );

  const actionMenuItems = (record: any) => [
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
      onClick: () => handleModalOpen("edit", record),
    },
  ];

  const searchAddon = (
    <Select
      value={state.searchKey}
      onChange={(key) => setGlobalSearch(key, state.searchValue)}
      style={{ width: 150 }}
    >
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Stats */}
     <StatsDisplay
  statsConfig={config.statsConfig}
  data={data}
  loading={false}
/>

      {/* Search + Actions */}
      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16, rowGap: 10 }}
        >
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
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadCsv}
                disabled={selectedRowKeys.length === 0}
              >
                {t("common.downloadCsv")}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleModalOpen("add")}
              >
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

      {/* Table */}
      <DataTableWrapper
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={data}
        total={data.length}
        isLoading={false}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={state}
      />

      {/* Modal */}
      <Modal
        open={isModalOpen}
        title={t(
          modalMode === "add" ? "page.addTitle" : "page.editTitle",
          { entity: t(config.title) }
        )}
        onCancel={handleModalClose}
        onOk={() => form.submit()}
        okText={modalMode === "add" ? t("common.submit") : t("common.update")}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="zone"
                label={t("form.zone")}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="area"
                label={t("form.area")}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="street"
                label={t("form.street")}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lat"
                label={t("form.lat")}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="long"
                label={t("form.long")}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Drawer */}
      {viewRecord && (
        <ParkonicLocationViewDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          record={viewRecord}
        />
      )}
    </Space>
  );
};

export default ParkonicLocationPage;
