/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Modal, Card, Row, Col, Typography, Divider, Button, Input, Select, Empty, Spin, Tag, Form, App } from "antd";
import { CloseOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  useLazyGetDisputeByIdQuery,
  useUpdateDisputeStatusMutation,
  useLazyGetLookupsQuery,
  useLazyGetReviewHistoryQuery, // Add this import
} from "../../services/rtkApiFactory";
import { useAppNotification } from "../../utils/notificationManager";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import {
  useGetActiveShiftsQuery,
  useGetInspectionAttachmentsQuery,
  getMobileFileUrl,
} from "../../services/rtkApiFactory";
import { Image, Space, theme } from "antd";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../common/ArcGISMap";
import { useAuth } from "../../contexts/AuthContext";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { PLATE_COLOR, PLATE_TYPE_SHORT } from "../../config/pageConfigs/finesConfig";
import { plateSources } from "../../config/pageConfigs/finesConfig";
import UAEPlate from "../UAEPlate";
import {
  useLazyGetReviewOptionsQuery,
  useLazyGetEntityHistoryQuery, // add this
} from "../../services/rtkApiFactory";
import ReviewTimeline from "../ReviewTimeline"; // Add this import

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DisputeViewModalProps {
  open: boolean;
  onClose: () => void;
  record?: any;
  onStatusUpdate?: () => void;
}

