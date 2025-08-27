import React, { useEffect, useState } from "react";
import { Table, Tabs, Tooltip, Button, Card, Select, DatePicker, Space } from "antd";
import { ShiftPlanningConfig } from "../config/pageConfigs/shiftPlanningConfig";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Zone & Area mapping
const zoneMapping: Record<string, string> = {
  Z1: "Zone 1",
  Z2: "Zone 2",
  A1: "Gandhi Nagar",
  A2: "MG Road",
  A3: "Brigade Road",
  A4: "Koramangala",
  A5: "Indiranagar",
  A6: "Whitefield",
  A7: "HSR Layout",
  A8: "BTM Layout",
  A9: "Electronic City",
  A10: "Jayanagar",
  A11: "Bannerghatta",
  A12: "KR Puram",
  A13: "Yelahanka",
  A14: "Hebbal",
  A15: "Marathahalli",
  A16: "Vijayanagar",
  A17: "Basavanagudi",
  A18: "Rajajinagar",
  A19: "Ulsoor",
  A20: "Shivajinagar",
  A21: "Domlur",
  A22: "Banashankari",
  A23: "Malleswaram",
  A24: "Sadashivanagar",
  A25: "Frazer Town",
  A26: "Lingarajapuram",
  A27: "Cooke Town",
  A28: "Kengeri",
  A29: "Nagawara",
  A30: "Peenya",
  A31: "Chickpet",
};

