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
  Upload,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  EyeOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  AuditOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useAppNotification } from "../utils/notificationManager";
import { useGetPledgesQuery, useAddPledgeMutation, useDeletePledgeMutation } from "../services/rtkApiFactory";
import { useUploadFilesMutation } from "../services/fileApi";
import StatsDisplay from "../components/common/StatsDisplay";
import { searchConfig } from "../config/searchConfig";

const PledgesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const pageKey = "pledges";
  const { apiParams, handleTableChange, setSearchFilters } = useTableParams(searchConfig[pageKey]);
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data, isLoading, isFetching } = useGetPledgesQuery(apiParams, { refetchOnMountOrArgChange: true });
  const [addPledge, { isLoading: isAdding }] = useAddPledgeMutation();
  const [deletePledge, { isLoading: isDeleting }] = useDeletePledgeMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();

  useEffect(() => {
    setPageTitle(t("page.title.pledges"));
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
    let payload = { ...values };
    const { document } = values;

    try {
      if (document && document.length > 0 && document[0].originFileObj) {
        const formData = new FormData();
        formData.append("Category", "PledgeDocuments");
        formData.append("Files", document[0].originFileObj);
        const uploadResult = await uploadFiles(formData).unwrap();
        payload.documentPath = (uploadResult as any[])[0].savedAs;
      }
      delete payload.document;

      const response = await addPledge(payload).unwrap();
      notification.success(response, t("messages.addSuccess", { entity: "Pledge" }));
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: t("messages.deleteConfirmTitle"),
      content: t("messages.deleteConfirmContent", { entity: "Pledge" }),
      onOk: async () => {
        try {
          const response = await deletePledge(id).unwrap();
          notification.success(response, t("messages.deleteSuccess", { entity: "Pledge" }));
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

  const stats = useMemo(
    () => [
      {
        title: "Total Pledges",
        icon: <AuditOutlined />,
        value: data?.total || 0,
      },
      {
        title: "Corporate Pledges",
        icon: <SnippetsOutlined />,
        value: data?.data?.filter((d: any) => d.pledgeType === "Corporate").length || 0,
      },
    ],
    [data],
  );

  const columns = useMemo(
    () => [
      { key: "pledgeNumber", title: t("form.pledgeNumber"), dataIndex: "pledgeNumber", sorter: true },
      { key: "tradeLicenseNumber", title: t("form.tradeLicenseNumber"), dataIndex: "tradeLicenseNumber", sorter: true },
      { key: "businessName", title: t("form.businessName"), dataIndex: "businessName", sorter: true },
      { key: "pledgeType", title: t("form.pledgeType"), dataIndex: "pledgeType" },
      {
        key: "submittedAt",
        title: t("form.fromDate"),
        dataIndex: "submittedAt",
        render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
        sorter: true,
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
        />
      </Card>

      <Modal
        open={isModalOpen}
        title={t("page.addTitle", { entity: "Pledge" })}
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
              <Form.Item name="pledgeNumber" label={t("form.pledgeNumber")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pledgeType" label={t("form.pledgeType")} rules={[{ required: true }]}>
                <Select options={["Corporate", "Individual"].map((o) => ({ label: o, value: o }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tradeLicenseNumber" label={t("form.tradeLicenseNumber")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="businessName" label={t("form.businessName")} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="document"
                label={t("form.document")}
                rules={[{ required: true }]}
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload listType="picture-card" beforeUpload={() => false} maxCount={1}>
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>{t("common.selectFile")}</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remarks" label={t("form.remarks")}>
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
        title={t("page.viewTitle", { entity: "Pledge" })}
        extra={
          <Button icon={<ShareAltOutlined />} onClick={() => {}}>
            {t("common.share")}
          </Button>
        }
      >
        {viewRecord && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label={t("form.pledgeNumber")}>{viewRecord.pledgeNumber}</Descriptions.Item>
            <Descriptions.Item label={t("form.tradeLicenseNumber")}>{viewRecord.tradeLicenseNumber}</Descriptions.Item>
            <Descriptions.Item label={t("form.businessName")}>{viewRecord.businessName}</Descriptions.Item>
            <Descriptions.Item label={t("form.pledgeType")}>{viewRecord.pledgeType}</Descriptions.Item>
            <Descriptions.Item label={t("form.fromDate")}>
              {dayjs(viewRecord.submittedAt).format("YYYY-MM-DD")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Space>
  );
};

export default PledgesPage;