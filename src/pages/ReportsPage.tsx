import React, { useEffect, useState, useMemo } from "react";
import { Card, Space, Button, Input, Row, Col, Select, DatePicker, Tag, Form } from "antd";
import { DownloadOutlined, ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useAppNotification } from "../utils/notificationManager";
import { useDebounce } from "../hooks/useDebounce";
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

  const notification = useAppNotification();
  const config = reportsConfig;
  const [triggerReportDownload, { isLoading }] = useGetHtmlReportMutation();

  const [selectedReport, setSelectedReport] = useState<string | undefined>(undefined);
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchKey, setSearchKey] = useState<string | undefined>(config.searchConfig.globalSearchKeys[0]);

  const debouncedSearchValue = useDebounce(searchValue, 500);

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

  // Helper function to get translated description
  const getTranslatedDescription = (report: ReportConfig) => {
    if (report.descriptionKey) {
      return t(report.descriptionKey);
    }
    return report.description; // Fallback to original description
  };

  // Filter reports based on search
  const filteredReports = useMemo(() => {
    if (!debouncedSearchValue.trim()) {
      return reports;
    }
    return reports.filter((report) =>
      String(report[searchKey as keyof ReportConfig])
        .toLowerCase()
        .includes(debouncedSearchValue.toLowerCase()),
    );
  }, [debouncedSearchValue, searchKey]);

  // Get selected report config
  const reportConfig = reports.find((r) => r.key === selectedReport);

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
    return extensionMap[format] || format.toLowerCase();
  };

  // Generate and download report
  const generateReport = async () => {
    try {
      // Validate form fields - validation errors will show in form, no notification
      const values = await form.validateFields();

      const payload: GetHtmlReportPayload = {
        reportPath: reportConfig!.path,
        format: values.format,
        parameters: {},
      };

      // Add parameters based on report configuration
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

      console.log("Report payload:", payload);

      // Call RTK Query mutation
      const response = await triggerReportDownload(payload).unwrap();

      // Handle successful response
      const fileExtension = getFileExtension(values.format);
      const fileName = `${reportConfig!.name}_${dayjs().format("DD-MM-YYYY-HH-mm-ss")}.${fileExtension}`;

      // Create blob from response
      let blob: Blob;
      if (response instanceof Blob) {
        blob = response;
      } else {
        const contentTypeMap: Record<ReportFormat, string> = {
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
        blob = new Blob([response], { type: contentTypeMap[values.format] || "application/octet-stream" });
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notification.success(fileName, t("messages.reportDownloaded"));
    } catch (err: any) {
      // Check if it's a form validation error (from validateFields)
      // Validation errors don't have 'data' or 'status' properties
      if (!err.status && !err.data) {
        // This is a validation error, exit silently
        console.log("Form validation failed");
        return;
      }

      // Only show notification for API/download errors
      const errorMessage = err?.data?.en_Msg || err?.message || t("messages.reportDownloadFailed");
      console.error("Report download error:", err);
      notification.error({ data: { en_Msg: errorMessage } }, t("messages.downloadFailed"));
    }
  };

  // Reset form
  const handleCancel = () => {
    setSelectedReport(undefined);
    form.resetFields();
  };

  // Handle report selection
  const handleReportSelect = (reportKey: string) => {
    setSelectedReport(reportKey);
    // Set default format
    form.setFieldsValue({ format: "PDF" });
  };

  // Handle search key change
  const handleSearchKeyChange = (newKey: string) => {
    setSearchKey(newKey);
    setSearchValue("");
  };

  // Search addon
  const searchAddon = (
    <Select value={searchKey} onChange={handleSearchKeyChange} style={{ width: 150 }}>
      {config.searchConfig.globalSearchKeys.map((key: string) => (
        <Option key={key} value={key}>
          {t(`form.${key}`)}
        </Option>
      ))}
    </Select>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Search and Filters Card */}
      <Card bordered={false} bodyStyle={{ padding: "16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
          <Col>
            <Input
              addonBefore={searchAddon}
              placeholder={t("common.searchPlaceholder")}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: 400 }}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* Reports List */}
      {!selectedReport ? (
        // Report Selection View - Rows instead of Cards
        <Card
          title={t("page.selectReport")}
          bordered={false}
          style={{
            minHeight: "400px",
          }}
          bodyStyle={{
            padding: "16px",
          }}
        >
          {filteredReports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>{t("messages.noReportsFound")}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredReports.map((report) => (
                <div
                  key={report.key}
                  onClick={() => handleReportSelect(report.key)}
                  style={{
                    border: "1px solid #f0f0f0",
                    borderRadius: "4px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#1890ff";
                    e.currentTarget.style.background = "#fafafa";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#f0f0f0";
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Row align="middle" gutter={16}>
                      <Col flex="auto">
                        <h3
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#1890ff",
                          }}
                        >
                          {getTranslatedDescription(report)}
                        </h3>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "12px",
                            color: "#999",
                            fontFamily: "monospace",
                          }}
                        >
                          {report.name}
                        </p>
                        <Space size={4} wrap>
                          {report.language === "Arabic" && (
                            <Tag color="green" style={{ fontSize: "11px", margin: 0 }}>
                              {t("common.arabic")}
                            </Tag>
                          )}
                          {report.language === "English" && (
                            <Tag color="blue" style={{ fontSize: "11px", margin: 0 }}>
                              {t("common.english")}
                            </Tag>
                          )}
                          {report.parameters.requiresDateRange && (
                            <Tag color="orange" style={{ fontSize: "11px", margin: 0 }}>
                              {t("common.dateRange")}
                            </Tag>
                          )}
                          {report.parameters.requiresLeaveStatus && (
                            <Tag color="purple" style={{ fontSize: "11px", margin: 0 }}>
                              {t("common.leaveStatus")}
                            </Tag>
                          )}
                          {report.parameters.requiresUserId && (
                            <Tag color="cyan" style={{ fontSize: "11px", margin: 0 }}>
                              {t("common.userId")}
                            </Tag>
                          )}
                        </Space>
                      </Col>
                      <Col>
                        <ArrowRightOutlined style={{ fontSize: "16px", color: "#d9d9d9" }} />
                      </Col>
                    </Row>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        // Report Parameters View with Form
        <Card
          title={reportConfig ? getTranslatedDescription(reportConfig) : t("page.reportViewer")}
          extra={
            <Space>
              <Button onClick={handleCancel}>{t("common.back")}</Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={generateReport} loading={isLoading}>
                {isLoading ? t("common.downloading") : t("common.download")}
              </Button>
            </Space>
          }
          bordered={false}
          bodyStyle={{ padding: "16px" }}
        >
          {/* Report Info */}
          <div
            style={{
              padding: "12px",
              background: "#f5f5f5",
              borderRadius: "4px",
              border: "1px solid #e8e8e8",
              marginBottom: "16px",
            }}
          >
            <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600 }}>
              {reportConfig ? getTranslatedDescription(reportConfig) : t("page.reportViewer")}
            </h3>
            <p
              style={{
                margin: "0",
                fontSize: "12px",
                color: "#999",
                fontFamily: "monospace",
              }}
            >
              {reportConfig?.name}
            </p>
          </div>

          {/* Parameters Form */}
          <Form form={form} layout="vertical" initialValues={{ format: "PDF" }}>
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

              {/* Format Selector */}
              <Col xs={24} sm={24} md={12} lg={8}>
                <Form.Item
                  name="format"
                  label={t("form.exportFormat")}
                  rules={[{ required: true, message: t("messages.pleaseSelectFormat") }]}
                >
                  <Select style={{ width: "100%" }}>
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
              </Col>
            </Row>
          </Form>
        </Card>
      )}
    </Space>
  );
};

export default ReportsPage;