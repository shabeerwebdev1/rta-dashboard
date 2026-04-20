/* eslint-disable no-shadow-restricted-names */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Space, Card, Input, Button, Modal, Form, Row, Col, Select, App, Tag, Switch, message, theme } from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined, FileTextOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import StatsDisplay from "../components/common/StatsDisplay";
import { criteriaConfig, staticCriteriaData } from "../config/pageConfigs/criteriaConfig";
import CriteriaViewDrawer from "../components/Criteria/CriteriaViewDrawer";

const { Option } = Select;
const { useToken } = theme;

const CriteriaPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const { token } = useToken();

  // Data state (static only)
  const [criteria, setCriteria] = useState<any[]>(staticCriteriaData);
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);

  // page title
  useEffect(() => {
    setPageTitle(t(criteriaConfig.title));
  }, [setPageTitle, t]);

  // lookups from config
  const lookups = (criteriaConfig as any).lookups || {};

  // helper to get label (EN/AR) from lookups
  const getLabel = (value: string, category: string) => {
    const list = lookups[category] || [];
    const item = list.find((i: any) => i.value === value);
    if (!item) return value;
    return i18n.language === "ar" ? item.labelAr : item.labelEn;
  };

  // filtered list
  const filtered = useMemo(() => {
    let list = [...criteria];

    if (searchValue) {
      const q = searchValue.toLowerCase();
      list = list.filter(
        (c) =>
          String(c.descriptionEn || "")
            .toLowerCase()
            .includes(q) ||
          String(c.descriptionAr || "")
            .toLowerCase()
            .includes(q),
      );
    }

    if (filters.isActive !== undefined && filters.isActive !== null && filters.isActive !== "") {
      list = list.filter((c) => c.isActive === filters.isActive);
    }

    return list;
  }, [criteria, searchValue, filters]);

  // stats metadata (simple)
  const statsMetadata = useMemo(
    () => ({ total: criteria.length, active: criteria.filter((c) => c.isActive).length }),
    [criteria],
  );

  // open add/edit modal
  const openModal = (mode: "add" | "edit", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
    if (mode === "edit" && record) {
      form.setFieldsValue({
        descriptionEn: record.descriptionEn,
        descriptionAr: record.descriptionAr,
        weight: record.weight,
        objectiveType: record.objectiveType,
        ratingScale: record.ratingScale,
        isActive: record.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  // submit form
  const onFinish = (values: any) => {
    if (modalMode === "add") {
      const nextId = criteria.length ? Math.max(...criteria.map((c) => c.id)) + 1 : 1;
      const newItem = {
        id: nextId,
        ...values,
      };
      setCriteria((prev) => [newItem, ...prev]);
      message.success(t("messages.addSuccess", { entity: t(criteriaConfig.name.singular) }));
    } else if (modalMode === "edit" && selectedRecord) {
      setCriteria((prev) => prev.map((c) => (c.id === selectedRecord.id ? { ...c, ...values } : c)));
      message.success(t("messages.updateSuccess", { entity: t(criteriaConfig.name.singular) }));
    }
    closeModal();
  };

  // view
  const handleView = (record: any) => {
    setViewRecord(record);
    setIsViewOpen(true);
  };

  // table columns rendering (simple html table)
  const tableColumns = [
    { key: "descriptionEn", title: t("form.descriptionEn") },
    { key: "descriptionAr", title: t("form.descriptionAr") },
    // { key: "objectiveType", title: t("form.objectiveType") },
    { key: "weight", title: t("form.weight") },
    // { key: "ratingScale", title: t("form.ratingScale") },
    { key: "isActive", title: t("form.isActive") },
    { key: "actions", title: t("common.actions") },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <StatsDisplay statsConfig={criteriaConfig.statsConfig} data={criteria} metadata={statsMetadata} loading={false} />

      <Card bordered={false} bodyStyle={{ padding: "16px 16px 0 16px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Input
                placeholder={t("common.searchPlaceholder")}
                value={searchValue}
                allowClear
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 300 }}
              />
              {/* <Select
                allowClear
                placeholder={t("form.objectiveType")}
                style={{ width: 180 }}
                onChange={(val) => setFilters((prev: any) => ({ ...prev, objectiveType: val }))}
              >
                {lookups.objectiveTypes?.map((ot: any) => (
                  <Option key={ot.value} value={ot.value}>
                    {i18n.language === "ar" ? ot.labelAr : ot.labelEn}
                  </Option>
                ))}
              </Select> */}

              <Select
                allowClear
                placeholder={t("form.isActive")}
                style={{ width: 150 }}
                onChange={(val) => setFilters((prev: any) => ({ ...prev, isActive: val }))}
              >
                <Option value={true}>{t("common.active")}</Option>
                <Option value={false}>{t("common.inactive")}</Option>
              </Select>
            </Space>
          </Col>

          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("add")}>
                {t("common.addNew")}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: token.colorFillAlter }}>
              {tableColumns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: 12,
                    textAlign: "left",
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    color: token.colorText,
                    fontWeight: 600,
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                <td style={{ padding: 12, color: token.colorText }}>{row.descriptionEn}</td>
                <td style={{ padding: 12, color: token.colorText }}>{row.descriptionAr}</td>
                {/* <td style={{ padding: 12 }}>
                  <Tag>{getLabel(row.objectiveType, "objectiveTypes")}</Tag>
                </td> */}
                <td style={{ padding: 12, color: token.colorText }}>
                  <strong>{row.weight}%</strong>
                </td>
                {/* <td style={{ padding: 12, color: token.colorText }}>{getLabel(row.ratingScale, "ratingScales")}</td> */}
                <td style={{ padding: 12 }}>
                  {row.isActive ? (
                    <Tag color="green">{t("common.active")}</Tag>
                  ) : (
                    <Tag color="red">{t("common.inactive")}</Tag>
                  )}
                </td>
                <td style={{ padding: 12 }}>
                  <Space>
                    <Button icon={<EyeOutlined />} size="small" onClick={() => handleView(row)}>
                      {t("common.view")}
                    </Button>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal("edit", row)}>
                      {t("common.edit")}
                    </Button>
                  </Space>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 30 }}>
            <FileTextOutlined style={{ fontSize: 36, color: token.colorTextDisabled }} />
            <p style={{ color: token.colorTextSecondary }}>{t("common.noData")}</p>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        open={isModalOpen}
        title={t(modalMode === "add" ? "page.addTitle" : "page.editTitle", { entity: t(criteriaConfig.name.singular) })}
        onCancel={() => closeModal()}
        width={criteriaConfig.formConfig?.modalWidth || 600}
        footer={[
          <Button key="back" onClick={() => closeModal()}>
            {t("common.cancel")}
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {t(modalMode === "add" ? "common.submit" : "common.update")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="descriptionEn" label={t("form.descriptionEn")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.descriptionEn")} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="descriptionAr" label={t("form.descriptionAr")} rules={[{ required: true }]}>
                <Input placeholder={t("placeholders.descriptionAr")} dir="rtl" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="weight" label={t("form.weight")} rules={[{ required: true }]}>
                <Input type="number" min={0} max={100} placeholder="0-100" />
              </Form.Item>
            </Col>

            {/* <Col span={12}>
              <Form.Item name="objectiveType" label={t("form.objectiveType")} rules={[{ required: true }]}>
                <Select placeholder={t("placeholders.selectObjective")}>
                  {lookups.objectiveTypes?.map((ot: any) => (
                    <Option key={ot.value} value={ot.value}>
                      {i18n.language === "ar" ? ot.labelAr : ot.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col> */}

            {/* <Col span={12}>
              <Form.Item name="ratingScale" label={t("form.ratingScale")} rules={[{ required: true }]}>
                <Select placeholder={t("placeholders.selectRatingScale")}>
                  {lookups.ratingScales?.map((rs: any) => (
                    <Option key={rs.value} value={rs.value}>
                      {i18n.language === "ar" ? rs.labelAr : rs.labelEn}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col> */}

            <Col span={12}>
              <Form.Item name="isActive" label={t("form.isActive")} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <CriteriaViewDrawer open={isViewOpen} onClose={() => setIsViewOpen(false)} record={viewRecord} />
    </Space>
  );
};

export default CriteriaPage;