// Sample data
const dataSource = [
  {
    key: 1,
    slno: 1,
    inspector: "Inspector",
    inspectorId: "INS001",
    month: "August",
    days: [
      "Z1-A1",
      "Z1-A2",
      "LV",
      "WO",
      "Z1-A3",
      "Z1-A4",
      "Z1-A5",
      "Z1-A6",
      "Z1-A7",
      "Z1-A8",
      "Z1-A9",
      "Z1-A10",
      "LV",
      "WO",
      "Z1-A11",
      "Z1-A12",
      "Z1-A13",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
      "Z1-A17",
      "Z1-A18",
      "LV",
      "WO",
      "Z1-A19",
      "Z1-A20",
      "Z1-A21",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
    ],
    status: "Published",
  },
  {
    key: 2,
    slno: 2,
    inspector: "Inspector",
    inspectorId: "INS002",
    month: "August",
    days: [
      "Z1-A4",
      "Z1-A3",
      "WO",
      "Z1-A5",
      "Z1-A6",
      "Z1-A7",
      "Z1-A8",
      "LV",
      "WO",
      "Z1-A9",
      "Z1-A10",
      "Z1-A11",
      "Z1-A12",
      "Z1-A13",
      "LV",
      "WO",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
      "Z1-A17",
      "Z1-A18",
      "Z1-A19",
      "Z1-A20",
      "LV",
      "WO",
      "Z1-A21",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
    ],
    status: "Draft",
  },
  {
    key: 3,
    slno: 3,
    inspector: "Inspector",
    inspectorId: "INS003",
    month: "August",
    days: [
      "Z1-A3",
      "Z1-A4",
      "Z1-A5",
      "Z1-A6",
      "LV",
      "WO",
      "Z1-A7",
      "Z1-A8",
      "Z1-A9",
      "Z1-A10",
      "Z1-A11",
      "LV",
      "WO",
      "Z1-A12",
      "Z1-A13",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
      "LV",
      "WO",
      "Z1-A17",
      "Z1-A18",
      "Z1-A19",
      "Z1-A20",
      "Z1-A21",
      "Z1-A22",
      "LV",
      "WO",
      "Z1-A23",
      "Z1-A24",
    ],
    status: "Published",
  },
  {
    key: 4,
    slno: 4,
    inspector: "Inspector",
    inspectorId: "INS004",
    month: "September",
    days: [
      "Z2-A1",
      "Z2-A2",
      "LV",
      "WO",
      "Z2-A3",
      "Z2-A4",
      "Z2-A5",
      "Z2-A6",
      "Z2-A7",
      "Z2-A8",
      "Z2-A9",
      "Z2-A10",
      "LV",
      "WO",
      "Z2-A11",
      "Z2-A12",
      "Z2-A13",
      "Z2-A14",
      "Z2-A15",
      "Z2-A16",
      "Z2-A17",
      "Z2-A18",
      "LV",
      "WO",
      "Z2-A19",
      "Z2-A20",
      "Z2-A21",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
    ],
    status: "Draft",
  },
  {
    key: 5,
    slno: 5,
    inspector: "Inspector",
    inspectorId: "INS005",
    month: "September",
    days: [
      "Z2-A4",
      "Z2-A3",
      "WO",
      "Z2-A5",
      "Z2-A6",
      "Z2-A7",
      "Z2-A8",
      "LV",
      "WO",
      "Z2-A9",
      "Z2-A10",
      "Z2-A11",
      "Z2-A12",
      "Z2-A13",
      "LV",
      "WO",
      "Z2-A14",
      "Z2-A15",
      "Z2-A16",
      "Z2-A17",
      "Z2-A18",
      "Z2-A19",
      "Z2-A20",
      "LV",
      "WO",
      "Z2-A21",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
    ],
    status: "Published",
  },
  {
    key: 6,
    slno: 6,
    inspector: "Inspector",
    inspectorId: "INS006",
    month: "October",
    days: [
      "Z1-A8",
      "Z1-A9",
      "LV",
      "WO",
      "Z1-A10",
      "Z1-A11",
      "Z1-A12",
      "Z1-A13",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
      "Z1-A17",
      "LV",
      "WO",
      "Z1-A18",
      "Z1-A19",
      "Z1-A20",
      "Z1-A21",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
      "LV",
      "WO",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "Z1-A30",
      "Z1-A31",
    ],
    status: "Draft",
  },
  {
    key: 7,
    slno: 7,
    inspector: "Inspector",
    inspectorId: "INS007",
    month: "October",
    days: [
      "Z2-A8",
      "Z2-A9",
      "LV",
      "WO",
      "Z2-A10",
      "Z2-A11",
      "Z2-A12",
      "Z2-A13",
      "Z2-A14",
      "Z2-A15",
      "Z2-A16",
      "Z2-A17",
      "LV",
      "WO",
      "Z2-A18",
      "Z2-A19",
      "Z2-A20",
      "Z2-A21",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
      "LV",
      "WO",
      "Z2-A26",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "Z2-A30",
      "Z2-A31",
    ],
    status: "Published",
  },
  {
    key: 8,
    slno: 8,
    inspector: "Inspector",
    inspectorId: "INS008",
    month: "November",
    days: [
      "Z1-A12",
      "Z1-A13",
      "LV",
      "WO",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
      "Z1-A17",
      "Z1-A18",
      "Z1-A19",
      "Z1-A20",
      "LV",
      "Z1-A21",
      "WO",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "LV",
      "WO",
      "Z1-A30",
      "Z1-A31",
      "Z1-A1",
      "Z1-A2",
      "Z1-A3",
      "Z1-A4",
    ],
    status: "Draft",
  },
  {
    key: 9,
    slno: 9,
    inspector: "Inspector",
    inspectorId: "INS009",
    month: "November",
    days: [
      "Z2-A12",
      "Z2-A13",
      "LV",
      "WO",
      "Z2-A14",
      "Z2-A15",
      "Z2-A16",
      "Z2-A17",
      "Z2-A18",
      "Z2-A19",
      "Z2-A20",
      "Z2-A21",
      "Z2-A31",
      "WO",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
      "Z2-A26",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "LV",
      "WO",
      "Z2-A30",
      "LV",
      "Z2-A1",
      "Z2-A2",
      "Z2-A3",
      "Z2-A4",
    ],
    status: "Published",
  },
  {
    key: 10,
    slno: 10,
    inspector: "Inspector",
    inspectorId: "INS010",
    month: "December",
    days: [
      "Z1-A16",
      "Z1-A17",
      "LV",
      "WO",
      "Z1-A18",
      "Z1-A19",
      "Z1-A20",
      "Z1-A21",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
      "LV",
      "WO",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "Z1-A30",
      "Z1-A31",
      "Z1-A1",
      "Z1-A2",
      "LV",
      "WO",
      "Z1-A3",
      "Z1-A4",
      "Z1-A5",
      "Z1-A6",
      "Z1-A7",
      "Z1-A8",
    ],
    status: "Draft",
  },
  {
    key: 11,
    slno: 11,
    inspector: "Inspector",
    inspectorId: "INS011",
    month: "December",
    days: [
      "Z2-A16",
      "Z2-A17",
      "LV",
      "WO",
      "Z2-A18",
      "Z2-A19",
      "Z2-A20",
      "Z2-A21",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
      "LV",
      "WO",
      "Z2-A26",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "Z2-A30",
      "Z2-A31",
      "Z2-A1",
      "Z2-A2",
      "LV",
      "WO",
      "Z2-A3",
      "Z2-A4",
      "Z2-A5",
      "Z2-A6",
      "Z2-A7",
      "Z2-A8",
    ],
    status: "Published",
  },
  {
    key: 12,
    slno: 12,
    inspector: "Inspector",
    inspectorId: "INS012",
    month: "January",
    days: [
      "Z1-A20",
      "Z1-A21",
      "LV",
      "WO",
      "Z1-A22",
      "Z1-A23",
      "Z1-A24",
      "Z1-A25",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "LV",
      "WO",
      "Z1-A30",
      "Z1-A31",
      "Z1-A1",
      "Z1-A2",
      "Z1-A3",
      "Z1-A4",
      "Z1-A5",
      "Z1-A6",
      "LV",
      "WO",
      "Z1-A7",
      "Z1-A8",
      "Z1-A9",
      "Z1-A10",
      "Z1-A11",
      "Z1-A12",
    ],
    status: "Draft",
  },
  {
    key: 13,
    slno: 13,
    inspector: "Inspector",
    inspectorId: "INS013",
    month: "January",
    days: [
      "Z2-A20",
      "Z2-A21",
      "LV",
      "WO",
      "Z2-A22",
      "Z2-A23",
      "Z2-A24",
      "Z2-A25",
      "Z2-A26",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "LV",
      "WO",
      "Z2-A30",
      "Z2-A31",
      "Z2-A1",
      "Z2-A2",
      "Z2-A3",
      "Z2-A4",
      "Z2-A5",
      "Z2-A6",
      "LV",
      "WO",
      "Z2-A7",
      "Z2-A8",
      "Z2-A9",
      "Z2-A10",
      "Z2-A11",
      "Z2-A12",
    ],
    status: "Published",
  },
  {
    key: 14,
    slno: 14,
    inspector: "Inspector",
    inspectorId: "INS014",
    month: "February",
    days: [
      "Z1-A24",
      "Z1-A25",
      "LV",
      "WO",
      "Z1-A26",
      "Z1-A27",
      "Z1-A28",
      "Z1-A29",
      "Z1-A30",
      "Z1-A31",
      "Z1-A1",
      "Z1-A2",
      "LV",
      "WO",
      "Z1-A3",
      "Z1-A4",
      "Z1-A5",
      "Z1-A6",
      "Z1-A7",
      "Z1-A8",
      "Z1-A9",
      "Z1-A10",
      "LV",
      "WO",
      "Z1-A11",
      "Z1-A12",
      "Z1-A13",
      "Z1-A14",
      "Z1-A15",
      "Z1-A16",
    ],
    status: "Draft",
  },
  {
    key: 15,
    slno: 15,
    inspector: "Inspector",
    inspectorId: "INS015",
    month: "February",
    days: [
      "Z2-A24",
      "Z2-A25",
      "LV",
      "WO",
      "Z2-A26",
      "Z2-A27",
      "Z2-A28",
      "Z2-A29",
      "Z2-A30",
      "Z2-A31",
      "Z2-A1",
      "Z2-A2",
      "LV",
      "WO",
      "Z2-A3",
      "Z2-A4",
      "Z2-A5",
      "Z2-A6",
      "Z2-A7",
      "Z2-A8",
      "Z2-A9",
      "Z2-A10",
      "LV",
      "WO",
      "Z2-A11",
      "Z2-A12",
      "Z2-A13",
      "Z2-A14",
      "Z2-A15",
      "Z2-A16",
    ],
    status: "Inspector",
  },
];

