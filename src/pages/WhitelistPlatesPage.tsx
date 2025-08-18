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
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import useTableParams from "../hooks/useTableParams";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetPlatesQuery,
  useAddPlateMutation,
  useUpdatePlateMutation,
  useDeletePlateMutation,
} from "../services/rtkApiFactory";
import { STATUS_COLORS } from "../constants/ui";

const WhitelistPlatesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const { apiParams, handleTableChange, setSearchFilters } = useTableParams();
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);

  const { data, isLoading, isFetching } = useGetPlatesQuery(apiParams, { refetchOnMountOrArgChange: true });
  const [addPlate, { isLoading: isAdding }] = useAddPlateMutation();
  const [updatePlate, { isLoading: isUpdating }] = useUpdatePlateMutation();
  const [deletePlate, { isLoading: isDeleting }] = useDeletePlateMutation();

  useEffect(() => {
    setPageTitle(t("page.title.whitelist-plates"));
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

  const columns = useMemo(
    () => [
      { key: "plateNumber", title: t("form.plateNumber"), dataIndex: "plateNumber", sorter: true },
      { key: "plateSource", title: t("form.plateSource"), dataIndex: "plateSource", sorter: true },
      { key: "plateType", title: t("form.plateType"), dataIndex: "plateType", sorter: true },
      {
        key: "plateColor",
        title: t("form.plateColor"),
        dataIndex: "plateColor",
        render: (text: string) => <Badge color={text?.toLowerCase()} text={text} />,
      },
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleModalOpen("add")}>
              {t("common.addNew")}
            </Button>
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
          }}
          onChange={handleTableChange}
        />
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
                  options={["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"].map(
                    (o) => ({ label: o, value: o }),
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateType" label={t("form.plateType")} rules={[{ required: true }]}>
                <Select options={["Private", "Commercial", "Motorcycle", "Taxi"].map((o) => ({ label: o, value: o }))} />
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
                <DatePicker.RangePicker style={{ width: "100%" }} disabledDate={(d) => d && d < dayjs().startOf("day")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="exemptionReason_ID" label={t("form.exemptionReason_ID")} rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: "Government Vehicle", value: 1 },
                    { label: "Diplomatic Vehicle", value: 2 },
                    { label: "Emergency Vehicle", value: 3 },
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
        title={t("page.viewTitle", { entity: "Plate" })}
        extra={
          <Button icon={<ShareAltOutlined />} onClick={() => {}}>
            {t("common.share")}
          </Button>
        }
      >
        {viewRecord && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label={t("form.plateNumber")}>{viewRecord.plateNumber}</Descriptions.Item>
            <Descriptions.Item label={t("form.plateSource")}>{viewRecord.plateSource}</Descriptions.Item>
            <Descriptions.Item label={t("form.plateType")}>{viewRecord.plateType}</Descriptions.Item>
            <Descriptions.Item label={t("form.plateColor")}>
              <Badge color={viewRecord.plateColor.toLowerCase()} text={viewRecord.plateColor} />
            </Descriptions.Item>
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

export default WhitelistPlatesPage;