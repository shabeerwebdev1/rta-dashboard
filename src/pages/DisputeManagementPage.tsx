import React, { useState, useEffect, useMemo } from "react";
import {
  Space,
  Card,
  Input,
  Button,
  Table,
  Dropdown,
  Modal,
  Form,
  Row,
  Col,
  Select,
  App,
  Drawer,
  Descriptions,
} from "antd";
import { PlusOutlined, MoreOutlined, EyeOutlined, EditOutlined, ShareAltOutlined, DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useAppNotification } from "../utils/notificationManager";
import { useGetDisputesQuery, useAddDisputeMutation, useUpdateDisputeMutation } from "../services/rtkApiFactory";
import { exportToCsv } from "../utils/csvExporter";
import { searchConfig } from "../config/searchConfig";

const departmentOptions = [
  { label: "Parking", value: 1 },
  { label: "Traffic", value: 2 },
  { label: "Finance", value: 3 },
  { label: "Enforcement", value: 4 },
];

const paymentTypeOptions = [
  { label: "Cash", value: 1 },
  { label: "Credit Card", value: 2 },
  { label: "Online", value: 3 },
];

const DisputeManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const pageKey = "dispute-management";
  const { apiParams, handleTableChange, setSearchFilters } = useTableParams(searchConfig[pageKey]);
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data, isLoading, isFetching } = useGetDisputesQuery(apiParams, { refetchOnMountOrArgChange: true });
  const [addDispute, { isLoading: isAdding }] = useAddDisputeMutation();
  const [updateDispute, { isLoading: isUpdating }] = useUpdateDisputeMutation();

  useEffect(() => {
    setPageTitle(t("page.title.dispute-management"));
  }, [setPageTitle, t]);

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
        notification.success(response, t("messages.addSuccess", { entity: "Dispute" }));
      } else {
        response = await updateDispute({ ...values, dispute_Id: selectedRecord.dispute_Id }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: "Dispute" }));
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

  const columns = useMemo(
    () => [
      {
        key: "department",
        title: t("form.department"),
        dataIndex: "department",
        filters: departmentOptions.map((opt) => ({ text: opt.label, value: opt.value })),
        filterMode: "tree",
        filterSearch: true,
        render: (value: number) => departmentOptions.find((opt) => opt.value === value)?.label || value,
      },
      {
        key: "payment_Type",
        title: t("form.paymentType"),
        dataIndex: "payment_Type",
        filters: paymentTypeOptions.map((opt) => ({ text: opt.label, value: opt.value })),
        filterMode: "tree",
        render: (value: number) => paymentTypeOptions.find((opt) => opt.value === value)?.label || value,
      },
      { key: "phone", title: t("form.phoneNumber"), dataIndex: "phone" },
      { key: "crM_Ref", title: t("form.crmReference"), dataIndex: "crM_Ref", sorter: true },
      {
        key: "action",
        title: t("common.action"),
        align: "center" as const,
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
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    [t],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false}>
        <Row justify="space-between" align="middle">
          <Col>
            <Input.Search
              placeholder={t("common.searchPlaceholder")}
              onSearch={(value) => setSearchFilters({ searchTerm: value })}
              style={{ width: 300 }}
              allowClear
            />
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleModalOpen("add")}>
                {t("common.addNew")}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="dispute_Id"
          columns={columns}
          dataSource={data?.data}
          loading={isLoading || isFetching}
          pagination={{
            current: apiParams.PageNumber,
            pageSize: apiParams.PageSize,
            total: data?.total,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ${t("common.items")}`,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
          onChange={handleTableChange}
          rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
        />
      </Card>

      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", { entity: "Dispute" })}
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
                <Select options={departmentOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_Type" label={t("form.paymentType")} rules={[{ required: true }]}>
                <Select options={paymentTypeOptions} />
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

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={500}
        title={t("page.viewTitle", { entity: "Dispute" })}
        extra={
          <Button icon={<ShareAltOutlined />} onClick={() => {}}>
            {t("common.share")}
          </Button>
        }
      >
        {viewRecord && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label={t("form.fineNumber")}>{viewRecord.fine_Number}</Descriptions.Item>
            <Descriptions.Item label={t("form.department")}>
              {departmentOptions.find((opt) => opt.value === viewRecord.department)?.label}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.paymentType")}>
              {paymentTypeOptions.find((opt) => opt.value === viewRecord.payment_Type)?.label}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.reason")}>{viewRecord.dispute_Reason}</Descriptions.Item>
            <Descriptions.Item label={t("form.crmReference")}>{viewRecord.crM_Ref}</Descriptions.Item>
            <Descriptions.Item label={t("form.email")}>{viewRecord.email}</Descriptions.Item>
            <Descriptions.Item label={t("form.phoneNumber")}>{viewRecord.phone}</Descriptions.Item>
            <Descriptions.Item label={t("form.address")}>{viewRecord.address}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Space>
  );
};

export default DisputeManagementPage;