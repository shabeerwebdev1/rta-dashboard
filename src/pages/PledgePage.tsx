import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Card,
  message,
  App,
  Tooltip,
  Input,
  DatePicker,
  Dropdown,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  MoreOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { usePage } from "../contexts/PageContext";
import PageLoader from "../components/common/PageLoader";
import PledgeViewDrawer from "../components/pledges/PledgeViewDrawer";
import {
  useGetPledgesQuery,
  useAddPledgeMutation,
  useUpdatePledgeMutation,
  useDeletePledgeMutation,
} from "../store/api/pledgeApi";
import dayjs, { type Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { exportToCsv } from "../utils/csvExporter";
import type { PledgeResponseDto, PledgeRequestDto } from "../types/api";
import AddPledgeModal from "../components/pledges/AddPledgeModal";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;

const PledgePage: React.FC = () => {
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const { Text: AntText } = Typography;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] =
    useState<PledgeResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [globalSearch, setGlobalSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const { data: pledges, isLoading, isError, error } = useGetPledgesQuery();
  const [addPledge] = useAddPledgeMutation();
  const [updatePledge] = useUpdatePledgeMutation();
  const [deletePledge, { isLoading: isDeleting }] = useDeletePledgeMutation();

  useEffect(() => {
    setPageTitle("Pledges");
  }, [setPageTitle]);

  useEffect(() => {
    if (isError) {
      message.error("Failed to load pledges: " + (error as any).toString());
    }
  }, [isError, error]);

  const showAddModal = () => {
    setModalMode("add");
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const showEditModal = (record: PledgeResponseDto) => {
    setModalMode("edit");
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const showViewDrawer = (record: PledgeResponseDto) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRecord(null);
  };

  const handleDelete = (record: PledgeResponseDto) => {
    modal.confirm({
      title: "Are you sure?",
      content: `Do you really want to delete pledge "${record.pledgeNumber}"?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deletePledge(record.id).unwrap();
          message.success(
            `Pledge "${record.pledgeNumber}" deleted successfully`
          );
        } catch (err) {
          message.error(`Failed to delete pledge: ${err}`);
        }
      },
    });
  };

  const handleFormSubmit = async (values: PledgeRequestDto) => {
    setIsSubmitting(true);
    try {
      const payload: PledgeRequestDto = {
        ...values,
        pledgeNumber: values.pledgeNumber || "",
        documentUploaded: true,
        documentPath: "",
      };

      if (modalMode === "add") {
        await addPledge(payload).unwrap();
        message.success("Pledge added successfully");
      } else if (selectedRecord) {
        await updatePledge({ id: selectedRecord.id, ...payload }).unwrap();
        message.success("Pledge updated successfully");
      }

      closeModal();
    } catch (err: any) {
      console.error("Submission error:", err);
      message.error(
        "Failed to submit form: " + (err?.data?.message || err.toString())
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleFormSubmit = async (values: PledgeRequestDto) => {
  //   setIsSubmitting(true);
  //   try {
  //     let payload: PledgeRequestDto = {
  //       ...values,
  //       pledgeNumber: values.pledgeNumber || "",
  //     };

  //     if (modalMode === "add") {
  //       payload = {
  //         ...payload,
  //         documentUploaded: true,
  //         documentPath: values.documentPath || "",
  //       };
  //     }

  //     if (modalMode === "edit") {
  //       if (values.documentPath) {
  //         payload = {
  //           ...payload,
  //           documentUploaded: true,
  //           documentPath: values.documentPath,
  //         };
  //       }
  //     }

  //     if (modalMode === "add") {
  //       await addPledge(payload).unwrap();
  //       message.success("Pledge added successfully");
  //     } else if (selectedRecord) {
  //       await updatePledge({ id: selectedRecord.id, ...payload }).unwrap();
  //       message.success("Pledge updated successfully");
  //     }

  //     closeModal();
  //   } catch (err: any) {
  //     console.error("Submission error:", err);
  //     message.error("Failed to submit form: " + (err?.data?.message || err.toString()));
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const filteredData = useMemo(() => {
    return pledges
      ?.filter((item) => {
        if (!globalSearch) return true;
        return Object.values(item).some((value) =>
          String(value).toLowerCase().includes(globalSearch.toLowerCase())
        );
      })
      .filter((item) => {
        if (!dateFilter || !dateFilter[0] || !dateFilter[1]) return true;
        const itemDate = dayjs(item.fromDate);
        return itemDate.isBetween(dateFilter[0], dateFilter[1], null, "[]");
      });
  }, [pledges, globalSearch, dateFilter]);

  const handleDownloadCsv = () => {
    const stats = {
      total: filteredData?.length || 0,
      active: filteredData?.filter((i) => i.plateStatus === "Active").length,
      expired: filteredData?.filter((i) => i.plateStatus === "Expired").length,
      pending: filteredData?.filter((i) => i.plateStatus === "Pending").length,
    };

    modal.confirm({
      title: "Download CSV",
      icon: <DownloadOutlined />,
      content: (
        <div>
          <p>Confirm export:</p>
          <ul>
            <li>
              <AntText strong>Total:</AntText> {stats.total}
            </li>
            <li>
              <AntText strong>Active:</AntText> {stats.active}
            </li>
            <li>
              <AntText strong>Expired:</AntText> {stats.expired}
            </li>
            <li>
              <AntText strong>Pending:</AntText> {stats.pending}
            </li>
          </ul>
        </div>
      ),
      okText: "Download",
      cancelText: "Cancel",
      onOk() {
        try {
          if (filteredData) {
            exportToCsv(filteredData as any, "pledges_export.csv");
            message.success("CSV downloaded successfully.");
          }
        } catch (error) {
          console.error("CSV Export Failed:", error);
          message.error("Failed to download CSV.");
        }
      },
    });
  };

  const columns: ColumnsType<PledgeResponseDto> = useMemo(
    () => [
      {
        title: "Pledge Number",
        dataIndex: "pledgeNumber",
        key: "pledgeNumber",
      },
      {
        title: "Trade License No",
        dataIndex: "tradeLicenseNumber",
        key: "tradeLicenseNumber",
      },
      {
        title: "Pledge Type",
        dataIndex: "pledgeType",
        key: "pledgeType",
      },
      {
        title: "",
        key: "action",
        fixed: "right",
        width: 100,
        align: "center",
        render: (_, record) => {
          const menuItems: MenuProps["items"] = [
            {
              key: "view",
              label: "View",
              icon: <EyeOutlined />,
              onClick: () => showViewDrawer(record),
            },
            {
              key: "edit",
              label: "Edit",
              icon: <EditOutlined />,
              onClick: () => showEditModal(record),
            },
            {
              key: "delete",
              label: "Delete",
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDelete(record),
            },
          ];

          return (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              disabled={isDeleting}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ],
    [isDeleting]
  );

  if (isLoading) return <PageLoader />;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card variant="borderless">
        <Space
          wrap
          style={{ width: "100%", justifyContent: "space-between" }}
          size="middle"
        >
          <Space wrap size="middle">
            <Input.Search
              placeholder="Search pledges..."
              style={{ minWidth: "300px" }}
              onSearch={(value) => setGlobalSearch(value)}
              onChange={(e) => setGlobalSearch(e.target.value)}
              allowClear
            />
            <RangePicker onChange={(dates) => setDateFilter(dates as any)} />
            <Tooltip
              title={tableSize === "middle" ? "Compact View" : "Standard View"}
            >
              <Button
                icon={
                  tableSize === "middle" ? (
                    <UnorderedListOutlined />
                  ) : (
                    <AppstoreOutlined />
                  )
                }
                onClick={() =>
                  setTableSize(tableSize === "middle" ? "small" : "middle")
                }
              />
            </Tooltip>
          </Space>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv}>
              Download CSV
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showAddModal}
            >
              Add New
            </Button>
          </Space>
        </Space>
      </Card>

      <Card variant="borderless" bodyStyle={{ padding: 0 }}>
        <Table
          rowSelection={{ type: "checkbox" }}
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          size={tableSize}
          scroll={{ x: 800 }}
          pagination={{
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

      <AddPledgeModal
        open={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialValues={selectedRecord ?? undefined}
        mode={modalMode}
      />
      <PledgeViewDrawer
        open={isDrawerOpen}
        record={selectedRecord}
        onClose={closeDrawer}
      />
    </Space>
  );
};

export default PledgePage;
