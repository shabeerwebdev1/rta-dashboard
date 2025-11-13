import React, { useEffect, useState, useMemo, useRef } from "react";
import { Card, Space, Button, Input, Row, Col, Select, DatePicker, Tag, Form, Spin } from "antd";
import { DownloadOutlined, ArrowRightOutlined, EyeOutlined } from "@ant-design/icons";
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

  // Preview handling
  const [previewReportUrl, setPreviewReportUrl] = useState<string | "">("");
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const blobUrlsRef = useRef<string[]>([]); // resource blob URLs to revoke
  const htmlBlobUrlRef = useRef<string | null>(null); // final HTML blob URL

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
      if (htmlBlobUrlRef.current) {
        URL.revokeObjectURL(htmlBlobUrlRef.current);
        htmlBlobUrlRef.current = null;
      }
    };
  }, []);

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
    return extensionMap[format] || String(format).toLowerCase();
  };

  /* ------------------ MHTML parsing & resource extraction ------------------ */

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const parseHeaders = (rawHeaders: string) => {
    const headers: Record<string, string> = {};
    const lines = rawHeaders
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (let line of lines) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const name = line.slice(0, idx).trim().toLowerCase();
      const val = line.slice(idx + 1).trim();
      if (headers[name]) headers[name] += ", " + val;
      else headers[name] = val;
    }
    return headers;
  };

  const decodeQuotedPrintable = (input: string) =>
    input.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, function (m, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    });

  // Replace both functions in your component

  const decodePartBodyToString = (part: any) => {
    const cte = (part.headers["content-transfer-encoding"] || "").toLowerCase();
    const body = part.body || "";

    if (cte.includes("base64")) {
      // clean any non-base64 chars (tolerant decode)
      const cleaned = body.replace(/[^A-Za-z0-9+/=]/g, "");
      try {
        const binary = atob(cleaned);
        // Convert binary string -> UTF-8 text
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        const decoder = new TextDecoder("utf-8");
        return decoder.decode(bytes);
      } catch (e) {
        console.warn("Base64 decode failed, returning raw text fallback:", e);
        return body; // fallback to raw
      }
    } else if (cte.includes("quoted-printable")) {
      return decodeQuotedPrintable(body);
    } else {
      // plain 7bit/8bit
      return body;
    }
  };

  const decodeToUint8Array = (part: any) => {
    const cte = (part.headers["content-transfer-encoding"] || "").toLowerCase();
    const body = part.body || "";

    if (cte.includes("base64")) {
      // clean broken base64 safely
      const cleaned = body.replace(/[^A-Za-z0-9+/=]/g, "");
      try {
        const binary = atob(cleaned);
        const len = binary.length;
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i);
        return arr;
      } catch (e) {
        console.warn("Base64 binary decode failed, returning empty array:", e);
        return new Uint8Array();
      }
    } else if (cte.includes("quoted-printable")) {
      const str = decodeQuotedPrintable(body);
      return new TextEncoder().encode(str);
    } else {
      return new TextEncoder().encode(body);
    }
  };

  const parseMHTMLAndBuildHtmlBlob = async (raw: string) => {
    // Revoke previous resource blobs
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
    if (htmlBlobUrlRef.current) {
      URL.revokeObjectURL(htmlBlobUrlRef.current);
      htmlBlobUrlRef.current = null;
      setPreviewReportUrl("");
    }

    // find boundary
    const bMatch = raw.match(/boundary="([^"]+)"|boundary=([^\s;]+)/i);
    if (!bMatch) throw new Error("Could not determine MHTML boundary.");
    const boundary = bMatch[1] || bMatch[2];
    const parts = raw.split(new RegExp(`--${escapeRegex(boundary)}(?:\\r?\\n)`));

    const parsedParts: Array<any> = [];
    for (let part of parts) {
      if (!part || /^--\s*$/.test(part) || /^--\s*--/.test(part)) continue;
      const sep = part.indexOf("\r\n\r\n") >= 0 ? "\r\n\r\n" : "\n\n";
      const [rawHeaders, ...bodyRest] = part.split(sep);
      const body = bodyRest.join(sep);
      const headers = parseHeaders(rawHeaders || "");
      const tidyBody = body.replace(/\r?\n--$/, "");
      parsedParts.push({ headers, body: tidyBody });
    }

    const htmlPart = parsedParts.find((p) => (p.headers["content-type"] || "").toLowerCase().includes("text/html"));
    if (!htmlPart) throw new Error("No text/html part found in MHTML.");

    let htmlText = decodePartBodyToString(htmlPart);

    // Resource parts: ones that have content-location or content-id
    const resourceParts = parsedParts.filter((p) => p.headers["content-location"] || p.headers["content-id"]);

    // For each resource, create a blob URL and replace references in HTML.
    for (let rp of resourceParts) {
      const contentLocationRaw = (rp.headers["content-location"] || "").trim();
      const contentIdRaw = (rp.headers["content-id"] || "").trim();
      const ct = (rp.headers["content-type"] || "application/octet-stream").split(";")[0].trim();
      const arr = decodeToUint8Array(rp);
      const blob = new Blob([arr], { type: ct });
      const url = URL.createObjectURL(blob);
      blobUrlsRef.current.push(url);

      // Build variants
      const variants = new Set<string>();
      if (contentLocationRaw) {
        variants.add(contentLocationRaw);
        variants.add(contentLocationRaw.replace(/^<|>$/g, ""));
        try {
          const u = new URL(contentLocationRaw);
          variants.add(u.pathname + u.search + u.hash);
          variants.add(u.href);
        } catch (e) {
          try {
            variants.add(decodeURIComponent(contentLocationRaw));
          } catch {}
        }
      }
      if (contentIdRaw) {
        const cid = contentIdRaw.replace(/^<|>$/g, "");
        variants.add(cid);
        variants.add("cid:" + cid);
      }

      for (const v of variants) {
        if (!v) continue;
        const escaped = escapeRegex(v);
        const patterns = [
          new RegExp(`(src\\s*=\\s*")[^"]*${escaped}[^"]*(")`, "gi"),
          new RegExp(`(src\\s*=\\s*')[^']*${escaped}[^']*(')`, "gi"),
          new RegExp(`(href\\s*=\\s*")[^"]*${escaped}[^"]*(")`, "gi"),
          new RegExp(`(href\\s*=\\s*')[^']*${escaped}[^']*(')`, "gi"),
          new RegExp(`url\\((['"]?)[^)'"]*${escaped}[^)'"]*\\1\\)`, "gi"),
          new RegExp(escaped, "g"),
        ];
        for (const pat of patterns) {
          htmlText = htmlText.replace(pat, (match: string) => {
            return match.replace(new RegExp(escaped, "g"), url);
          });
        }
      }
    }

    const finalBlob = new Blob([htmlText], { type: "text/html" });
    const finalUrl = URL.createObjectURL(finalBlob);
    htmlBlobUrlRef.current = finalUrl;
    setPreviewReportUrl(finalUrl);
  };

  /* ------------------ Core: preview or download ------------------ */

  // replace your existing handleGenerate with this
  const handleGenerate = async (opts: { preview: boolean }) => {
    try {
      if (opts.preview) setPreviewLoading(true);

      // For preview: validate only the 'format' field so preview isn't blocked by other required params.
      // For download: validate the entire form.
      let values: any;
      if (opts.preview) {
        try {
          values = await form.validateFields(["format"]);
        } catch (validationErr) {
          // If format validation fails (very unlikely because initialValues has format),
          // stop preview silently (no console spam).
          setPreviewLoading(false);
          return;
        }
      } else {
        values = await form.validateFields();
      }

      const payload: GetHtmlReportPayload = {
        reportPath: reportConfig!.path,
        format: opts.preview ? "MHTML" : values.format,
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
          if (response instanceof Blob) {
            const txt = await response.text();
            await parseMHTMLAndBuildHtmlBlob(txt);
          } else if (response instanceof ArrayBuffer) {
            const txt = new TextDecoder().decode(response);
            await parseMHTMLAndBuildHtmlBlob(txt);
          } else if (typeof response === "string") {
            await parseMHTMLAndBuildHtmlBlob(response);
          } else if ((response as any).data && typeof (response as any).data === "string") {
            await parseMHTMLAndBuildHtmlBlob((response as any).data);
          } else {
            await parseMHTMLAndBuildHtmlBlob(String(response));
          }
        } finally {
          setPreviewLoading(false);
        }
        return;
      }

      // Download flow (unchanged)
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
    } catch (err: any) {
      // don't log "Form validation failed or cancelled" — keep it silent for validation errors
      if (err && err.errorFields) {
        // AntD form validation error object — just return silently
        if (opts.preview) setPreviewLoading(false);
        return;
      }

      if (opts.preview) setPreviewLoading(false);

      // API / download errors: show notification as before
      const errorMessage = err?.data?.en_Msg || err?.message || t("messages.reportDownloadFailed");
      console.error("Report error:", err);
      notification.error({ data: { en_Msg: errorMessage } }, t("messages.downloadFailed"));
    }
  };

  // Reset form
  const handleCancel = () => {
    setSelectedReport(undefined);
    form.resetFields();
    // cleanup preview
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
    if (htmlBlobUrlRef.current) {
      URL.revokeObjectURL(htmlBlobUrlRef.current);
      htmlBlobUrlRef.current = null;
      setPreviewReportUrl("");
    }
    setPreviewLoading(false);
  };

  // Handle report selection
  const handleReportSelect = (reportKey: string) => {
    setSelectedReport(reportKey);
    form.setFieldsValue({ format: "PDF" });
    // cleanup preview
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
    if (htmlBlobUrlRef.current) {
      URL.revokeObjectURL(htmlBlobUrlRef.current);
      htmlBlobUrlRef.current = null;
      setPreviewReportUrl("");
    }
    setPreviewLoading(false);
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
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleGenerate({ preview: false })}
                loading={isLoading}
              >
                {isLoading ? t("common.downloading") : t("common.download")}
              </Button>
              <Button icon={<EyeOutlined />} onClick={() => handleGenerate({ preview: true })}>
                {t("common.preview")}
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

          {/* Preview Area (hidden until previewReportUrl exists) */}
          <div style={{ marginTop: 16 }}>
            {previewLoading ? (
              <div style={{ padding: 24, textAlign: "center" }}>
                <Spin tip={t("messages.generatingPreview") || "Generating preview..."} />
              </div>
            ) : (
              previewReportUrl && (
                <div
                  // minimal styling for preview container as requested
                  style={{
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
              )
            )}
          </div>
        </Card>
      )}
    </Space>
  );
};

export default ReportsPage;
