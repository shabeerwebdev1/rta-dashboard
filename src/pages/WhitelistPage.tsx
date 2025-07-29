import React, { useState } from "react";
import {
  Table,
  Input,
  DatePicker,
  Button,
  Space,
  Typography,
  Avatar,
  Tooltip,
  Dropdown,
  Card,
  type MenuProps,
  message,
} from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  MoreOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import type { WhitelistRecord } from "../types";
import AddWhitelistModal from "../components/whitelist/AddWhitelistModal";
import type { WhitelistFormValues } from "../components/whitelist/WhitelistForm";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const dataSource: WhitelistRecord[] = [
  {
    key: "1",
    tradeLicenseName: "ABC Traders Pvt Ltd",
    licenseNumber: "TLN12345678",
    photo:
      "https://camo.githubusercontent.com/238055d74a4a963ecc573726f31395a1d523e264c3f17ed5316ca13e21c8a3dc/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f616c6f68652f617661746172732f706e672f6d656d6f5f32302e706e67",
    date: "01-07-2025",
  },
  {
    key: "2",
    tradeLicenseName: "XYZ Enterprises",
    licenseNumber: "TLN98765432",
    photo: "/images/user2.png",
    date: "01-07-2025",
  },
  {
    key: "3",
    tradeLicenseName: "EFG Logistics",
    licenseNumber: "TLN98777432",
    photo: "/images/user3.png",
    date: "01-07-2025",
  },
  {
    key: "4",
    tradeLicenseName: "Simple Corp",
    licenseNumber: "LN98765432",
    photo: "/images/user4.png",
    date: "01-07-2025",
  },
  {
    key: "5",
    tradeLicenseName: "XY Enterprises",
    licenseNumber: "TLN98765432",
    photo: "/images/user5.png",
    date: "01-07-2025",
  },
  {
    key: "1",
    tradeLicenseName: "ABC Traders Pvt Ltd",
    licenseNumber: "TLN12345678",
    photo:
      "https://camo.githubusercontent.com/238055d74a4a963ecc573726f31395a1d523e264c3f17ed5316ca13e21c8a3dc/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f616c6f68652f617661746172732f706e672f6d656d6f5f32302e706e67",
    date: "01-07-2025",
  },
  {
    key: "2",
    tradeLicenseName: "XYZ Enterprises",
    licenseNumber: "TLN98765432",
    photo: "/images/user2.png",
    date: "01-07-2025",
  },
  {
    key: "3",
    tradeLicenseName: "EFG Logistics",
    licenseNumber: "TLN98777432",
    photo: "/images/user3.png",
    date: "01-07-2025",
  },
  {
    key: "4",
    tradeLicenseName: "Simple Corp",
    licenseNumber: "LN98765432",
    photo: "/images/user4.png",
    date: "01-07-2025",
  },
  {
    key: "5",
    tradeLicenseName: "XY Enterprises",
    licenseNumber: "TLN98765432",
    photo: "/images/user5.png",
    date: "01-07-2025",
  },
];

const WhitelistPage: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"plate" | "trade" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showModal = (type: "plate" | "trade") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  const columns: ColumnsType<WhitelistRecord> = [
    {
      title: t("whitelist.tradeLicenseName"),
      width: "auto",
      align: "center",
      dataIndex: "tradeLicenseName",
      key: "tradeLicenseName",
      sorter: (a, b) => a.tradeLicenseName.localeCompare(b.tradeLicenseName),
    },
    {
      title: t("whitelist.licenseNumber"),
      width: "auto",
      align: "center",
      dataIndex: "licenseNumber",
      key: "licenseNumber",
    },
    {
      title: t("whitelist.photo"),
      width: 80,
      align: "center",
      dataIndex: "photo",
      key: "photo",
      render: (photoUrl) => <Avatar icon={<UserOutlined />} />,
    },
    {
      title: t("whitelist.date"),
      dataIndex: "date",
      key: "date",
      width: "auto",
      align: "center",
    },
    {
      title: t("whitelist.location"),
      key: "location",
      align: "center",
      render: () => (
        <Button style={{ padding: 0 }} type="link">
          {t("whitelist.viewMap")}
        </Button>
      ),
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: () => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                label: t("whitelist.edit"),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: t("whitelist.delete"),
              },
              {
                key: "view",
                icon: <EyeOutlined />,
                label: t("whitelist.view"),
              },
            ],
          }}
          placement="bottomLeft"
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const addMenuItems: MenuProps["items"] = [
    {
      key: "plate",
      label: "Add by Plate",
      onClick: () => showModal("plate"),
    },
    {
      key: "trade",
      label: "Add by Trade",
      onClick: () => showModal("trade"),
    },
  ];

  const handleFormSubmit = (values: WhitelistFormValues) => {
    console.log("Form Submitted:", values);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      handleModalClose();
      message.success(
        `Whitelist for ${values.plateNumber || values.tradeLicenseName} added successfully!`,
      );
    }, 1500);
  };

  return (
    <Card variant="outlined">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <Title className="no-margin" level={3}>
            {t("whitelist.title")}
          </Title>

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
          >
            <Dropdown.Button
              type="primary"
              icon={<PlusOutlined />}
              menu={{ items: addMenuItems }}
            >
              Add New Whitelist
            </Dropdown.Button>
          </div>
        </div>

        <Space
          className="custom-space"
          wrap
          style={{ width: "100%" }}
          size="middle"
        >
          <Input.Search
            placeholder={t("whitelist.searchPlaceholder")}
            style={{ minWidth: "300px" }}
          />
          <RangePicker />
          <Button type="primary" icon={<FilterOutlined />}></Button>
          <Button icon={<DownloadOutlined />}>
            {t("whitelist.downloadCsv")}
          </Button>
        </Space>

        <Table
          rowSelection={{ type: "checkbox" }}
          columns={columns}
          sticky={{ offsetHeader: 64 }}
          dataSource={dataSource}
          pagination={{
            defaultPageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
          }}
        />

        <AddWhitelistModal
          isOpen={isModalOpen}
          type={modalType}
          onClose={handleModalClose}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      </Space>
    </Card>
  );
};

export default WhitelistPage;
