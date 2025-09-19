import React, { useState, useEffect, useMemo } from "react";
import { Card, Space, Button, Modal, Form, Input } from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";

import DataTableWrapper from "../components/common/DataTableWrapper";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { parkonicLocationPageConfig } from "../config/pageConfigs/parkonicLocationConfig";
import ParkonicLocationViewDrawer from "../components/ParkonicLocation/ParkonicLocationViewDrawer";

const ParkonicLocationPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const config = parkonicLocationPageConfig;

  const {
    apiParams,
    handleTableChange,
    handlePaginationChange,
    clearFilter,
    clearAll,
    state,
  } = useTableParams(config.searchConfig!);

  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns]
  );

  const actionMenuItems = (record: any) => [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: t("common.view"),
      onClick: () => {
        setSelectedRecord(record);
        setDrawerOpen(true);
      },
    },
  ];

  const handleClearFilter = (
    type: "search" | "date" | "column" | "sorter",
    key?: string,
    value?: string | number
  ) => {
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    clearAll();
  };

  const handleCreate = () => {
    form.validateFields().then((values) => {
      console.log("Create new location:", values);
      form.resetFields();
      setIsModalOpen(false);
    });
  };

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header Actions */}
        <Card bordered={false} bodyStyle={{ padding: "16px" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            {t("common.create")}
          </Button>
        </Card>

        <ActiveFiltersDisplay
          state={state}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
        />

        {/* Table */}
        <DataTableWrapper
          pageConfig={config}
          data={[]} // No mock data, empty for now
          total={0}
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
          rowKey={config.tableConfig.rowKey}
          state={state}
        />
      </Space>

      {/* Create Modal */}
      <Modal
        title={t("parkonicLocation.createTitle")}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreate}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="zone"
            label={t("parkonicLocation.zone")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="area"
            label={t("parkonicLocation.area")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="street"
            label={t("parkonicLocation.street")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lat"
            label={t("parkonicLocation.lat")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="long"
            label={t("parkonicLocation.long")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Drawer */}
      <ParkonicLocationViewDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={selectedRecord}
      />
    </>
  );
};

export default ParkonicLocationPage;
