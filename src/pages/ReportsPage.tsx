/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useRef } from "react";
import { Card, Space, Button, Row, Col, Select, DatePicker, Form, Input, Modal, Spin } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useAppNotification } from "../utils/notificationManager";
import { useSearchParams } from "react-router-dom";
import { reportsConfig, reports, GetHtmlReportPayload, ReportFormat } from "../config/pageConfigs/reportsConfig";
import { useGetHtmlReportMutation } from "../services/rtkApiFactory";

const { Option } = Select;

const ReportLanguageSwitcher = ({ selectedReport }: { selectedReport?: string | undefined }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isArabic = selectedReport?.endsWith("_arb");

  const toggle = () => {
    if (!selectedReport) return;
    const newKey = isArabic ? selectedReport.replace("_arb", "_eng") : selectedReport.replace("_eng", "_arb");
    searchParams.set("report", newKey);
    setSearchParams(searchParams);
  };

  return (
    <Button type="text" onClick={toggle} style={{ fontWeight: 600 }}>
      {isArabic ? "EN" : "عربي"}
    </Button>
  );
};

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [searchParams] = useSearchParams();

  const notification = useAppNotification();
  const config = reportsConfig;
  const [triggerReportDownload] = useGetHtmlReportMutation();

  // selectedReport is the query param value (e.g. "vehicle_violations_eng")
  const [selectedReport, setSelectedReport] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [previewReportUrl, setPreviewReportUrl] = useState("");
  const blobUrlsRef = useRef<string[]>([]);
  const lastPreviewValuesRef = useRef<any | null>(null);
  const lastPreviewReportKeyRef = useRef<string | null>(null);

  const previousBaseKeyRef = useRef<string | null>(null);

  const getReportPageTitle = () => {
    if (!selectedReport) return t(config.title);

    const baseKey = selectedReport.replace(/(_eng|_arb)$/, "");

    const matched = reports.find((r) => r.key.startsWith(baseKey));
    if (!matched) return t(config.title);
    if (matched.descriptionKey) return t(matched.descriptionKey);

    return matched.description;
  };

  useEffect(() => {
    setPageTitle(getReportPageTitle());
  }, [selectedReport, t, config.title]);

  useEffect(() => {
    const param = searchParams.get("report") ?? undefined;
    if (!param) {
      setSelectedReport(undefined);
      previousBaseKeyRef.current = null;
      return;
    }

    const base = param.replace(/(_eng|_arb)$/, "");
    const prevBase = previousBaseKeyRef.current;

    if (!prevBase || prevBase !== base) {
      form.resetFields();
      lastPreviewValuesRef.current = null;
      lastPreviewReportKeyRef.current = null;
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
      setPreviewReportUrl("");
    }
    previousBaseKeyRef.current = base;
    setSelectedReport(param);
  }, [searchParams, form]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };
  }, []);

  const reportConfig = reports.find((r) => r.key === selectedReport);

  const hasParameters =
    reportConfig &&
    (reportConfig.parameters.requiresDateRange ||
      reportConfig.parameters.requiresLeaveStatus ||
      reportConfig.parameters.requiresUserId);
  const generatePreview = async (opts: { useStoredValues?: boolean; validateIfNeeded?: boolean } = {}) => {
    if (!selectedReport || !reportConfig) return;

    let values: any = null;

    if (opts.useStoredValues && lastPreviewValuesRef.current) {
      values = lastPreviewValuesRef.current;
    } else {
      const fields: string[] = [];
      if (reportConfig.parameters.requiresDateRange) fields.push("dateRange");
      if (reportConfig.parameters.requiresLeaveStatus) fields.push("leaveStatus");
      if (reportConfig.parameters.requiresUserId) fields.push("userId");

      if (fields.length && opts.validateIfNeeded !== false) {
        try {
          values = await form.validateFields(fields);
        } catch (e) {
          throw e;
        }
      } else {
        values = form.getFieldsValue();
      }
    }

    const payload: GetHtmlReportPayload = {
      reportPath: reportConfig.path,
      format: "PDF",
      parameters: {},
    };

    if (reportConfig.parameters.requiresDateRange && values.dateRange) {
      payload.parameters.FromDate = values.dateRange[0].format("YYYY/MM/DD");
      payload.parameters.ToDate = values.dateRange[1].format("YYYY/MM/DD");
    }

    if (reportConfig.parameters.requiresLeaveStatus && values.leaveStatus !== undefined) {
      payload.parameters.LeaveStatus = values.leaveStatus;
    }

    if (reportConfig.parameters.requiresUserId && values.userId) {
      payload.parameters.UserId = values.userId;
    }

    // call API
    const response = await triggerReportDownload(payload).unwrap();

    let blob: Blob;
    if (response instanceof Blob) {
      blob = response;
    } else if (response instanceof ArrayBuffer) {
      blob = new Blob([response], { type: "application/pdf" });
    } else {
      blob = new Blob([String(response)], { type: "application/pdf" });
    }

    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];

    const pdfUrl = URL.createObjectURL(blob);
    blobUrlsRef.current.push(pdfUrl);
    setPreviewReportUrl(`${pdfUrl}#toolbar=0&zoom=80`);
    lastPreviewValuesRef.current = values;
    lastPreviewReportKeyRef.current = selectedReport;
  };

  const requestPreview = async (opts: { useStoredValues?: boolean } = {}) => {
    if (!selectedReport || !reportConfig) return;
    setPreviewLoading(true);
    try {
      const useStored = Boolean(opts.useStoredValues && lastPreviewValuesRef.current);
      await generatePreview({ useStoredValues: useStored });
      setPreviewLoading(false);
    } catch (err) {
      setPreviewLoading(false);
      throw err;
    }
  };

  const handleGenerate = async (opts: { preview: boolean; format?: ReportFormat }) => {
    if (!selectedReport || !reportConfig) return;
    try {
      if (opts.preview) {
        await requestPreview({ useStoredValues: false });
        return;
      }

      const fields: string[] = [];
      if (reportConfig.parameters.requiresDateRange) fields.push("dateRange");
      if (reportConfig.parameters.requiresLeaveStatus) fields.push("leaveStatus");
      if (reportConfig.parameters.requiresUserId) fields.push("userId");

      let values: any = {};
      if (fields.length) {
        values = await form.validateFields(fields);
      } else {
        values = form.getFieldsValue();
      }
      values.format = opts.format;

      const payload: GetHtmlReportPayload = {
        reportPath: reportConfig.path,
        format: values.format,
        parameters: {},
      };

      if (reportConfig.parameters.requiresDateRange && values.dateRange) {
        payload.parameters.FromDate = values.dateRange[0].format("YYYY/MM/DD");
        payload.parameters.ToDate = values.dateRange[1].format("YYYY/MM/DD");
      }
      if (reportConfig.parameters.requiresLeaveStatus && values.leaveStatus !== undefined) {
        payload.parameters.LeaveStatus = values.leaveStatus;
      }
      if (reportConfig.parameters.requiresUserId && values.userId) {
        payload.parameters.UserId = values.userId;
      }

      const response = await triggerReportDownload(payload).unwrap();

      // build blob and download
      let blob: Blob;
      if (response instanceof Blob) blob = response;
      else if (response instanceof ArrayBuffer) blob = new Blob([response], { type: "application/octet-stream" });
      else blob = new Blob([String(response)], { type: "application/octet-stream" });

      const extMap: Record<ReportFormat, string> = {
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
      const fileName = `${reportConfig.name}_${dayjs().format("DD MMM YYYY-HH-mm-ss")}.${extMap[values.format] || "bin"}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notification.success(fileName, t("messages.reportDownloaded"));
      setIsModalVisible(false);
      modalForm.resetFields();
      setDownloadLoading(false);
    } catch (err) {
      setDownloadLoading(false);
      setPreviewLoading(false);
      // allow upstream to handle notifications if needed; keep silent here
    }
  };

  useEffect(() => {
    // If no report selected -> nothing
    if (!selectedReport || !reportConfig) return;

    const base = selectedReport.replace(/(_eng|_arb)$/, "");
    // If report has no parameters -> auto preview immediately
    if (!hasParameters) {
      // Use fresh preview (no stored params)
      // wrap in microtask to avoid calling during render
      (async () => {
        try {
          await requestPreview({ useStoredValues: false });
        } catch {
          /* ignore */
        }
      })();
      return;
    }

    if (lastPreviewReportKeyRef.current) {
      const lastBase = lastPreviewReportKeyRef.current.replace(/(_eng|_arb)$/, "");
      if (lastBase === base && lastPreviewValuesRef.current) {
        (async () => {
          try {
            await requestPreview({ useStoredValues: true });
          } catch {
            // if stored preview fails for any reason, do nothing (user can re-preview)
          }
        })();
      }
    }
  }, [selectedReport, reportConfig]);

  const handleDownloadClick = async () => {
    if (!reportConfig) return;
    try {
      const fields: string[] = [];
      if (reportConfig.parameters.requiresDateRange) fields.push("dateRange");
      if (reportConfig.parameters.requiresLeaveStatus) fields.push("leaveStatus");
      if (reportConfig.parameters.requiresUserId) fields.push("userId");

      if (fields.length) await form.validateFields(fields);

      setIsModalVisible(true);
      modalForm.setFieldsValue({ format: "PDF" });
    } catch (err) {
      // validation failed => don't open modal
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* HEADER & ACTIONS */}
      <Card bordered={false} bodyStyle={{ padding: "16px" }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={12}>
            {/* only show parameter form if report requires parameters */}
            {hasParameters && (
              <Form form={form} layout="vertical">
                <Row gutter={[16, 16]}>
                  {reportConfig?.parameters.requiresDateRange && (
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="dateRange"
                        label={t("form.dateRange")}
                        rules={[{ required: true, message: t("messages.pleaseSelectDateRange") }]}
                      >
                        <DatePicker.RangePicker format="DD MMM YYYY" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  )}

                  {reportConfig?.parameters.requiresLeaveStatus && (
                    <Col xs={24} md={12}>
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

                  {reportConfig?.parameters.requiresUserId && (
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="userId"
                        label={t("form.userId")}
                        rules={[{ required: true, message: t("messages.pleaseEnterUserId") }]}
                      >
                        <Input placeholder={t("placeholders.enterUserId")} />
                      </Form.Item>
                    </Col>
                  )}
                </Row>
              </Form>
            )}
          </Col>

          <Col xs={24} sm={24} md={12} lg={12}>
            <Space style={{ float: "right" }} wrap>
              <ReportLanguageSwitcher selectedReport={selectedReport} />

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadClick}
                disabled={!selectedReport}
                loading={downloadLoading}
              >
                {t("common.download")}
              </Button>

              {/* Hide preview button for parameterless reports (they auto-preview when selected) */}
              {hasParameters && (
                <Button
                  icon={<EyeOutlined />}
                  onClick={async () => {
                    try {
                      await requestPreview({ useStoredValues: false });
                    } catch {
                      // validation error handled by form
                    }
                  }}
                  disabled={!selectedReport}
                  loading={previewLoading}
                >
                  {t("common.preview")}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* PREVIEW */}
      {previewLoading && (
        <Card bordered={false}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin tip={t("messages.generatingPreview") || "Generating preview..."} />
          </div>
        </Card>
      )}

      {previewReportUrl && !previewLoading && (
        <Card bordered={false} bodyStyle={{ padding: "16px" }}>
          <div
            style={{
              border: "1px solid #e8e8e8",
              borderRadius: 4,
              overflow: "hidden",
              minHeight: 600,
            }}
          >
            <iframe title="report-preview" src={previewReportUrl} style={{ width: "100%", height: 800 }} />
          </div>
        </Card>
      )}

      {/* DOWNLOAD FORMAT MODAL */}
      <Modal
        title={t("form.selectExportFormat")}
        open={isModalVisible}
        onOk={async () => {
          try {
            const v = await modalForm.validateFields();
            setDownloadLoading(true);
            await handleGenerate({ preview: false, format: v.format });
          } catch {
            setDownloadLoading(false);
          }
        }}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={downloadLoading}
        width={400}
      >
        <Form form={modalForm} layout="vertical" initialValues={{ format: "PDF" }}>
          <Form.Item name="format" label={t("form.exportFormat")} rules={[{ required: true }]}>
            <Select size="large">
              <Option value="PDF">PDF</Option>
              <Option value="EXCEL">Excel (XLS)</Option>
              <Option value="EXCELOPENXML">Excel (XLSX)</Option>
              <Option value="WORD">Word (DOC)</Option>
              <Option value="WORDOPENXML">Word (DOCX)</Option>
              <Option value="CSV">CSV</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ReportsPage;
