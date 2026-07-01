/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, Switch, Tag, Typography } from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import { useDebounce } from "../hooks/useDebounce";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetCriteriaWeightsQuery,
  useGetCriteriaGroupsQuery,
  useUpdateCriteriaGroupMutation,
  useAddCriteriaGroupMutation,
  useLazyGetCriteriaGroupByIdQuery,
} from "../services/rtkApiFactory";
import StatsDisplay from "../components/common/StatsDisplay";
import ActiveFiltersDisplay from "../components/common/ActiveFiltersDisplay";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { usePermission } from "../hooks/usePermission";
import CriteriaGroupViewDrawer from "../components/criteriaGroup/CriteriaGroupViewDrawer";
import { criteriaGroupConfig } from "../config/pageConfigs/criteriaGroupConfig";

const { Option } = Select;
const menuName = "CriteriaGroup";

const CriteriaGroupPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const notification = useAppNotification();
  const { canCreate, canEdit } = usePermission();
  const [form] = Form.useForm();

  const config = criteriaGroupConfig;

  // ── Table params — same pattern as WhitelistPlatesPage ────────────────────
  const {
    apiParams: rawApiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    clearFilter,
    clearAll,
    state,
  } = useTableParams(config.searchConfig!);

  const apiParams = {
    PageNumber: rawApiParams.PageNumber || 1,
    PageSize: rawApiParams.PageSize || 10,
    ...rawApiParams,
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [tableSize] = useState<"middle" | "small">("small");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState<string>(state.searchValue);

  const debouncedSearchValue = useDebounce(searchValue, 500);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useGetCriteriaGroupsQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });

  const { data: criteriaResponse, isLoading: isLoadingCriteria } = useGetCriteriaWeightsQuery({
    PageNumber: 1,
    PageSize: 1000,
  });

  const [addCriteriaGroup, { isLoading: isAdding }] = useAddCriteriaGroupMutation();
  const [updateCriteriaGroup, { isLoading: isUpdating }] = useUpdateCriteriaGroupMutation();
  const [triggerGetById, { data: singleRecordData, isSuccess: isSingleRecordSuccess }] =
    useLazyGetCriteriaGroupByIdQuery();

  // ── Derived data ───────────────────────────────────────────────────────────
  const groupsData = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data || [];
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return Array.isArray(data) ? data.length : data.totalCount || 0;
  }, [data]);

  const metadata = useMemo(() => {
    if (!data || Array.isArray(data)) return {};
    return {
      totalRecords: data.totalRecords,
      active: data.active,
      inActive: data.inActive,
    };
  }, [data]);

  const criteriaOptions = useMemo(() => {
    const items = Array.isArray(criteriaResponse?.data) ? criteriaResponse.data : [];
    return items
      .filter((item: any) => item.active !== false)
      .map((item: any) => {
        const name =
          i18n.language === "ar" ? item.descriptionAr || item.descriptionEn : item.descriptionEn || item.descriptionAr;
        const weightSuffix = item.weight != null ? ` (${item.weight}%)` : "";
        return { label: `${name}${weightSuffix}`, value: item.id };
      })
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
  }, [criteriaResponse, i18n.language]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setPageTitle(t("page.title.criteriaGroup"));
  }, [setPageTitle, t, i18n.language]);

  useEffect(() => {
    setGlobalSearch(state.searchKey, debouncedSearchValue);
  }, [debouncedSearchValue, state.searchKey, setGlobalSearch]);

  useEffect(() => {
    if (isSingleRecordSuccess && singleRecordData?.data) {
      setViewRecord(singleRecordData.data);
      setIsDrawerOpen(true);
    }
  }, [isSingleRecordSuccess, singleRecordData]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleClearFilter = (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => {
    if (type === "search") setSearchValue("");
    clearFilter(type, key, value);
  };

  const handleClearAll = () => {
    setSearchValue("");
    clearAll();
  };

  const handleModalOpen = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
    if (mode === "edit" && record) {
      form.setFieldsValue({
        groupName_EN: record.groupName_EN,
        groupName_AR: record.groupName_AR,
        isActive: record.isActive,
        criteriaWeightIds: record.details?.map((d: any) => d.id) ?? [],
      });
    } else {
      form.setFieldsValue({ isActive: true, criteriaWeightIds: [] });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    try {
      let response;
      if (modalMode === "add") {
        response = await addCriteriaGroup(values).unwrap();
        notification.success(response, t("messages.addSuccess", { entity: t(config.name.singular) }));
        refetch();
      } else {
        response = await updateCriteriaGroup({ ...values, id: selectedRecord.id }).unwrap();
        notification.success(response, t("messages.updateSuccess", { entity: t(config.name.singular) }));
        refetch();
      }
      handleModalClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  const handleView = (record: any) => {
    triggerGetById(record.id);
  };

  // ── Column labels for ActiveFiltersDisplay ─────────────────────────────────
  const columnLabels = useMemo(
    () => Object.fromEntries(config.tableConfig.columns.map((c) => [c.key, t(c.title)])),
    [t, config.tableConfig.columns, i18n.language],
  );

  // ── Enhanced table config with renders ────────────────────────────────────
  const enhancedTableConfig = useMemo(
    () => ({
      ...config.tableConfig,
      columns: config.tableConfig.columns.map((column) => {
        if (column.key === "details") {
          return {
            ...column,
            render: (_: any, record: any) => (
              <Space size={4} wrap>
                {(record.details ?? []).map((d: any) => (
                  <Tag key={d.id} color="blue">
                    {i18n.language === "ar" ? d.descriptionAr : d.descriptionEn}
                    <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                      ({d.weight}%)
                    </Typography.Text>
                  </Tag>
                ))}
              </Space>
            ),
          };
        }
        if (column.key === "isActive") {
          return {
            ...column,
            render: (value: boolean) =>
              value ? (
                <Tag color="green">{t("common.active") || "Active"}</Tag>
              ) : (
                <Tag color="default">{t("common.inactive") || "Inactive"}</Tag>
              ),
          };
        }
        return column;
      }),
    }),
    [config.tableConfig, i18n.language, t],
  );

  // ── Action menu — same as WhitelistPlates ──────────────────────────────────
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
      disabled: !canEdit(menuName),
    },
  ];

  // ── Search addon — same as WhitelistPlates ─────────────────────────────────
  const searchAddon = (
    <Select value={state.searchKey} onChange={(key) => setGlobalSearch(key, state.searchValue)} style={{ width: 160 }}>
      {config.searchConfig?.globalSearchKeys.map((key) => (
        <Option key={key} value={key}>
          {columnLabels[key]}
        </Option>
      ))}
    </Select>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* ── Stats row ── */}
      <StatsDisplay statsConfig={config.statsConfig} data={groupsData} metadata={metadata} loading={isLoading} />

      {/* ── Toolbar card ── */}
      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 10 }}>
          <Col>
            <Space>
              <Input
                addonBefore={searchAddon}
                placeholder={t("common.searchPlaceholder")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 450 }}
                allowClear
              />
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleModalOpen("add")}
              disabled={!canCreate(menuName)}
            >
              {t("common.addNew")}
            </Button>
          </Col>
        </Row>

        <ActiveFiltersDisplay
          state={state}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          columnLabels={columnLabels}
          lookupOptions={[]}
          getLabelFromValue={() => ""}
        />
      </Card>

      {/* ── Data table ── */}
      <DataTableWrapper
        pageConfig={{ ...config, tableConfig: enhancedTableConfig }}
        data={groupsData}
        total={totalCount}
        isLoading={isLoading || isFetching}
        apiParams={apiParams}
        handleTableChange={handleTableChange}
        handlePaginationChange={handlePaginationChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
        }}
        actionMenuItems={actionMenuItems}
        tableSize={tableSize}
        state={state}
        lookupOptions={[]}
        getLabelFromValue={() => ""}
      />

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", { entity: t(config.name.singular) })}
        onCancel={handleModalClose}
        width={680}
        footer={[
          <Button key="reset" onClick={() => form.resetFields()}>
            {t("common.reset")}
          </Button>,
          <Button key="cancel" onClick={handleModalClose}>
            {t("common.cancel")}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isAdding || isUpdating}
            disabled={!canCreate(menuName)}
            onClick={() => form.submit()}
          >
            {modalMode === "add" ? t("common.submit") : t("common.update")}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isActive: true, criteriaWeightIds: [] }}
          onFinish={handleFormSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="groupName_EN"
                label={t("form.groupNameEn")}
                rules={[
                  {
                    required: true,
                    message: t("validation.required", { field: t("form.groupNameEn") }),
                  },
                ]}
              >
                <Input placeholder={t("placeholders.groupNameEn")} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="groupName_AR"
                label={t("form.groupNameAr")}
                rules={[
                  {
                    required: true,
                    message: t("validation.required", { field: t("form.groupNameAr") }),
                  },
                ]}
              >
                <Input placeholder={t("placeholders.groupNameAr")} dir="rtl" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="criteriaWeightIds"
                label={t("form.criteriaSelection")}
                rules={[
                  {
                    required: true,
                    message: t("validation.selectRequired", {
                      field: t("form.criteriaSelection"),
                    }),
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  loading={isLoadingCriteria}
                  placeholder={t("placeholders.selectCriteria")}
                  optionFilterProp="label"
                  maxTagCount="responsive"
                  filterOption={(input, option) =>
                    String(option?.label || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={criteriaOptions}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="isActive" label={t("form.isActive")} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── View Drawer ── */}
      {viewRecord && (
        <CriteriaGroupViewDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setViewRecord(null);
          }}
          record={viewRecord}
          config={config}
        />
      )}
    </Space>
  );
};

export default CriteriaGroupPage;
