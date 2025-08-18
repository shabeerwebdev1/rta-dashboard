import React, { useState, useEffect, useMemo } from "react";
import {
  Space,
  Card,
  Input,
  Button,
  Table,
  Dropdown,
  Tag,
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
  FieldTimeOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetTradeLicensesQuery,
  useAddTradeLicenseMutation,
  useUpdateTradeLicenseMutation,
  useDeleteTradeLicenseMutation,
} from "../services/rtkApiFactory";
import { STATUS_COLORS } from "../constants/ui";
import StatsDisplay from "../components/common/StatsDisplay";
import { searchConfig } from "../config/searchConfig";

const WhitelistTradeLicensesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const pageKey = "whitelist-tradelicenses";
  const { apiParams, handleTableChange, setSearchFilters } = useTableParams(searchConfig[pageKey]);
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data, isLoading, isFetching } = useGetTradeLicensesQuery(apiParams, { refetchOnMountOrArgChange: true });
  const [addTradeLicense, { isLoading: isAdding }] = useAddTradeLicenseMutation();
  const [updateTradeLicense, { isLoading: isUpdating }] = useUpdateTradeLicenseMutation();
  const [deleteTradeLicense, { isLoading: isDeleting }] = useDeleteTradeLicenseMutation();

  useEffect(() => {
    setPageTitle(t("page.title.whitelist-tradelicenses"));
  }, [setPageTitle, t]);

  const handleModalOpen = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
    if (mode === "edit" && record) {
      form.setFieldsValue({
        ...record,
        dateRange: [dayjs(record.fromDate), dayjs(record.toDate)],
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
        response = await addTradeLicense(payload).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: "Trade License" }));
      } else {
        response = await updateTradeLicense({ ...payload, id: selectedRecord.id }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: "Trade License" }));
      }
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: t("messages.deleteConfirmTitle"),
      content: t("messages.deleteConfirmContent", { entity: "Trade License" }),
      onOk: async () => {
        try {
          const response = await deleteTradeLicense(id).unwrap();
          notification.success(response, t("messages.deleteSuccess", { entity: "Trade License" }));
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

  const handleDateFilter = (dates: any) => {
    setSearchFilters({
      ...apiParams.filters,
      dateFrom: dates ? dates[0].toISOString() : undefined,
      dateTo: dates ? dates[1].toISOString() : undefined,
    });
  };

  const stats = useMemo(
    () => [
      {
        title: "Total Licenses",
        icon: <IdcardOutlined />,
        value: data?.total || 0,
      },
      {
        title: "Active Licenses",
        icon: <CheckCircleOutlined />,
        value: data?.data?.filter((d: any) => d.plateStatus?.toLowerCase() === "active").length || 0,
        color: "#52c41a",
      },
      {
        title: "Expired Licenses",
        icon: <FieldTimeOutlined />,
        value: data?.data?.filter((d: any) => dayjs(d.toDate as string).isBefore(dayjs())).length || 0,
        color: "#ff4d4f",
      },
    ],
    [data],
  );

  const columns = useMemo(
    () => [
      { key: "tradeLicenseNumber", title: t("form.tradeLicenseNumber"), dataIndex: "tradeLicenseNumber", sorter: true },
      { key: "tradeLicense_EN_Name", title: t("form.tradeLicense_EN_Name"), dataIndex: "tradeLicense_EN_Name", sorter: true },
      { key: "plotNumber", title: t("form.plotNumber"), dataIndex: "plotNumber", sorter: true },
      {
        key: "fromDate",
        title: t("form.fromDate"),
        dataIndex: "fromDate",
        render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
        sorter: true,
      },
      {
        key: "toDate",
        title: t("form.toDate"),
        dataIndex: "toDate",
        render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
        sorter: true,
      },
      {
        key: "plateStatus",
        title: t("form.status"),
        dataIndex: "plateStatus",
        render: (text: string) => <Tag color={STATUS_COLORS[text?.toLowerCase()]}>{text}</Tag>,
      },
      {
        key: "action",
        title: t("common.action"),
        align: "center" as const,
        render: (_: any, record: any) => (
          <Dropdown
            menu={{
              items: [
                { key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) },
                { key: "edit", label: t("common.edit"), icon: <EditOutlined />, onClick: () => handleModalOpen("edit", record) },
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
    ],
    [t],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay stats={stats} loading={isLoading} />
      <Card bordered={false}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Input.Search
                placeholder={t("common.searchPlaceholder")}
                onSearch={(value) => setSearchFilters({ searchTerm: value })}
                style={{ width: 300 }}
                allowClear
              />
              <DatePicker.RangePicker onChange={handleDateFilter} />
            </Space>
          </Col>
          <Col>
            <Space>
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
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.data}
          loading={isLoading || isFetching || isDeleting}
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
          size={tableSize}
        />
      </Card>

      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", { entity: "Trade License" })}
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
              <Form.Item name="tradeLicenseNumber" label={t("form.tradeLicenseNumber")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tradeLicense_EN_Name" label={t("form.tradeLicense_EN_Name")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tradeLicense_AR_Name" label={t("form.tradeLicense_AR_Name")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plotNumber" label={t("form.plotNumber")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="dateRange" label={t("form.dateRange")} rules={[{ required: true }]}>
                <DatePicker.RangePicker style={{ width: "100%" }} disabledDate={(d) => d && d < dayjs().startOf("day")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="exemptionReason_ID" label={t("form.exemptionReason_ID")} rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: "Govt Entity", value: 1 },
                    { label: "Diplomatic Entity", value: 2 },
                  ]}
                />
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
        title={t("page.viewTitle", { entity: "Trade License" })}
        extra={
          <Button icon={<ShareAltOutlined />} onClick={() => {}}>
            {t("common.share")}
          </Button>
        }
      >
        {viewRecord && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label={t("form.tradeLicenseNumber")}>{viewRecord.tradeLicenseNumber}</Descriptions.Item>
            <Descriptions.Item label={t("form.tradeLicense_EN_Name")}>{viewRecord.tradeLicense_EN_Name}</Descriptions.Item>
            <Descriptions.Item label={t("form.plotNumber")}>{viewRecord.plotNumber}</Descriptions.Item>
            <Descriptions.Item label={t("form.fromDate")}>{dayjs(viewRecord.fromDate).format("YYYY-MM-DD")}</Descriptions.Item>
            <Descriptions.Item label={t("form.toDate")}>{dayjs(viewRecord.toDate).format("YYYY-MM-DD")}</Descriptions.Item>
            <Descriptions.Item label={t("form.status")}>
              <Tag color={STATUS_COLORS[viewRecord.plateStatus.toLowerCase()]}>{viewRecord.plateStatus}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Space>
  );
};

export default WhitelistTradeLicensesPage;