// Cell color styles
// Cell color styles
const getCellStyle = (value: string) => {
  if (value === "LV") return { backgroundColor: "#ffccc7", color: "#a8071a", fontWeight: 600 };
  if (value === "WO") return { backgroundColor: "#fff7e6", color: "#d46b08", fontWeight: 600 };
  if (value.startsWith("Z")) return { backgroundColor: "#e6f7ff", color: "#0050b3", fontWeight: 500 };
  return {};
};

// Tooltip + styled cell renderer
const renderDayCell = (value: string, dayIndex: number) => {
  let tooltipText = "";
  if (value.includes("-")) {
    const [zone, area] = value.split("-");
    tooltipText = `${zoneMapping[zone] || zone}, ${zoneMapping[area] || area}`;
  } else if (value === "LV") {
    tooltipText = "Leave";
  } else if (value === "WO") {
    tooltipText = "Week Off";
  } else {
    tooltipText = "Not Assigned";
  }

  return (
    <Tooltip title={tooltipText}>
      <div
        style={{
          padding: "4px 8px",
          textAlign: "center",
          borderRadius: 4,
          ...getCellStyle(value),
        }}
      >
        {value}
      </div>
    </Tooltip>
  );
};

export default function ShiftPlanning() {
  const [activeTab, setActiveTab] = useState("1");
  const [inspector, setInspector] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("August");
  const { setPageTitle } = usePage();
  const { t } = useTranslation();

  useEffect(() => {
    // ✅ bind page title from config + translation
    setPageTitle(t(ShiftPlanningConfig.title));
  }, [setPageTitle, t]);

  // Dynamic columns (Day 1 - 30)
  const dayColumns = Array.from({ length: 30 }, (_, i) => ({
    title: `Day ${i + 1}`,
    dataIndex: ["days", i],
    key: `day${i + 1}`,
    render: (value: string) => renderDayCell(value || "NA", i),
    width: 100,
  }));

  const columns = [
    { title: "Sl No", dataIndex: "slno", key: "slno", fixed: "left", width: 80 },
    { title: "Inspector", dataIndex: "inspector", key: "inspector", fixed: "left", width: 150 },
    { title: "Month", dataIndex: "month", key: "month", width: 120 },
    ...dayColumns,
  ];

  const handleSubmit = () => {
    console.log("Inspector:", inspector);
    console.log("Date Range:", dateRange);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card style={{ marginBottom: 20 }}>
        {" "}
        <Space size="large">
          {" "}
          <Select
            placeholder="Select Inspector"
            style={{ width: 200 }}
            value={inspector}
            onChange={(val) => setInspector(val)}
          >
            {" "}
            <Select.Option value="Inspector">Inspector </Select.Option>{" "}
            <Select.Option value="Inspector">Inspector </Select.Option>{" "}
          </Select>{" "}
          <RangePicker onChange={(val) => setDateRange(val)} />{" "}
          <Button type="primary" onClick={handleSubmit}>
            {" "}
            Submit{" "}
          </Button>{" "}
        </Space>{" "}
      </Card>
      <Tabs
        type="card"
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarExtraContent={
          <Button type="primary" size="middle">
            Publish
          </Button>
        }
      >
        <TabPane tab="All" key="1">
          <Table dataSource={dataSource} columns={columns} scroll={{ x: 3200, y: 700 }} bordered pagination={false} />
        </TabPane>

        <TabPane tab="Monthly" key="2">
          <Select
            placeholder="Select Month"
            style={{ width: 200, marginBottom: 16 }}
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(val)}
          >
            {[...new Set(dataSource.map((d) => d.month))].map((month) => (
              <Select.Option key={month} value={month}>
                {month}
              </Select.Option>
            ))}
          </Select>

          <Table
            dataSource={dataSource.filter((d) => d.month === selectedMonth)}
            columns={columns}
            scroll={{ x: 3200, y: 700 }}
            bordered
            pagination={false}
          />
        </TabPane>

        <TabPane tab="Inspector Wise" key="3">
          <Select
            placeholder="Select Inspector"
            style={{ width: 200, marginBottom: 16 }}
            value={inspector}
            onChange={(val) => setInspector(val)}
          >
            {[...new Set(dataSource.map((d) => d.inspector))].map((insp) => (
              <Select.Option key={insp} value={insp}>
                {insp}
              </Select.Option>
            ))}
          </Select>

          <Table
            dataSource={inspector ? dataSource.filter((d) => d.inspector === inspector) : []}
            columns={columns}
            scroll={{ x: 3200, y: 700 }}
            bordered
            pagination={false}
          />
        </TabPane>
      </Tabs>
    </Space>
  );
}
