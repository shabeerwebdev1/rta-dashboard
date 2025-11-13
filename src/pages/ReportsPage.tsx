import React, { useEffect, useState, useRef } from "react";
import { Card, Space, Button, Row, Col, Select, DatePicker, Form, Input, Modal, Empty } from "antd";
import { DownloadOutlined, EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useAppNotification } from "../utils/notificationManager";
import {
  reportsConfig,
  reports,
  GetHtmlReportPayload,
  ReportFormat,
  ReportConfig,
} from "../config/pageConfigs/reportsConfig";
import { useGetHtmlReportMutation } from "../services/rtkApiFactory";

const { Option } = Select;

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();

  const notification = useAppNotification();
  const config = reportsConfig;
  const [triggerReportDownload] = useGetHtmlReportMutation();

  const [selectedReport, setSelectedReport] = useState<string | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  // Separate loading states
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);

  // Preview handling
  const [previewReportUrl, setPreviewReportUrl] = useState<string>("");
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };
  }, []);

  // Helper function to get translated description
  const getTranslatedDescription = (report: ReportConfig) => {
    if (report.descriptionKey) {
      return t(report.descriptionKey);
    }
    return report.description;
  };

  // Get selected report config
  const reportConfig = reports.find((r) => r.key === selectedReport);

  // Check if report has any parameters
  const hasParameters = reportConfig
    ? reportConfig.parameters.requiresDateRange ||
      reportConfig.parameters.requiresLeaveStatus ||
      reportConfig.parameters.requiresUserId
    : false;

  // Get file extension based on format
  const getFileExtension = (format: ReportFormat): string => {
    const extensionMap: Record<ReportFormat, string> = {
      "HTML4.0": "html",
      PDF: "pdf",
      EXCEL: "xls",
      EXCELOPENXML: "xlsx",
      WORD: "doc",
      WORDOPENXML: "docx",
      CSV: "csv",
      XML: "xml",
      MHTML: "mhtml",
    };
    return extensionMap[format] || String(format).toLowerCase();
  };

  // Core: preview or download
  const handleGenerate = async (opts: { preview: boolean; format?: ReportFormat }) => {
    try {
      // Set appropriate loading state
      if (opts.preview) {
        setPreviewLoading(true);
      } else {
        setDownloadLoading(true);
      }

      // Validate form fields
      let values: any;
      if (opts.preview) {
        // For preview: validate form without format field
        const fieldsToValidate = [];
        if (reportConfig?.parameters.requiresDateRange) fieldsToValidate.push("dateRange");
        if (reportConfig?.parameters.requiresLeaveStatus) fieldsToValidate.push("leaveStatus");
        if (reportConfig?.parameters.requiresUserId) fieldsToValidate.push("userId");

        if (fieldsToValidate.length > 0) {
          values = await form.validateFields(fieldsToValidate);
        } else {
          values = form.getFieldsValue();
        }
      } else {
        // For download: get validated form values
        values = form.getFieldsValue();
        values.format = opts.format;
      }

      const payload: GetHtmlReportPayload = {
        reportPath: reportConfig!.path,
        format: opts.preview ? "PDF" : values.format,
        parameters: {},
      };

      if (reportConfig?.parameters.requiresDateRange && values.dateRange) {
        payload.parameters.FromDate = values.dateRange[0].format("YYYY/MM/DD");
        payload.parameters.ToDate = values.dateRange[1].format("YYYY/MM/DD");
      }

      if (reportConfig?.parameters.requiresLeaveStatus && values.leaveStatus) {
        payload.parameters.LeaveStatus = values.leaveStatus;
      }

      if (reportConfig?.parameters.requiresUserId && values.userId) {
        payload.parameters.UserId = values.userId;
      }

      // Call RTK mutation
      const response = await triggerReportDownload(payload).unwrap();

      if (opts.preview) {
        try {
          // Handle PDF blob for preview
          let blob: Blob;
          if (response instanceof Blob) {
            blob = response;
          } else if (response instanceof ArrayBuffer) {
            blob = new Blob([response], { type: "application/pdf" });
          } else if (typeof response === "string") {
            blob = new Blob([response], { type: "application/pdf" });
          } else {
            blob = new Blob([response as any], { type: "application/pdf" });
          }

          // Cleanup previous preview
          blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
          blobUrlsRef.current = [];

          // Create PDF blob URL without toolbar
          const pdfUrl = URL.createObjectURL(blob);
          blobUrlsRef.current.push(pdfUrl);
          setPreviewReportUrl(`${pdfUrl}#toolbar=0`);
        } finally {
          setPreviewLoading(false);
        }
        return;
      }

      // Download flow
      let blob: Blob;
      if (response instanceof Blob) {
        blob = response;
      } else if (response instanceof ArrayBuffer) {
        const contentTypeMap: Record<string, string> = {
          "HTML4.0": "text/html",
          PDF: "application/pdf",
          EXCEL: "application/vnd.ms-excel",
          EXCELOPENXML: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          WORD: "application/msword",
          WORDOPENXML: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          CSV: "text/csv",
          XML: "application/xml",
          MHTML: "message/rfc822",
        };
        const mime = contentTypeMap[values.format] || "application/octet-stream";
        blob = new Blob([response], { type: mime });
      } else if (typeof response === "string") {
        blob = new Blob([response], { type: "application/octet-stream" });
      } else {
        blob = new Blob([response as any], { type: "application/octet-stream" });
      }

      const fileExtension = getFileExtension(values.format);
      const fileName = `${reportConfig!.name}_${dayjs().format("DD-MM-YYYY-HH-mm-ss")}.${fileExtension}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notification.success(fileName, t("messages.reportDownloaded"));
      setIsModalVisible(false);
      modalForm.resetFields();
      setDownloadLoading(false);
    } catch (err: any) {
      if (err && err.errorFields) {
        if (opts.preview) setPreviewLoading(false);
        else setDownloadLoading(false);
        return;
      }

      if (opts.preview) setPreviewLoading(false);
      else setDownloadLoading(false);

      const errorMessage = err?.data?.en_Msg || err?.message || t("messages.reportDownloadFailed");
      console.error("Report error:", err);
      notification.error({ data: { en_Msg: errorMessage } }, t("messages.downloadFailed"));
    }
  };

  // Handle download button click - show modal
  const handleDownloadClick = async () => {
    try {
      // Validate main form fields first
      const fieldsToValidate = [];
      if (reportConfig?.parameters.requiresDateRange) fieldsToValidate.push("dateRange");
      if (reportConfig?.parameters.requiresLeaveStatus) fieldsToValidate.push("leaveStatus");
      if (reportConfig?.parameters.requiresUserId) fieldsToValidate.push("userId");

      if (fieldsToValidate.length > 0) {
        await form.validateFields(fieldsToValidate);
      }

      // If validation passes, show modal
      setIsModalVisible(true);
      modalForm.setFieldsValue({ format: "PDF" });
    } catch (err) {
      // Validation failed, don't show modal
      console.log("Validation failed:", err);
    }
  };

  // Handle modal OK - confirm download
  const handleModalOk = async () => {
    try {
      const values = await modalForm.validateFields();
      await handleGenerate({ preview: false, format: values.format });
    } catch (err) {
      console.log("Modal validation failed:", err);
    }
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setIsModalVisible(false);
    modalForm.resetFields();
  };

  // Reset form
  const handleCancel = () => {
    setSelectedReport(undefined);
    form.resetFields();
    modalForm.resetFields();
    setIsModalVisible(false);
    // cleanup preview
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
    setPreviewReportUrl("");
    setPreviewLoading(false);
    setDownloadLoading(false);
  };

  // Handle report selection
  const handleReportSelect = (value: string) => {
    setSelectedReport(value);
    form.setFieldsValue({ format: "PDF" });
    modalForm.setFieldsValue({ format: "PDF" });
    setIsModalVisible(false);
    // cleanup preview
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
    setPreviewReportUrl("");
    setPreviewLoading(false);
    setDownloadLoading(false);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Report Selection and Action Buttons Card */}
      <Card bordered={false} bodyStyle={{ padding: "16px" }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Select
              placeholder={t("page.selectReport")}
              value={selectedReport}
              onChange={handleReportSelect}
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
              options={reports.map((report) => ({
                value: report.key,
                label: getTranslatedDescription(report),
              }))}
            />
          </Col>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Space style={{ float: "right" }}>
              <Button onClick={handleCancel} disabled={!selectedReport}>
                {t("common.back")}
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadClick}
                disabled={!selectedReport || previewLoading}
                loading={downloadLoading}
              >
                {downloadLoading ? t("common.downloading") : t("common.download")}
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleGenerate({ preview: true })}
                disabled={!selectedReport || downloadLoading}
                loading={previewLoading}
              >
                {previewLoading ? t("common.loading") : t("common.preview")}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Report Parameters and Preview */}
      {selectedReport && (
        <Card bordered={false} bodyStyle={{ padding: "16px" }}>
          {/* Show Empty State when no parameters */}
          {!hasParameters && !previewReportUrl ? (
            <Empty
              image={<FileTextOutlined style={{ fontSize: 80, color: "#1890ff" }} />}
              imageStyle={{ height: 100 }}
              description={
                <Space direction="vertical" size="small">
                  <span style={{ fontSize: 16, fontWeight: 500 }}>{t("messages.noParametersRequired")}</span>
                </Space>
              }
            >
              <Button
                type="primary"
                size="large"
                icon={<EyeOutlined />}
                onClick={() => handleGenerate({ preview: true })}
                loading={previewLoading}
              >
                {previewLoading ? t("common.loading") : t("common.clickToPreview")}
              </Button>
            </Empty>
          ) : (
            <>
              {/* Parameters Form - Only show if has parameters */}
              {hasParameters && (
                <Form form={form} layout="vertical">
                  <Row gutter={[16, 16]}>
                    {/* Date Range (if required) */}
                    {reportConfig?.parameters.requiresDateRange && (
                      <Col xs={24} sm={24} md={12} lg={8}>
                        <Form.Item
                          name="dateRange"
                          label={t("form.dateRange")}
                          rules={[
                            { required: true, message: t("messages.pleaseSelectDateRange") },
                            {
                              validator: (_, value) => {
                                if (value && value[0] && value[1]) {
                                  if (value[0].isAfter(value[1])) {
                                    return Promise.reject(new Error(t("messages.fromDateCannotBeLater")));
                                  }
                                }
                                return Promise.resolve();
                              },
                            },
                          ]}
                        >
                          <DatePicker.RangePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    )}

                    {/* Leave Status (if required) */}
                    {reportConfig?.parameters.requiresLeaveStatus && (
                      <Col xs={24} sm={24} md={12} lg={8}>
                        <Form.Item
                          name="leaveStatus"
                          label={t("form.leaveStatus")}
                          rules={[{ required: true, message: t("messages.pleaseSelectLeaveStatus") }]}
                        >
                          <Select placeholder={t("placeholders.selectStatus")} style={{ width: "100%" }}>
                            <Option value="0">{t("status.pending")}</Option>
                            <Option value="1">{t("status.approved")}</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    )}

                    {/* User ID (if required) */}
                    {reportConfig?.parameters.requiresUserId && (
                      <Col xs={24} sm={24} md={12} lg={8}>
                        <Form.Item
                          name="userId"
                          label={t("form.userId")}
                          rules={[
                            { required: true, message: t("messages.pleaseEnterUserId") },
                            { whitespace: true, message: t("messages.userIdCannotBeEmpty") },
                          ]}
                        >
                          <Input placeholder={t("placeholders.enterUserId")} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                </Form>
              )}

              {/* Preview Area */}
              {previewReportUrl && (
                <div
                  style={{
                    marginTop: hasParameters ? 16 : 0,
                    border: "1px solid #e8e8e8",
                    borderRadius: 4,
                    overflow: "hidden",
                    minHeight: 600,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <iframe
                    title="report-preview"
                    src={previewReportUrl}
                    style={{ width: "100%", height: 800, border: 0 }}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Download Format Selection Modal */}
      <Modal
        title={t("form.selectExportFormat")}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={t("common.download")}
        cancelText={t("common.cancel")}
        confirmLoading={downloadLoading}
        maskClosable={false}
        width={400}
      >
        <Form form={modalForm} layout="vertical" initialValues={{ format: "PDF" }}>
          <Form.Item
            name="format"
            label={t("form.exportFormat")}
            rules={[{ required: true, message: t("messages.pleaseSelectFormat") }]}
          >
            <Select style={{ width: "100%" }} size="large">
              <Option value="HTML4.0">HTML</Option>
              <Option value="PDF">PDF</Option>
              <Option value="EXCEL">Excel (XLS)</Option>
              <Option value="EXCELOPENXML">Excel (XLSX)</Option>
              <Option value="WORD">Word (DOC)</Option>
              <Option value="WORDOPENXML">Word (DOCX)</Option>
              <Option value="CSV">CSV</Option>
              <Option value="XML">XML</Option>
              <Option value="MHTML">MHTML</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ReportsPage;