const DisputeViewModal: React.FC<DisputeViewModalProps> = ({ open, onClose, record, onStatusUpdate }) => {
  const { t, i18n } = useTranslation();
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const notification = useAppNotification();
  const [form] = Form.useForm();
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<__esri.MapView | null>(null);

  const [triggerGetDisputeById, { data: disputeData, isLoading }] = useLazyGetDisputeByIdQuery();
  const [updateDisputeStatus, { isLoading: isUpdating }] = useUpdateDisputeStatusMutation();
  const [triggerGetLookups] = useLazyGetLookupsQuery();

  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [storedDisputeId, setStoredDisputeId] = useState<string>("");
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const { data: activeShiftsData, isLoading: isLoadingSupervisors } = useGetActiveShiftsQuery({});
  const [getReviewOptions, { data: reviewResponse, isLoading: loadingOptions }] = useLazyGetReviewOptionsQuery();
  const [getEntityHistory, { data: entityHistory = [], isLoading: entityHistoryLoading }] =
    useLazyGetEntityHistoryQuery();

  // Add review history API call like in ParkonicViewDrawer
  const [getReviewHistory, { data: reviewHistory = [], isLoading: historyLoading }] = useLazyGetReviewHistoryQuery();

  const [comments, setComments] = useState("");

  const rcwuri = record?.$SKWorkItemData;
  const disputeId = disputeData?.data?.disputeCode || record?.disputeCode || record?.EntityGUID;
  // Dispute page

  const { user } = useAuth();

  const isRTL = i18n.language === "ar";

  const formatDate = (value: string | number) => {
    if (!value) return "";

    return dayjs(value)
      .locale(i18n.language)
      .format(isRTL ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
  };

  const reviewOptions = useMemo(() => {
    return reviewResponse?.ActivityOption
      ? [...reviewResponse.ActivityOption].sort((a: any, b: any) => a.SequenceNo - b.SequenceNo)
      : [];
  }, [reviewResponse]);

  const normalizeGuid = (guid: string | null | undefined): string | null => {
    if (!guid) return null;
    return guid.toLowerCase().trim();
  };

  const getUserRoleGUID = () => {
    if (user?.roleGUID) {
      return normalizeGuid(user.roleGUID);
    }
    const roleGUIDFromStorage = localStorage.getItem("roleGUID");
    if (roleGUIDFromStorage) {
      return normalizeGuid(roleGUIDFromStorage);
    }
    return null;
  };

  useEffect(() => {
    if (!open) return;

    const idToLoad = rcwuri ? record?.EntityGUID : disputeId;
    if (!idToLoad) return;

    triggerGetDisputeById(idToLoad).then((result) => {
      const disputeCode = result.data?.data?.disputeCode;
      const entityCode = result.data?.data?.entityCode || "parking-parkonic-fine-dispute";

      if (disputeCode) {
        setStoredDisputeId(disputeCode);

        // Inbox flow
        if (rcwuri) {
          getReviewHistory({
            entityCode,
            entityId: disputeCode,
          });
        }
        // Dispute page flow
        else {
          getEntityHistory({
            entityCode,
            entityId: disputeCode,
          });
        }
      }
    });
  }, [open]);

  const userRoleGUID = getUserRoleGUID();

  const dcRoleGUID = "efb6ef6a-128b-4dd9-9641-2b04205c8cf8".toLowerCase();
  const seniorSupervisorRoleGUID = "9e8331a6-3828-421b-9c5d-835f7b6f8710".toLowerCase();
  const supervisorRoleGUID = "137db453-07cc-4218-9ef8-3aa236d9e951".toLowerCase();
  const directorRoleGUID = "6d20d858-1128-4cd2-af7e-e8eb3c4bf887".toLowerCase();
  const managerRoleGUID = "33fa8623-20f8-417a-b655-18da372f18bd".toLowerCase();

  const supervisorRoleGUIDs = [seniorSupervisorRoleGUID, supervisorRoleGUID, managerRoleGUID, directorRoleGUID];

  const isDCRole = userRoleGUID === dcRoleGUID;
  const isManagerRole = userRoleGUID === managerRoleGUID;
  const isSeniorSupervisorRole = userRoleGUID === seniorSupervisorRoleGUID;
  const isSupervisorRoleOnly = userRoleGUID === supervisorRoleGUID;
  const isDirectorRole = userRoleGUID === directorRoleGUID;

  const assignmentRoles = [
    { roleGUID: dcRoleGUID, roleName: "Dispute Coordinator", roleNameAr: "منسق المنازعات" },
    { roleGUID: seniorSupervisorRoleGUID, roleName: "Senior Supervisor", roleNameAr: "المشرف الأول" },
    { roleGUID: supervisorRoleGUID, roleName: "Supervisor", roleNameAr: "المشرف" },
    { roleGUID: managerRoleGUID, roleName: "Manager", roleNameAr: "المدير" },
    { roleGUID: directorRoleGUID, roleName: "Director", roleNameAr: "المدير العام" },
  ];

  const getRoleNameByGUID = (guid: string | null) => {
    if (!guid) return "";
    const normalizedGuid = normalizeGuid(guid);

    for (const role of assignmentRoles) {
      if (normalizeGuid(role.roleGUID) === normalizedGuid) {
        return isRTL ? role.roleNameAr : role.roleName;
      }
    }

    if (activeShiftsData) {
      const employee = activeShiftsData.find(
        (emp: any) =>
          normalizeGuid(emp.employeeId) === normalizedGuid || normalizeGuid(emp.roleGUID) === normalizedGuid,
      );

      if (employee && employee.roleGUID) {
        const empRoleGUID = normalizeGuid(employee.roleGUID);
        if (empRoleGUID === dcRoleGUID) return isRTL ? "منسق المنازعات" : "Dispute Coordinator";
        if (empRoleGUID === supervisorRoleGUID) return isRTL ? "المشرف" : "Supervisor";
        if (empRoleGUID === seniorSupervisorRoleGUID) return isRTL ? "المشرف الأول" : "Senior Supervisor";
        if (empRoleGUID === managerRoleGUID) return isRTL ? "المدير" : "Manager";
        if (empRoleGUID === directorRoleGUID) return isRTL ? "المدير العام" : "Director";
      }
    }

    return "";
  };

  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    disputeData?.data?.fineDetails?.inspectionId
      ? {
          inspectionGUID: disputeData.data.fineDetails.inspectionId,
          entityCode: disputeData.data.fineDetails.entityCode,
        }
      : skipToken,
  );

  const getSupervisorName = (id: string) => {
    if (!activeShiftsData || !id) return isRTL ? "النظام" : "System";
    const sup = activeShiftsData.find((s: any) => normalizeGuid(s.employeeId) === normalizeGuid(id));
    return sup ? sup.employeeName : isRTL ? "النظام" : "System";
  };

  const disputeStatusEnum = useMemo(
    () => [
      { value: 1, labelEn: "Pending", labelAr: "قيد الانتظار", color: "orange" },
      { value: 2, labelEn: "Approved", labelAr: "موافقة", color: "green" },
      { value: 3, labelEn: "Rejected", labelAr: "مرفوض", color: "red" },
      { value: 4, labelEn: "In Review", labelAr: "قيد المراجعة", color: "blue" },
    ],
    [],
  );

  const getAllSupervisors = useMemo(() => {
    if (!activeShiftsData) return [];

    return activeShiftsData
      .filter((emp: any) => {
        const roleGUID = normalizeGuid(emp.roleGUID);
        return roleGUID === supervisorRoleGUID || roleGUID === seniorSupervisorRoleGUID;
      })
      .map((emp: any) => ({
        value: emp.employeeId,
        label: emp.employeeName,
        role:
          normalizeGuid(emp.roleGUID) === supervisorRoleGUID
            ? isRTL
              ? "المشرف"
              : "Supervisor"
            : isRTL
              ? "المشرف الأول"
              : "Senior Supervisor",
        roleGUID: emp.roleGUID,
      }));
  }, [activeShiftsData, isRTL]);

  const seniorSupervisorOptions = useMemo(() => {
    if (!activeShiftsData) return [];

    const allOption = {
      value: "all",
      label: isRTL ? "كل المشرفين الأولين" : "All Senior Supervisors",
      role: isRTL ? "الكل" : "All",
      roleGUID: seniorSupervisorRoleGUID,
    };

    const seniors = activeShiftsData
      .filter((emp: any) => normalizeGuid(emp.roleGUID) === seniorSupervisorRoleGUID)
      .map((emp: any) => ({
        value: emp.employeeId,
        label: emp.employeeName,
        role: isRTL ? "المشرف الأول" : "Senior Supervisor",
        roleGUID: emp.roleGUID,
      }));

    return [allOption, ...seniors];
  }, [activeShiftsData, isRTL]);

  const showSupervisorDropdown = useMemo(() => {
    if (!isDCRole || !selectedAction) return false;

    const reviewStatus = selectedAction.ReviewStatus?.toLowerCase() || "";
    return reviewStatus.includes("rfi") || reviewStatus.includes("request for information");
  }, [isDCRole, selectedAction]);

  const showSeniorSupervisorDropdown = useMemo(() => {
    return selectedAction?.ReviewStatusCode === "send-to-senior-supervisor-review";
  }, [selectedAction]);

  const getSupervisorDropdownOptions = useMemo(() => {
    if (!showSupervisorDropdown) return [];

    const reviewStatus = selectedAction?.ReviewStatus?.toLowerCase() || "";
    let allRoleGUID = "";
    let allLabel = "";

    if (reviewStatus.includes("supervisor") && !reviewStatus.includes("senior")) {
      allRoleGUID = supervisorRoleGUID;
      allLabel = isRTL ? "كل المشرفين" : "All Supervisors";
    } else if (reviewStatus.includes("senior")) {
      allRoleGUID = seniorSupervisorRoleGUID;
      allLabel = isRTL ? "كل المشرفين الأولين" : "All Senior Supervisors";
    }

    const allOption = {
      value: "all",
      label: allLabel,
      role: isRTL ? "الكل" : "All",
      roleGUID: allRoleGUID,
    };

    let filteredSupervisors = [];
    if (reviewStatus.includes("supervisor") && !reviewStatus.includes("senior")) {
      filteredSupervisors = getAllSupervisors.filter((sup) => sup.role === (isRTL ? "المشرف" : "Supervisor"));
    } else if (reviewStatus.includes("senior")) {
      filteredSupervisors = getAllSupervisors.filter(
        (sup) => sup.role === (isRTL ? "المشرف الأول" : "Senior Supervisor"),
      );
    }

    return [allOption, ...filteredSupervisors];
  }, [showSupervisorDropdown, selectedAction, getAllSupervisors, isRTL]);

  const handleActionChange = (value: string) => {
    const opt = reviewOptions.find((o: any) => o.ActivityOptionGUID === value);
    setSelectedAction(opt);

    form.setFieldsValue({
      action: value,
      assignedSupervisor: undefined,
      assignedSeniorSupervisor: undefined,
    });
  };

  // defalut senior supervisor is the reviewer of the dispute if they are a senior supervisor and have an active shift
  const getDefaultSeniorSupervisor = () => {
    if (!activeShiftsData || !dispute?.fineDetails?.reviewerName) return null;

    const reviewerName = dispute.fineDetails.reviewerName.trim().toLowerCase();

    const match = activeShiftsData.find((emp: any) => {
      const empName = emp.employeeName?.trim().toLowerCase();
      return empName && empName.includes(reviewerName) && normalizeGuid(emp.roleGUID) === seniorSupervisorRoleGUID;
    });

    return match ? match.employeeId : null;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedAction) {
        notification.error(isRTL ? "الرجاء اختيار إجراء" : "Please select an action");
        return;
      }

      let assignedToValue: string | null = null;

      // Supervisor assignment (RFI)
      if (showSupervisorDropdown) {
        const selectedOption = getSupervisorDropdownOptions.find((o) => o.value === values.assignedSupervisor);

        if (!selectedOption) {
          notification.error(isRTL ? "اختيار المشرف غير صالح" : "Invalid supervisor selection");
          return;
        }

        // "All" means no specific employee
        assignedToValue = selectedOption.value === "all" ? null : selectedOption.value;
      }

      // Senior supervisor assignment
      if (showSeniorSupervisorDropdown) {
        const selectedOption = seniorSupervisorOptions.find((o) => o.value === values.assignedSeniorSupervisor);

        if (!selectedOption) {
          notification.error(isRTL ? "اختيار المشرف غير صالح" : "Invalid selection");
          return;
        }

        assignedToValue = selectedOption.value === "all" ? null : selectedOption.value;
      }

      // Workflow automatic assignments
      if (selectedAction.ReviewStatusCode === "send-back") {
        assignedToValue = dcRoleGUID;
      }

      if (selectedAction.ReviewStatusCode === "review") {
        assignedToValue = dcRoleGUID;
      }

      if (selectedAction.ReviewStatusCode === "accept" && isDCRole) {
        assignedToValue = managerRoleGUID;
      }

      if (selectedAction.ReviewStatusCode === "approve" && isManagerRole) {
        assignedToValue = directorRoleGUID;
      }

      if (selectedAction.ReviewStatusCode === "approve" && isDirectorRole) {
        assignedToValue = null;
      }

      // Final payload (correct format)
      const payload = {
        dispute_Id: disputeId,
        review: {
          reviewStatusCode: selectedAction.ReviewStatusCode,
          activityCode: record?.ActivityCode ?? record?.nvarchar3,
          entityCode: record?.EntityCode ?? record?.nvarchar12,
          entityGUID: record?.EntityGUID ?? record?.nvarchar2,
          activityOptionGUID: selectedAction.ActivityOptionGUID,
          reviewComments: values.review_Comments || "",
          rcwuri: rcwuri || "",
        },
        assignedTo: assignedToValue,
      };

      console.log("Submitting payload:", payload);

      const response = await updateDisputeStatus(payload).unwrap();

      notification.success(response, t("messages.updateSuccess", { entity: t("sidebar.dispute") }));

      triggerGetDisputeById(storedDisputeId);
      form.resetFields();
      setSelectedAction(null);
      onStatusUpdate?.();

      // Refresh review history after status update
      if (disputeData?.data?.disputeCode) {
        getReviewHistory({
          entityCode: "parking-parkonic-fine-dispute",
          entityId: disputeData.data.disputeCode,
        });
      }

      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;
      notification.error(error, isRTL ? "فشل الإجراء" : "Action Failed");
    }
  };

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const categoryIds = [1000, 1100, 1002, 1500, 16001, 16002, 1600];
      const result = await triggerGetLookups(categoryIds).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const getVehicleLabel = (type: "color" | "plateType" | "source", value: number) => {
    if (type === "color") return PLATE_COLOR[value] || value;
    if (type === "plateType") return PLATE_TYPE_SHORT[value] || value;
    if (type === "source") return (isRTL ? plateSources[value]?.ar : plateSources[value]?.en) || value;
    return value;
  };

  const getCompleteFilePath = (file: any) => {
    if (!file) return "";
    const filePath = file.filePath;
    const fileName = file.fileName;
    if (!filePath) return fileName || "";
    if (!fileName) return filePath;
    if (filePath.includes(fileName)) return filePath;
    const separator = filePath.endsWith("\\") || filePath.endsWith("/") ? "" : "\\";
    return `${filePath}${separator}${fileName}`;
  };

  const dispute = disputeData?.data;

  const getLabelFromValue = (value: number, categoryId: number) => {
    const option = lookupOptions.find((opt) => opt.value === value && opt.categoryId === categoryId);
    if (!option) return value;
    return isRTL ? option.labelAr : option.labelEn;
  };

  const getDisputeReasonLabel = (reasonId: number) => {
    if (!reasonId) return t("common.noData");
    const categoryOption = lookupOptions.find(
      (opt) => (opt.categoryId === 16001 || opt.categoryId === 16002) && opt.value === reasonId,
    );
    if (categoryOption) {
      return isRTL ? categoryOption.categoryNameAr : categoryOption.categoryName;
    }
    const option = lookupOptions.find((opt) => opt.value === reasonId);
    if (option) {
      return isRTL ? option.labelAr : option.labelEn;
    }
    return reasonId;
  };

  const getDisputeSubReasonLabel = (subReasonId: number) => {
    if (!subReasonId) return t("common.noData");
    const option = lookupOptions.find((opt) => opt.value === subReasonId);
    if (option) {
      return isRTL ? option.labelAr : option.labelEn;
    }
    return subReasonId;
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "orange";
      case 1:
        return "green";
      case 2:
        return "red";
      case 3:
        return "blue";
      default:
        return "default";
    }
  };

  const fineStatusColorMap: Record<number, string> = {
    15001: "orange",
    15002: "green",
    15003: "red",
    15004: "blue",
    15005: "purple",
    15006: "indigo",
  };

  const getFineStatusColor = (status: number) => fineStatusColorMap[status] || "default";

  const hasMissingVehicleOwnerName = useMemo(() => {
    const ownerName = dispute?.vehicle?.ownerName;
    if (ownerName === null || ownerName === undefined) return true;
    const normalized = String(ownerName).trim().toLowerCase();
    return normalized === "" || normalized === "no data" || normalized === "—" || normalized === "---";
  }, [dispute?.vehicle?.ownerName]);

  const isParkonicEntity = useMemo(() => {
    return dispute?.entityCode === "parking-parkonic-fine-dispute";
  }, [dispute?.entityCode]);

  const isDisputeApprovedOrRejected = dispute?.dispute_Status === 2 || dispute?.dispute_Status === 3;

  const shouldShowFooter = dispute && !isDisputeApprovedOrRejected && rcwuri; // only show footer when opened from Inbox

  useEffect(() => {
    if (open && mapRef.current) {
      const map = new Map({ basemap: "streets-navigation-vector" });
      const view = new MapView({
        container: mapRef.current,
        map: map,
        center: [55.2743, 25.1972],
        zoom: 12,
      });
      viewRef.current = view;
      return () => {
        if (viewRef.current) {
          viewRef.current.destroy();
          viewRef.current = null;
        }
      };
    }
  }, [open]);

  useEffect(() => {
    if (disputeId) {
      localStorage.setItem("currentDisputeId", disputeId);
      setStoredDisputeId(disputeId);
    }
  }, [disputeId]);

  useEffect(() => {
    const savedDisputeId = localStorage.getItem("currentDisputeId");
    if (savedDisputeId) {
      setStoredDisputeId(savedDisputeId);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchLookupData();
    }
  }, [open, i18n.language]);

  useEffect(() => {
    if (!showSeniorSupervisorDropdown) return;

    const currentValue = form.getFieldValue("assignedSeniorSupervisor");
    if (currentValue) return; // do not override user choice

    const defaultSupervisor = getDefaultSeniorSupervisor();

    form.setFieldsValue({
      assignedSeniorSupervisor: defaultSupervisor || "all",
    });
  }, [showSeniorSupervisorDropdown, activeShiftsData, dispute]);

  useEffect(() => {
    if (open && rcwuri) {
      getReviewOptions(rcwuri);
    }
  }, [open, rcwuri]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedAction(null);
      localStorage.removeItem("currentDisputeId");
    }
  }, [open, form]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1600}
      footer={null}
      title={null}
      closable={false}
      style={{ top: 40 }}
      bodyStyle={{
        padding: 0, // important: scrolling will be inside
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Spin spinning={isLoading || isUpdating || isLoadingLookups || historyLoading || entityHistoryLoading}>
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)" }}>
          {/* Fixed Header */}
          <div
            style={{
              padding: 10,
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: token.colorBgContainer,
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <Row
              align="middle"
              style={{
                marginBottom: 0,
                direction: isRTL ? "rtl" : "ltr",
              }}
            >
              <Col>
                <Space size="middle" align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    {t("form.disputereview")} <Text type="danger">#{dispute?.dispute_Id || storedDisputeId}</Text>
                  </Title>

                  {dispute?.dispute_Status !== undefined &&
                    (() => {
                      const status = disputeStatusEnum.find((s) => s.value === dispute.dispute_Status);
                      return status ? <Tag color={status.color}>{isRTL ? status.labelAr : status.labelEn}</Tag> : null;
                    })()}
                </Space>
              </Col>

              <Col flex="auto" />

              <Col>
                <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
              </Col>
            </Row>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              padding: 24,
              overflowY: "auto",
              flex: 1,
            }}
          >
            {!dispute ? (
              <Empty description={t("common.noData")} />
            ) : (
              <Row gutter={24} dir={isRTL ? "rtl" : "ltr"}>
                <Col span={18}>
                  <Row gutter={16}>
                    <Col
                      span={
                        dispute.vehicle && Object.values(dispute.vehicle).some((val) => val !== null && val !== "")
                          ? 12
                          : 24
                      }
                    >
                      <Card
                        title={t("form.disputedetails")}
                        size="small"
                        headStyle={{
                          background: token.colorBgContainer,
                          fontWeight: 600,
                          textAlign: isRTL ? "right" : "left",
                        }}
                        style={{ marginBottom: 16 }}
                      >
                        <Row gutter={[0, 12]} dir={isRTL ? "rtl" : "ltr"}>
                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.fineNumber")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.fineId || t("common.notAvailable")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.department")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.department ? getLabelFromValue(dispute.department, 1000) : t("common.noData")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.paymentType")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.payment_Type ? getLabelFromValue(dispute.payment_Type, 1100) : t("common.noData")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.disputeCategory")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {getDisputeReasonLabel(dispute.disputeMainReason || dispute.dispute_Reason)}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.disputeSubcategory")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {getDisputeSubReasonLabel(dispute.disputeSubReason || dispute.dispute_SubReason)}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.email")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.email || t("common.noData")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.phoneNumber")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.phone || t("common.noData")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.crmReference")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.crm_Ref || t("common.noData")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.address")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.address || t("common.noData")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.date")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.actualDisputeDate ? formatDate(dispute.actualDisputeDate) : t("common.noData")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.source")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.source || t("common.noData")}
                          </Col>

                          <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                            <Text strong>{t("form.notes")}:</Text>
                          </Col>
                          <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                            {dispute.comments || t("common.noData")}
                          </Col>
                        </Row>
                      </Card>
                    </Col>

                    {dispute.vehicle && Object.values(dispute.vehicle).some((val) => val !== null && val !== "") && (
                      <Col span={12}>
                        <Card
                          title={
                            <span
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                {t("form.vehicleDetails")}
                                {hasMissingVehicleOwnerName && (
                                  <span
                                    style={{
                                      background: "#8B1A1A",
                                      color: "#fff",
                                      fontSize: 11,
                                      borderRadius: 2,
                                      padding: "2px 8px",
                                      lineHeight: "18px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    <ExclamationCircleOutlined style={{ fontSize: 11 }} />
                                    {isRTL
                                      ? "بيانات المركبة غير موجودة في النظام المروري"
                                      : "Car Details Not Found in E-traffic"}
                                  </span>
                                )}
                              </span>
                              <span style={{ paddingTop: "10px", paddingBottom: "10px" }}>
                                <UAEPlate
                                  code={PLATE_COLOR[dispute.vehicle?.plateColor] ?? "---"}
                                  number={dispute.vehicle?.plateNumber ?? "---"}
                                  emirateEn={plateSources[dispute.vehicle?.plateSource]?.en || ""}
                                  emirateAr={plateSources[dispute.vehicle?.plateSource]?.ar || ""}
                                />
                              </span>
                            </span>
                          }
                          size="small"
                          headStyle={{
                            background: token.colorBgContainer,
                            fontWeight: 600,
                            textAlign: isRTL ? "right" : "left",
                          }}
                          style={{ marginBottom: 16 }}
                        >
                          <Row gutter={[0, 12]} dir={isRTL ? "rtl" : "ltr"}>
                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.plateNumber")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {dispute.vehicle.plateNumber || t("common.noData")}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.Color")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {getVehicleLabel("color", dispute.vehicle.plateColor) || t("common.noData")}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.Type")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {getVehicleLabel("plateType", dispute.vehicle.plateType) || t("common.noData")}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.Source")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {getVehicleLabel("source", dispute.vehicle.plateSource) || t("common.noData")}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.vehicleBrand")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {dispute.vehicle.vehicleBrand || t("common.noData")}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.vehicleType")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {dispute.vehicle.vehicleType || t("common.noData")}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.vehicleColor")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {dispute.vehicle.vehicleColor || t("common.noData")}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.manufacturerYear")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {dispute.vehicle.manufacturerYear || t("common.noData")}
                            </Col>

                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.vehicleOwnerName")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {dispute.vehicle.ownerName || t("common.noData")}
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    )}
                  </Row>

                  <Card
                    title={t("form.finedetails")}
                    size="small"
                    style={{ borderRadius: 12, marginBottom: 16 }}
                    headStyle={{
                      background: token.colorBgContainer,
                      fontWeight: 600,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {dispute.fineDetails ? (
                      <Row gutter={[0, 12]} dir={isRTL ? "rtl" : "ltr"}>
                        {/* Fine Number */}
                        <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                          <Text strong>{t("form.fineNumber")}:</Text>
                        </Col>
                        <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                          {dispute.fineDetails.fineNo || t("common.notAvailable")}
                        </Col>

                        {/* Fine Amount */}
                        <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                          <Text strong>{t("form.fineAmount")}:</Text>
                        </Col>
                        <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                          {dispute.fineDetails.fineAmount !== null && dispute.fineDetails.fineAmount !== undefined ? (
                            <Text type="danger" strong>
                              {dispute.fineDetails.fineAmount} {t("common.aed")}
                            </Text>
                          ) : (
                            t("common.noData")
                          )}
                        </Col>

                        {/* Fine Status */}
                        <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                          <Text strong>{t("form.status")}:</Text>
                        </Col>
                        <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                          {dispute.fineDetails.fineStatus ? (
                            <Tag color={getFineStatusColor(dispute.fineDetails.fineStatus)}>
                              {getLabelFromValue(dispute.fineDetails.fineStatus, 1500)}
                            </Tag>
                          ) : (
                            t("common.noData")
                          )}
                        </Col>

                        {/* Violation Category ID */}
                        <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                          <Text strong>{t("form.violationCategoryId")}:</Text>
                        </Col>
                        <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                          {dispute.fineDetails.categoryId ?? t("common.noData")}
                        </Col>

                        {/* Violation Description */}
                        <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                          <Text strong>{t("form.violationDescription")}:</Text>
                        </Col>
                        <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                          {i18n.language === "ar"
                            ? dispute.fineDetails.violationNameAr || t("common.noData")
                            : dispute.fineDetails.violationNameEn || t("common.noData")}
                        </Col>

                        {isParkonicEntity && (
                          <>
                            {/* Vehicle Entry DateTime */}
                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.vehicleEntryDateTime")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {dispute.fineDetails.entryDateTime
                                ? formatDate(dispute.fineDetails.entryDateTime)
                                : t("common.noData")}
                            </Col>

                            {/* Vehicle Exit DateTime */}
                            <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{t("form.vehicleExitDateTime")}:</Text>
                            </Col>
                            <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                              {dispute.fineDetails.exitDateTime
                                ? formatDate(dispute.fineDetails.exitDateTime)
                                : t("common.noData")}
                            </Col>
                          </>
                        )}

                        {/* Reviewed By */}
                        <Col span={10} style={{ textAlign: isRTL ? "right" : "left" }}>
                          <Text strong>{t("form.approvedBy")}:</Text>
                        </Col>
                        <Col span={14} style={{ textAlign: isRTL ? "right" : "left" }}>
                          {dispute.fineDetails.reviewerName || t("common.noData")}
                        </Col>
                      </Row>
                    ) : (
                      <Empty description={t("common.noData")} />
                    )}
                  </Card>

                  <Row gutter={16} dir={isRTL ? "rtl" : "ltr"}>
                    {!isParkonicEntity && (
                      <Col span={12}>
                        <Card
                          title={t("common.location")}
                          size="small"
                          style={{ borderRadius: 12, marginBottom: 16 }}
                          headStyle={{
                            background: token.colorBgContainer,
                            fontWeight: 600,
                            textAlign: isRTL ? "right" : "left",
                          }}
                        >
                          {dispute?.lat && dispute?.lng ? (
                            <ArcGISMap
                              inspectors={[
                                {
                                  id: 1,
                                  name: "Fine Location",
                                  nameAr: "موقع المخالفة",
                                  lat: parseFloat(dispute.lat),
                                  lng: parseFloat(dispute.lng),
                                  status: "Fine",
                                  statusAr: "مخالفة",
                                  details: { zone: "", lastCheckIn: "" },
                                  markerType: "google-pin",
                                },
                              ]}
                              center={[parseFloat(dispute.lng), parseFloat(dispute.lat)]}
                              zoom={16}
                              height="180px"
                            />
                          ) : (
                            <Empty description={t("common.noData")} />
                          )}
                        </Card>
                      </Col>
                    )}

                    <Col span={12}>
                      <Card
                        title={t("form.AttachedPhotos")}
                        size="small"
                        style={{ borderRadius: 12, marginBottom: 16 }}
                        headStyle={{
                          background: token.colorBgContainer,
                          fontWeight: 600,
                          textAlign: isRTL ? "right" : "left",
                        }}
                      >
                        {isLoadingAttachments ? (
                          <Spin />
                        ) : attachments.length > 0 ? (
                          <Image.PreviewGroup>
                            <Space wrap>
                              {attachments.map((file: any) => (
                                <Image
                                  key={file.attachmentGUID}
                                  width={100}
                                  height={100}
                                  src={getMobileFileUrl(getCompleteFilePath(file))}
                                  alt={file.fileName || "attachment"}
                                />
                              ))}
                            </Space>
                          </Image.PreviewGroup>
                        ) : (
                          <Empty description={t("common.noData")} />
                        )}
                      </Card>
                    </Col>
                  </Row>
                </Col>

                {/* Right Column - Review Timeline */}
                <Col span={6}>
                  <ReviewTimeline data={rcwuri ? reviewHistory : entityHistory} />
                </Col>
              </Row>
            )}

            {shouldShowFooter && (
              <>
                <Divider />
                <Form form={form} layout="vertical" dir={isRTL ? "rtl" : "ltr"}>
                  <Row gutter={16} align="middle" dir={isRTL ? "rtl" : "ltr"}>
                    <Col span={6}>
                      <Form.Item
                        name="action"
                        label={<Text strong>{isRTL ? "الإجراء" : "Action"}</Text>}
                        rules={[{ required: true, message: isRTL ? "الرجاء اختيار إجراء" : "Please select an action" }]}
                      >
                        <Select
                          placeholder={isRTL ? "اختر إجراء" : "Select action"}
                          onChange={handleActionChange}
                          allowClear
                        >
                          {reviewOptions.map((opt: any) => (
                            <Select.Option key={opt.ActivityOptionGUID} value={opt.ActivityOptionGUID}>
                              {opt.ReviewStatus}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    {showSupervisorDropdown && (
                      <Col span={6}>
                        <Form.Item
                          name="assignedSupervisor"
                          label={<Text strong>{isRTL ? "اختر مشرف" : "Select Supervisor"}</Text>}
                          rules={[
                            { required: true, message: isRTL ? "الرجاء اختيار مشرف" : "Please select a supervisor" },
                          ]}
                        >
                          <Select
                            placeholder={isRTL ? "اختر مشرف" : "Select supervisor"}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                          >
                            {getSupervisorDropdownOptions.map((supervisor) => (
                              <Select.Option key={supervisor.value} value={supervisor.value}>
                                {supervisor.label}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}

                    {showSeniorSupervisorDropdown && (
                      <Col span={6}>
                        <Form.Item
                          name="assignedSeniorSupervisor"
                          label={<Text strong>{isRTL ? "اختر مشرف أول" : "Select Senior Supervisor"}</Text>}
                          rules={[
                            {
                              required: true,
                              message: isRTL ? "الرجاء اختيار مشرف أول" : "Please select a senior supervisor",
                            },
                          ]}
                        >
                          <Select
                            placeholder={isRTL ? "اختر مشرف أول" : "Select senior supervisor"}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                          >
                            {seniorSupervisorOptions.map((sup) => (
                              <Select.Option key={sup.value} value={sup.value}>
                                {sup.label} {sup.value !== "all" && <Tag>{sup.role}</Tag>}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}

                    <Col
                      span={
                        (showSupervisorDropdown ? 1 : 0) + (showSeniorSupervisorDropdown ? 1 : 0) === 2
                          ? 6
                          : showSupervisorDropdown || showSeniorSupervisorDropdown
                            ? 8
                            : 12
                      }
                    >
                      <Form.Item
                        name="review_Comments"
                        label={<Text strong>{t("form.comments")}</Text>}
                        style={{ marginBottom: 0 }}
                        rules={[
                          { required: true, message: isRTL ? "الرجاء إدخال التعليقات" : "Please enter comments" },
                        ]}
                      >
                        <TextArea
                          placeholder={isRTL ? "أدخل التعليقات" : "Enter comments"}
                          rows={2}
                          dir={isRTL ? "rtl" : "ltr"}
                        />
                      </Form.Item>
                    </Col>

                    <Col
                      span={showSupervisorDropdown || showSeniorSupervisorDropdown ? 4 : 6}
                      style={{
                        textAlign: isRTL ? "left" : "right",
                        paddingTop: 30,
                      }}
                    >
                      <Space>
                        <Button type="primary" loading={isUpdating} onClick={handleSubmit} disabled={!selectedAction}>
                          {isRTL ? "إرسال" : "Submit"}
                        </Button>
                        <Button danger onClick={onClose}>
                          {isRTL ? "إلغاء" : "Cancel"}
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Form>
              </>
            )}
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default DisputeViewModal;
