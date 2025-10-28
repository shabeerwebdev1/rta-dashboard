/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Space,
  Card,
  Input,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Select,
  App,
  DatePicker,
  Spin,
  Tag,
  Upload,
  Image,
} from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined, DownloadOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetDisputesQuery,
  useAddDisputeMutation,
  useUpdateDisputeMutation,
  useLazyGetLookupsQuery,
  useLazyGetDisputeByIdQuery,
} from "../services/rtkApiFactory";
import { getFileUrl, useUploadFilesMutation } from "../services/fileApi";
import { exportToCsv } from "../utils/csvExporter";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import { pageConfigs } from "../config/pageConfigs";
import dayjs from "dayjs";
import DataTableWrapper from "../components/common/DataTableWrapper";
import DisputeViewModal from "../components/dispute/DisputeViewModal";
import { usePermission } from "../hooks/usePermission";
import { useAuth } from "../contexts/AuthContext";

const { Option } = Select;
const pageKey = "dispute-management";

const filterOptionsByCategory = (options: any[], categoryId: number) => {
  return options.filter((option) => option.categoryId === categoryId);
};

const columnToCategoryMap: Record<string, number> = {
  department: 1000,
  payment_Type: 1100,
  dispute_Status: 1002,
  dispute_Reason: 1600,
  dispute_SubReason: 1600,
};

