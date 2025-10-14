import React, { useEffect, useState } from "react";
import { Card, Button, Spin, Alert, Space, DatePicker, Select } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetHtmlReportMutation } from "../services/rtkApiFactory";
import { usePage } from "../contexts/PageContext";

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportHtmlViewer: React.FC = () => {
  const { setPageTitle } = usePage();

  const [reportHtml, setReportHtml] = useState("");
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [format, setFormat] = useState<string | undefined>(undefined); // no default value

  const [fetchReport, { isLoading }] = useGetHtmlReportMutation();

  const generateReport = async () => {
    setError("");
    setReportHtml("");

    try {
      const response = await fetchReport({
        reportPath: "test",
        format: format,
        parameters: {},
      }).unwrap();

      if (format === "PDF") {
        // Download PDF automatically
        const blob = new Blob([response], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${dayjs().format("DD-MM-YYYY-HH-mm-ss")}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Show HTML content
        setReportHtml(response);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    }
  };
  useEffect(() => {
    setPageTitle("Reports");
  }, [setPageTitle]);

  return (
    <div>
      <Card
        title="Parking Report Viewer"
        extra={
          <Space>
            <Button
              onClick={() => {
                setReportHtml("");
                setFormat(undefined);
              }}
            >
              Cancel
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={generateReport} loading={isLoading}>
              Generate Report
            </Button>
          </Space>
        }
      >
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          {/* Date Range */}
          <div style={{ width: "25%" }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Select Date Range:</label>
            <RangePicker
              value={dateRange as any}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              format="DD-MM-YYYY"
              style={{ width: "100%" }}
            />
          </div>

          {/* Format Selector */}
          <div style={{ width: "25%" }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Select Format:</label>
            <Select
              value={format}
              onChange={(val) => setFormat(val)}
              placeholder="Select Format"
              style={{ width: "100%" }}
            >
              <Option value="PDF">PDF</Option>
              <Option value="excel">Excel</Option>
            </Select>
          </div>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        {/* HTML content preview */}
        {reportHtml && format === "HTML4.0" && (
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: 6,
              padding: 24,
              minHeight: 400,
              overflow: "auto",
            }}
            dangerouslySetInnerHTML={{ __html: reportHtml }}
          />
        )}
      </Card>
    </div>
  );
};

export default ReportHtmlViewer;
