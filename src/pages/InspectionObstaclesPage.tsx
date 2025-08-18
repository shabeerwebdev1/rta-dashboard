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
  App,
  Drawer,
  Descriptions,
  Upload,
  Image,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  EyeOutlined,
  ShareAltOutlined,
  SearchOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useAppNotification } from "../utils/notificationManager";
import { useGetInspectionObstaclesQuery, useAddInspectionObstacleMutation } from "../services/rtkApiFactory";
import { useUploadFilesMutation } from "../services/fileApi";
import { getFileUrl } from "../services/fileApi";
import { STATUS_COLORS } from "../constants/ui";
import StatsDisplay from "../components/common/StatsDisplay";
import { searchConfig } from "../config/searchConfig";

const InspectionObstaclesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const notification = useAppNotification();
  const pageKey = "inspection-obstacles";
  const { apiParams, handleTableChange, setSearchFilters } = useTableParams(searchConfig[pageKey]);
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data, isLoading, isFetching } = useGetInspectionObstaclesQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });
  const [addObstacle, { isLoading: isAdding }] = useAddInspectionObstacleMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();

  useEffect(() => {
    setPageTitle(t("page.title.inspection-obstacles"));
  }, [setPageTitle, t]);

  const handleModalOpen = (record?: any) => {
    setSelectedRecord(record || null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      if (key === "Photo") {
        values[key]?.forEach((file: any) => {
          if (file.originFileObj) {
            formData.append("Photo", file.originFileObj);
          }
        });
      } else {
        formData.append(key, values[key]);
      }
    });

    try {
      const response = await addObstacle(formData).unwrap();
      notification.success(response, t("messages.addSuccess", { entity: "Inspection Obstacle" }));
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const stats = useMemo(
    () => [
      {
        title: "Reported Obstacles",
        icon: <SearchOutlined />,
        value: data?.total || 0,
      },
      {
        title: "Removed Obstacles",
        icon: <CheckSquareOutlined />,
        value: data?.data?.filter((d: any) => d.status?.toLowerCase() === "removed").length || 0,
        color: "#52c41a",
      },
    ],
    [data],
  );

  const columns = useMemo(
    () => [
      { key: "obstacleNumber", title: t("form.obstacleNumber"), dataIndex: "obstacleNumber", sorter: true },
      { key: "zone", title: t("form.zone"), dataIndex: "zone", sorter: true },
      { key: "area", title: t("form.area"), dataIndex: "area", sorter: true },
      { key: "sourceOfObstacle", title: t("form.sourceOfObstacle"), dataIndex: "sourceOfObstacle" },
      {
        key: "reportedAt",
        title: t("form.date"),
        dataIndex: "reportedAt",
        render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
        sorter: true,
      },
      { key: "reportedBy", title: t("form.reportedBy"), dataIndex: "reportedBy" },
      {
        key: "status",
        title: t("form.status"),
        dataIndex: "status",
        render: (text: string) => <Tag color={STATUS_COLORS[text?.toLowerCase()]}>{text}</Tag>,
      },
      {
        key: "action",
        title: t("common.action"),
        align: "center" as const,
        render: (_: any, record: any) => (
          <Dropdown
            menu={{
              items: [{ key: "view", label: t("common.view"), icon: <EyeOutlined />, onClick: () => handleView(record) }],
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
            <Input.Search
              placeholder={t("common.searchPlaceholder")}
              onSearch={(value) => setSearchFilters({ searchTerm: value })}
              style={{ width: 300 }}
              allowClear
            />
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleModalOpen()}>
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
        title={t("page.addTitle", { entity: "Inspection Obstacle" })}
        onCancel={handleModalClose}
        width="720px"
        footer={[
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
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Zone" label={t("form.zone")} rules={[{ required: true }]}>
                <Select options={["North", "South", "East", "West"].map((o) => ({ label: o, value: o }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Area" label={t("form.area")} rules={[{ required: true }]}>
                <Select options={["Residential", "Commercial", "Industrial"].map((o) => ({ label: o, value: o }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="SourceOfObstacle" label={t("form.sourceOfObstacle")} rules={[{ required: true }]}>
                <Select
                  options={["Construction", "Parked Vehicle", "Natural Obstacle", "Road Work"].map((o) => ({
                    label: o,
                    value: o,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ClosestPaymentDevice" label={t("form.closestPaymentDevice")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ReportedBy" label={t("form.reportedBy")} rules={[{ required: true }]}>
                <Input />
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
                <Upload listType="picture-card" beforeUpload={() => false}>
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>{t("common.selectFile")}</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="Comments" label={t("form.comments")}>
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
        title={t("page.viewTitle", { entity: "Inspection Obstacle" })}
        extra={
          <Button icon={<ShareAltOutlined />} onClick={() => {}}>
            {t("common.share")}
          </Button>
        }
      >
        {viewRecord && (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Descriptions bordered column={1}>
              <Descriptions.Item label={t("form.obstacleNumber")}>{viewRecord.obstacleNumber}</Descriptions.Item>
              <Descriptions.Item label={t("form.zone")}>{viewRecord.zone}</Descriptions.Item>
              <Descriptions.Item label={t("form.area")}>{viewRecord.area}</Descriptions.Item>
              <Descriptions.Item label={t("form.sourceOfObstacle")}>{viewRecord.sourceOfObstacle}</Descriptions.Item>
              <Descriptions.Item label={t("form.date")}>
                {dayjs(viewRecord.reportedAt).format("YYYY-MM-DD")}
              </Descriptions.Item>
              <Descriptions.Item label={t("form.reportedBy")}>{viewRecord.reportedBy}</Descriptions.Item>
              <Descriptions.Item label={t("form.status")}>
                <Tag color={STATUS_COLORS[viewRecord.status.toLowerCase()]}>{viewRecord.status}</Tag>
              </Descriptions.Item>
            </Descriptions>
            {viewRecord.photoPath && <Image width={200} src={getFileUrl(viewRecord.photoPath)} />}
          </Space>
        )}
      </Drawer>
    </Space>
  );
};

export default InspectionObstaclesPage;