const DisputeManagementPage: React.FC = () => {
  const { canCreate, canEdit } = usePermission();
  const menuName = "Dispute";
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey];
  const { user } = useAuth();

  const {
    apiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    setDateRange,
    clearFilter,
    clearAll,
    state,
    setColumnFilter,
  } = useTableParams(config.searchConfig!);
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [disputeSubReasonOptions, setDisputeSubReasonOptions] = useState<any[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(state.searchValue);
  const debouncedSearchValue = useDebounce(searchValue, 500);

  //state to maintain the rows data for downlaoding
  const [selectedRows, setSelectedRows] = useState([]);

  // NEW: State for My Approvals filter
  const [showMyApprovals, setShowMyApprovals] = useState(false);

  // Modified API call to include assignedTo filter
  const { data, isLoading, isFetching, refetch } = useGetDisputesQuery(
    {
      ...apiParams,
      // Add assignedTo filter to API params when showMyApprovals is true
      ...(showMyApprovals && user?.userGUID && { assignedTo: user.userGUID }),
    },
    {
      refetchOnMountOrArgChange: true,
    },
  );

  const [addDispute, { isLoading: isAdding }] = useAddDisputeMutation();
  const [updateDispute, { isLoading: isUpdating }] = useUpdateDisputeMutation();
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetDisputeById] = useLazyGetDisputeByIdQuery();

  const [uploadFiles, { isLoading: isUploadingFiles }] = useUploadFilesMutation();

  const searchInputRef = useRef<any>(null);

  const handleShowMyApprovals = () => {
    if (!user?.userGUID) {
      notification.error({ data: { en_Msg: "User information not available" } }, "Error");
      return;
    }

    if (showMyApprovals) {
      // Clear the filter
      setShowMyApprovals(false);
      // Also clear any column filter for assignedTo
      clearFilter("column", "assignedTo");
    } else {
      // Apply the filter
      setShowMyApprovals(true);
    }
  };

  // NEW: Function to check if row is assigned to current user
  const isRowAssignedToUser = (record: any) => {
    if (!user?.userGUID) return false;
    return record.assignedTo === user.userGUID;
  };

  // NEW: Custom row class name function
  const getRowClassName = (record: any, index: number) => {
    return isRowAssignedToUser(record) ? "assigned-to-user-row" : "";
  };

  // NEW: Filter data locally as a fallback (in case API doesn't support assignedTo filter)
  const filteredData = useMemo(() => {
    if (showMyApprovals && user?.userGUID && data?.data) {
      return data.data.filter((record: any) => record.assignedTo === user.userGUID);
    }
    return data?.data || [];
  }, [data?.data, showMyApprovals, user?.userGUID]);

  // NEW: Get total count for pagination
  const totalCount = useMemo(() => {
    if (showMyApprovals && user?.userGUID) {
      return filteredData.length;
    }
    return data?.total || 0;
  }, [data?.total, filteredData.length, showMyApprovals, user?.userGUID]);

  const getBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const getSourceUserName = () => {
    return i18n.language === "ar"
      ? localStorage.getItem("displayNameAr") || ""
      : localStorage.getItem("displayNameEn") || "";
  };

  const getLabelFromValue = (value: number, options: any[], i18n: any) => {
    const option = options.find((opt) => opt.value === value);
    if (!option) return value;
    return i18n.language === "ar" ? option.labelAr : option.labelEn;
  };

  const getDisputeReasonByCode = React.useCallback(
    (value: number) => {
      if (!lookupOptions) return null;

      const option = lookupOptions.find((opt) => opt.value === value);
      if (option) {
        return {
          categoryName: option.categoryName,
          englishText: option.labelEn,
          arabicText: option.labelAr,
          fullData: option,
        };
      }
      return null;
    },
    [lookupOptions],
  );

  const handleDisputeReasonChange = (categoryId: number) => {
    const subReasons = filterOptionsByCategory(lookupOptions, categoryId);
    const subOptions = subReasons.map((sub: any) => ({
      label: i18n.language === "ar" ? sub.labelAr : sub.labelEn,
      value: sub.value,
    }));
    setDisputeSubReasonOptions(subOptions);
    form.setFieldsValue({ DisputeSubReason: undefined });
  };

  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const categoryIds = Object.values(columnToCategoryMap);
      const result = await triggerGetLookups([...categoryIds, 16001, 16002]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      notification.error({ data: { en_Msg: "Failed to load dropdown options" } }, "Load Failed");
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const departmentOptions = useMemo(() => {
    const filtered = filterOptionsByCategory(lookupOptions, 1000);
    return filtered.map((option) => ({
      label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      value: option.value,
    }));
  }, [lookupOptions, i18n.language]);

  const paymentTypeOptions = useMemo(() => {
    const filtered = filterOptionsByCategory(lookupOptions, 1100);
    return filtered.map((option) => ({
      label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      value: option.value,
    }));
  }, [lookupOptions, i18n.language]);

  const disputeReasonOptions = useMemo(() => {
    const categories = new Map();
    lookupOptions.forEach((option) => {
      if ((option.categoryId === 16001 || option.categoryId === 16002) && !categories.has(option.categoryId)) {
        categories.set(option.categoryId, {
          label: option.categoryName,
          value: option.categoryId,
        });
      }
    });
    const mainReasons = Array.from(categories.values());
    return mainReasons;
  }, [lookupOptions]);

  const disputeStatusEnum = useMemo(
    () => [
      { value: 1, labelEn: "Pending", labelAr: "قيد الانتظار" },
      { value: 2, labelEn: "Approved", labelAr: "موافقة" },
      { value: 3, labelEn: "Rejected", labelAr: "مرفوض" },
      { value: 4, labelEn: "In Review", labelAr: "قيد المراجعة" },
    ],
    [],
  );

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title, i18n.language]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  useEffect(() => {
    setSearchValue(state.searchValue);
  }, [state.searchValue]);

  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") {
      setSearchValue("");
    }
    if (type === "column" && key === "assignedTo") {
      setShowMyApprovals(false);
    }

    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    setShowMyApprovals(false);
    clearAll();
  };

  const handleModalOpen = async (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);

    const sourceUserName = getSourceUserName();
    form.setFieldValue("SourceUser", sourceUserName);

    if (mode === "edit" && record) {
      try {
        const result = await triggerGetDisputeById(record.dispute_Id).unwrap();
        if (result.data) {
          let fileList: any[] = [];
          if (result.data.evidencePath) {
            const files = result.data.evidencePath.split(";");
            fileList = files.map((file: string, index: number) => ({
              uid: String(index),
              name: file.split("/").pop() || `file-${index}`,
              status: "done",
              url: getFileUrl(file),
            }));
          }

          form.setFieldsValue({
            FineId: result.data.fineId || result.data.fine_Number,
            Name: result.data.name,
            Department: result.data.department,
            Payment_Type: result.data.payment_Type,
            Comments: result.data.comments,
            crm_Ref: result.data.crm_Ref,
            Email: result.data.email,
            Phone: result.data.phone,
            Address: result.data.address,
            SourceUser: sourceUserName,
            Source: result.data.source || "sTafteesh_parking",
            DisputeMainReason: result.data.disputeMainReason || result.data.dispute_Reason,
            DisputeSubReason: result.data.disputeSubReason || result.data.dispute_SubReason,
            ActualDisputeDate: result.data.actualDisputeDate
              ? dayjs(result.data.actualDisputeDate, "YYYY-MM-DD")
              : null,
            Evidence: fileList,
          });

          if (result.data.disputeMainReason || result.data.dispute_Reason) {
            const mainReasonId = result.data.disputeMainReason || result.data.dispute_Reason;
            handleDisputeReasonChange(mainReasonId);
            setTimeout(() => {
              form.setFieldsValue({
                DisputeSubReason: result.data.disputeSubReason || result.data.dispute_SubReason,
              });
            }, 100);
          }
        }
      } catch (error) {
        notification.error({ data: { en_Msg: "Failed to load dispute details" } }, "Load Failed");
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setDisputeSubReasonOptions([]);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const formData = new FormData();

      formData.append("FineId", values.FineId || "");
      formData.append("Department", values.Department || "0");
      formData.append("Payment_Type", values.Payment_Type || "0");
      formData.append("Comments", values.Comments || "");
      formData.append("crm_Ref", values.crm_Ref || "");
      formData.append("Name", values.Name || "");
      formData.append("Email", values.Email || "");
      formData.append("Phone", values.Phone || "");
      formData.append("Address", values.Address || "");
      formData.append("ActualDisputeDate", values.ActualDisputeDate ? values.ActualDisputeDate.toISOString() : "");
      formData.append("DisputeMainReason", values.DisputeMainReason || "0");
      formData.append("DisputeSubReason", values.DisputeSubReason || "0");

      const displayName =
        i18n.language === "ar"
          ? localStorage.getItem("displayNameAr") || ""
          : localStorage.getItem("displayNameEn") || "";
      formData.append("SourceUser", displayName);
      formData.append("Source", values.Source || "sTafteesh_parking");

      const prepareFilesForUpload = async (fileList: any[]) => {
        const files: File[] = [];
        for (const file of fileList) {
          if (file.originFileObj) {
            files.push(file.originFileObj);
          } else if (file.url) {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const fileName = file.name || "file";
            files.push(new File([blob], fileName, { type: blob.type }));
          }
        }
        return files;
      };

      if (values.Evidence && values.Evidence.length > 0) {
        const files = await prepareFilesForUpload(values.Evidence);
        files.forEach((file) => {
          formData.append("Evidence", file, file.name);
        });
      } else {
        formData.append("Evidence", new Blob([]), "empty.txt");
      }

      let response;
      if (modalMode === "add") {
        response = await addDispute(formData).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
      } else {
        formData.append("dispute_Id", selectedRecord.dispute_Id);
        response = await updateDispute(formData).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
      }

      handleModalClose();
      refetch();
    } catch (err: any) {
      notification.error(err, "Operation Failed");
    }
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      notification.error({ data: { en_Msg: t("messages.selectRows") } }, t("messages.selectRows"));
      return;
    }

    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      content: t("messages.csvConfirmContent"),
      okText: t("common.ok"),
      cancelText: t("common.cancel"),
      onOk: () => {
        try {
          const dataToExport = showMyApprovals ? filteredData : data?.data || [];
          //const selectedRows = dataToExport.filter((item: any) => selectedRowKeys.includes(item.dispute_Id));

          if (selectedRows.length === 0) {
            notification.error({ data: { en_Msg: t("messages.noDataToExport") } }, t("messages.exportFailed"));
            return;
          }

          // ✅ CSV column mapping similar to Whitelist format
          const csvData = selectedRows.map((item: any, index: number) => ({
            "sl.No": index + 1,
            [t("form.fineNumber")]: item.fine_Number || item.fineId || "-",
            [t("form.name")]: item.name || "-",
            [t("form.department")]: getLabelFromValue(
              item.department,
              filterOptionsByCategory(lookupOptions, 1000),
              i18n,
            ),
            [t("form.paymentType")]: getLabelFromValue(
              item.payment_Type,
              filterOptionsByCategory(lookupOptions, 1100),
              i18n,
            ),

            [t("form.status")]: disputeStatusEnum.find((s) => s.value === item.dispute_Status)
              ? i18n.language === "ar"
                ? disputeStatusEnum.find((s) => s.value === item.dispute_Status)?.labelAr
                : disputeStatusEnum.find((s) => s.value === item.dispute_Status)?.labelEn
              : "-",
            [t("form.actualDisputeDate")]: item.actualDisputeDate
              ? dayjs(item.actualDisputeDate).format("DD-MM-YYYY")
              : "-",
            [t("form.crmReference")]: item.crm_Ref || "-",
            [t("form.email")]: item.email || "-",
            [t("form.phoneNumber")]: item.phone || "-",
            [t("form.address")]: item.address || "-",
          }));

          // ✅ File name in Whitelist-style
          const filename =
            i18n.language === "ar"
              ? `النزاعات${showMyApprovals ? "_المعينة_لي" : ""}.csv`
              : `Disputes${showMyApprovals ? "_My_Approvals" : ""}.csv`;

          exportToCsv(csvData, filename);

          notification.success(
            { data: { en_Msg: t("messages.csvDownloaded", { count: selectedRows.length }) } },
            t("messages.exportSuccess"),
          );

          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch (error) {
          notification.error({ data: { en_Msg: t("messages.exportError") } }, t("messages.exportFailed"));
        }
      },
    });
  };

  const columnLabels = useMemo(
    () =>
      Object.fromEntries(
        config.formConfig.fields
          .map((f) => [f.name, t(f.label)])
          .concat(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
      ),
    [t, config, i18n.language],
  );

  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "dispute_Status") {
          return {
            ...column,
            filterable: true,
            render: (value: number) => {
              const label =
                i18n.language === "ar"
                  ? disputeStatusEnum.find((s) => s.value === value)?.labelAr
                  : disputeStatusEnum.find((s) => s.value === value)?.labelEn;

              switch (value) {
                case 1:
                  return <Tag color="orange">{label}</Tag>;
                case 2:
                  return <Tag color="green">{label}</Tag>;
                case 3:
                  return <Tag color="red">{label}</Tag>;
                case 4:
                  return <Tag color="blue">{label}</Tag>;
                default:
                  return <Tag>{label || "-"}</Tag>;
              }
            },
            filters: disputeStatusEnum.map((status) => ({
              text: i18n.language === "ar" ? status.labelAr : status.labelEn,
              value: status.value,
            })),
            onFilter: (value: any, record: any) => record.dispute_Status === value,
          };
        }

        if (column.key === "dispute_Reason" || column.key === "dispute_SubReason") {
          return {
            ...column,
            render: (value: any) => {
              const reason = getDisputeReasonByCode(value);
              if (reason) {
                return i18n.language === "ar" ? reason.arabicText : reason.englishText;
              }
              return value;
            },
          };
        }

        const categoryId = columnToCategoryMap[column.key];
        if (categoryId) {
          const options = filterOptionsByCategory(lookupOptions, categoryId);
          return {
            ...column,
            render: (value: any) => getLabelFromValue(value, options, i18n),
          };
        }
        return column;
      }),
    }),
    [config.tableConfig, lookupOptions, i18n, disputeStatusEnum, getDisputeReasonByCode],
  );

  const actionMenuItems = (record: any) => [
    {
      key: "view",
      label: t("common.view"),
      icon: <EyeOutlined />,
      onClick: () => handleView(record),
    },
    {
      key: "edit",
      label: t("common.edit"),
      icon: <EditOutlined />,
      onClick: () => handleModalOpen("edit", record),
      disabled: !canEdit(menuName) || record.dispute_Status === 2 || record.dispute_Status === 3,
    },
  ];

  const handleSearchKeyChange = (newKey: string) => {
    const currentValue = searchValue;
    setTimeout(() => {
      setSearchValue("");
    }, 0);
    if (currentValue.trim()) {
      setGlobalSearch(state.searchKey, currentValue);
    }
    setGlobalSearch(newKey, "");
  };

  const searchAddon = (
    <Select value={state.searchKey} onChange={handleSearchKeyChange} style={{ width: 150 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  const statusLabels: Record<number, string> = Object.fromEntries(
    disputeStatusEnum.map((status) => [status.value, i18n.language === "ar" ? status.labelAr : status.labelEn]),
  );

  return (
    <>
      {/* <style>{`
        .ant-table-tbody > tr.assigned-to-user-row > td {
          background-color: #e6f7ff !important;
        }
       
      `}</style> */}

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <StatsDisplay statsConfig={config.statsConfig} data={filteredData} loading={isLoading} />
        <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
            <Col>
              <Space>
                <Input
                  ref={searchInputRef}
                  addonBefore={searchAddon}
                  placeholder={t("common.searchPlaceholder")}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  style={{ width: 450 }}
                  allowClear
                />
                <span>{t("common.filterBycreatedDate")}</span>

                <DatePicker.RangePicker
                  value={state.dateRange}
                  format={"DD-MM-YYYY"}
                  placeholder={[t("placeholders.startDate"), t("placeholders.endDate")]}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                />
                <Button
                  icon={<UserOutlined />}
                  onClick={handleShowMyApprovals}
                  className={showMyApprovals ? "my-approvals-btn active" : "my-approvals-btn"}
                  type={showMyApprovals ? "primary" : "default"}
                >
                  {t("common.showMyApprovals")}
                </Button>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0}>
                  {t("common.downloadCsv")}
                </Button>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleModalOpen("add")}
                  disabled={!canCreate(menuName)}
                >
                  {t("common.addNew")}
                </Button>
              </Space>
            </Col>
          </Row>
          <ActiveFiltersDisplay
            state={state}
            onClearFilter={handleClearFilter}
            onClearAll={handleClearAll}
            columnLabels={columnLabels}
            lookupOptions={lookupOptions}
            getLabelFromValue={getLabelFromValue}
            statusLabels={statusLabels}
            showMyApprovals={showMyApprovals}
            onClearMyApprovals={() => {
              setShowMyApprovals(false);
              clearFilter("column", "assignedTo");
            }}
          />
        </Card>

        <DataTableWrapper
          pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
          data={filteredData} // Use filtered data
          total={totalCount} // Use calculated total count
          isLoading={isLoading || isFetching}
          apiParams={apiParams}
          handleTableChange={handleTableChange}
          handlePaginationChange={handlePaginationChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: React.Key[], selectedRows: any[]) => {
              setSelectedRowKeys(keys);

              setSelectedRows((prev) => {
                // Remove rows that are no longer selected
                const remaining = prev.filter((p) => keys.includes(p.id));

                // Add newly selected rows (avoid duplicates)
                const newSelected = selectedRows.filter((r) => !remaining.some((p) => p.id === r.id));

                return [...remaining, ...newSelected];
              });
            },
          }}
          actionMenuItems={actionMenuItems}
          tableSize={tableSize}
          rowKey={config.tableConfig.rowKey}
          state={state}
          lookupOptions={lookupOptions}
          getLabelFromValue={getLabelFromValue}
          filterOptions={{
            dispute_Status: disputeStatusEnum.map((status) => ({
              text: i18n.language === "ar" ? status.labelAr : status.labelEn,
              value: status.value,
            })),
          }}
          rowClassName={getRowClassName}
        />

        <Modal
          open={isModalOpen}
          title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", { entity: t(config.name.singular) })}
          onCancel={handleModalClose}
          width="720px"
          footer={[
            <Button key="reset" onClick={() => form.resetFields()}>
              {t("common.reset")}
            </Button>,
            <Button key="back" onClick={handleModalClose}>
              {t("common.cancel")}
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={isAdding || isUpdating || isLoadingLookups || isUploading}
              onClick={() => form.submit()}
            >
              {t(modalMode === "add" ? "common.submit" : "common.update")}
            </Button>,
          ]}
        >
          <Spin spinning={isLoadingLookups}>
            <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="FineId"
                    label={t("form.fineNumber")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.fineNumber") }) }]}
                    validateFirst
                  >
                    <Input placeholder={t("placeholders.fineNumber")} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="Name"
                    label={t("form.name")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.name") }) }]}
                  >
                    <Input placeholder={t("placeholders.name")} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="Department"
                    label={t("form.department")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.department") }) }]}
                  >
                    <Select
                      placeholder={t("placeholders.department")}
                      loading={isLoadingLookups}
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) => option?.label.toLowerCase().includes(input.toLowerCase())}
                      options={departmentOptions}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="DisputeMainReason"
                    label={t("form.disputereason")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.disputereason") }) }]}
                  >
                    <Select
                      placeholder={t("placeholders.reason")}
                      loading={isLoadingLookups}
                      showSearch
                      optionFilterProp="label"
                      onChange={handleDisputeReasonChange}
                      filterOption={(input, option) => option?.label.toLowerCase().includes(input.toLowerCase())}
                      options={disputeReasonOptions}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="DisputeSubReason"
                    label={t("form.disputesubreason")}
                    rules={[
                      { required: true, message: t("validation.required", { field: t("form.disputesubreason") }) },
                    ]}
                  >
                    <Select
                      placeholder={t("placeholders.subreason")}
                      loading={isLoadingLookups}
                      showSearch
                      optionFilterProp="label"
                      disabled={disputeSubReasonOptions.length === 0}
                      filterOption={(input, option) => option?.label.toLowerCase().includes(input.toLowerCase())}
                      options={disputeSubReasonOptions}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="Payment_Type"
                    label={t("form.paymentType")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.paymentType") }) }]}
                  >
                    <Select
                      placeholder={t("placeholders.paymentType")}
                      loading={isLoadingLookups}
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) => option?.label.toLowerCase().includes(input.toLowerCase())}
                      options={paymentTypeOptions}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="crm_Ref"
                    label={t("form.crmReference")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.crmReference") }) }]}
                  >
                    <Input placeholder={t("placeholders.crmReference")} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="Email"
                    label={t("form.email")}
                    rules={[
                      {
                        required: true,
                        message: t("validation.required", { field: t("form.email") }),
                      },
                      {
                        type: "email",
                        message: t("validation.invalidEmail"),
                      },
                    ]}
                  >
                    <Input placeholder={t("placeholders.email")} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="Phone"
                    label={t("form.phoneNumber")}
                    rules={[
                      {
                        required: true,
                        message: t("validation.required", { field: t("form.phoneNumber") }),
                      },
                      {
                        pattern: /^[0-9]+$/,
                        message: t("validation.onlyNumbers"),
                      },
                    ]}
                  >
                    <Input placeholder={t("placeholders.phoneNumber")} maxLength={10} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="ActualDisputeDate"
                    label={t("form.actualDisputeDate")}
                    rules={[
                      { required: true, message: t("validation.required", { field: t("form.actualDisputeDate") }) },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD-MM-YYYY"
                      disabledDate={(current) => current && current > dayjs().endOf("day")}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="Address"
                    label={t("form.address")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.address") }) }]}
                  >
                    <Input.TextArea placeholder={t("placeholders.address")} rows={2} maxLength={200} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="Comments"
                    label={t("form.comments")}
                    rules={[{ required: true, message: t("validation.required", { field: t("form.comments") }) }]}
                  >
                    <Input.TextArea placeholder={t("placeholders.comments")} rows={2} maxLength={500} />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    name="Evidence"
                    label={t("form.evidence")}
                    valuePropName="fileList"
                    getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                  >
                    <Upload
                      listType="picture-card"
                      beforeUpload={() => false}
                      multiple={true}
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,image/jpeg,image/png"
                      onPreview={async (file) => {
                        let src = file.url;
                        if (!src && file.originFileObj) {
                          src = await getBase64(file.originFileObj);
                        }
                        setPreviewImage(src || "");
                        setPreviewOpen(true);
                      }}
                    >
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>{t("form.upload")}</div>
                      </div>
                    </Upload>
                  </Form.Item>

                  {previewImage && (
                    <Image
                      style={{ display: "none" }}
                      preview={{
                        visible: previewOpen,
                        src: previewImage,
                        onVisibleChange: (visible) => setPreviewOpen(visible),
                        afterClose: () => setPreviewImage(""),
                      }}
                      src={previewImage}
                    />
                  )}
                </Col>
              </Row>
            </Form>
          </Spin>
        </Modal>

        {viewRecord && (
          <DisputeViewModal
            open={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setViewRecord(null);
            }}
            disputeId={viewRecord.dispute_Id}
            onStatusUpdate={refetch}
          />
        )}
      </Space>
    </>
  );
};

export default DisputeManagementPage;
