import React, { useState, useEffect, useRef, useMemo } from "react";
import { Modal, Card, Row, Col, Typography, Divider, Button, Input, Select, Empty, Spin, Tag, Form, App } from "antd";
import { CheckOutlined, ClockCircleOutlined, CloseOutlined, RightOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  useLazyGetDisputeByIdQuery,
  useUpdateDisputeStatusMutation,
  useLazyGetLookupsQuery,
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

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DisputeViewModalProps {
  open: boolean;
  onClose: () => void;
  disputeId: string;
  onStatusUpdate?: () => void;
}

const DisputeViewModal: React.FC<DisputeViewModalProps> = ({ open, onClose, disputeId, onStatusUpdate }) => {
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

  const [selectedAction, setSelectedAction] = useState<string>("");
  const [storedDisputeId, setStoredDisputeId] = useState<string>("");
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const { data: activeShiftsData, isLoading: isLoadingSupervisors } = useGetActiveShiftsQuery({});

  const { user } = useAuth();

  const isRTL = i18n.language === "ar";

  const formatDate = (value: string | number) => {
    if (!value) return "";

    return dayjs(value)
      .locale(i18n.language)
      .format(isRTL ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
  };

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

  // Find the timelineData useMemo function (around line 180-230)
  const timelineData = useMemo(() => {
    if (!disputeData?.data?.reviews || !Array.isArray(disputeData.data.reviews)) return [];

    // Filter to show only review_Action = 2 or 3
    const filteredReviews = disputeData.data.reviews.filter((item: any) => {
      return item.review_Action === 2 || item.review_Action === 3;
    });

    return [...filteredReviews]
      .map((item: any) => {
        const comments = item.review_Comments || (isRTL ? "لا توجد تعليقات" : "No comments");
        const date = formatDate(item.action_DateTime || item.created_Date);

        const role =
          getRoleNameByGUID(item.assignedTo) || getRoleNameByGUID(item.reviewedBy) || (isRTL ? "النظام" : "System");

        const userName = item.reviewedBy
          ? getSupervisorName(item.reviewedBy)
          : item.assignedTo
            ? getSupervisorName(item.assignedTo)
            : isRTL
              ? "النظام"
              : "System";

        let actionLabel = isRTL ? "مُعيّن" : "Assigned";
        let actionType = "assigned";

        if (item.action_type && item.action_type.trim()) {
          actionLabel = item.action_type;
          actionType = item.action_type.toLowerCase().replace(/\s+/g, "_");
        } else {
          if (item.review_Action === 2) {
            actionLabel = isRTL ? "موافقة" : "Approved";
            actionType = "approved";
          } else if (item.review_Action === 3) {
            actionLabel = isRTL ? "مرفوض" : "Rejected";
            actionType = "rejected";
          }
        }

        return {
          actionLabel,
          actionType,
          role,
          userName,
          comments,
          date,
        };
      })
      .reverse(); // Last In First Out
  }, [disputeData?.data?.reviews, activeShiftsData, isRTL]);

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

  const getRoleBasedOptions = useMemo(() => {
    const options = [];

    if (isDCRole) {
      const isRFIFromSupervisor = timelineData.some(
        (item) =>
          item.actionType === "review" &&
          (item.role === (isRTL ? "المشرف" : "Supervisor") ||
            item.role === (isRTL ? "المشرف الأول" : "Senior Supervisor")),
      );

      if (isRFIFromSupervisor) {
        options.push(
          {
            value: "accept",
            label: isRTL ? "قبول" : "Accept",
          },
          {
            value: "reject",
            label: isRTL ? "رفض" : "Reject",
          },
        );
      } else {
        options.push(
          {
            value: "rfi_supervisor",
            label: isRTL ? "طلب معلومات (مشرف)" : "RFI (Supervisor)",
          },
          {
            value: "rfi_senior_supervisor",
            label: isRTL ? "طلب معلومات (مشرف أول)" : "RFI (Senior Supervisor)",
          },
          {
            value: "approve",
            label: isRTL ? "موافقة" : "Approve",
          },
          {
            value: "reject",
            label: isRTL ? "رفض" : "Reject",
          },
        );
      }
    }

    if (isSupervisorRoleOnly || isSeniorSupervisorRole) {
      options.push({
        value: "review",
        label: isRTL ? "مراجعة" : "Review",
      });
    }

    if (isManagerRole || isDirectorRole) {
      options.push(
        {
          value: "approve",
          label: isRTL ? "موافقة" : "Approve",
        },
        {
          value: "send_back",
          label: isRTL ? "إرجاع" : "Send Back",
        },
        {
          value: "reject",
          label: isRTL ? "رفض" : "Reject",
        },
      );
    }

    if (options.length === 0) {
      options.push({
        value: "submit",
        label: isRTL ? "إرسال" : "Submit",
      });
    }

    return options;
  }, [isDCRole, isSupervisorRoleOnly, isSeniorSupervisorRole, isManagerRole, isDirectorRole, timelineData, isRTL]);

  const showSupervisorDropdown = useMemo(() => {
    return isDCRole && (selectedAction === "rfi_supervisor" || selectedAction === "rfi_senior_supervisor");
  }, [isDCRole, selectedAction]);

  const getSupervisorDropdownOptions = useMemo(() => {
    if (!showSupervisorDropdown) return [];

    let allRoleGUID = "";
    let allLabel = "";

    if (selectedAction === "rfi_supervisor") {
      allRoleGUID = supervisorRoleGUID;
      allLabel = isRTL ? "كل المشرفين" : "All Supervisors";
    } else if (selectedAction === "rfi_senior_supervisor") {
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
    if (selectedAction === "rfi_supervisor") {
      filteredSupervisors = getAllSupervisors.filter((sup) => sup.role === (isRTL ? "المشرف" : "Supervisor"));
    } else if (selectedAction === "rfi_senior_supervisor") {
      filteredSupervisors = getAllSupervisors.filter(
        (sup) => sup.role === (isRTL ? "المشرف الأول" : "Senior Supervisor"),
      );
    }

    return [allOption, ...filteredSupervisors];
  }, [showSupervisorDropdown, selectedAction, getAllSupervisors, isRTL]);

  const handleActionChange = (value: string) => {
    setSelectedAction(value);
    form.setFieldsValue({ assignedSupervisor: undefined });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedAction) {
        notification.error(isRTL ? "الرجاء اختيار إجراء" : "Please select an action");
        return;
      }

      let apiAction: 1 | 2 | 3 = 1;
      let actionType = isRTL ? "مُعيّن" : "Assigned";
      let assignType: boolean | null = null;
      let assignedToValue: string | null = null;

      switch (selectedAction) {
        case "approve":
          apiAction = 2;
          actionType = isRTL ? "موافقة" : "Approved";
          break;
        case "accept":
          apiAction = 2;
          actionType = isRTL ? "مقبول" : "Accepted";
          break;
        case "reject":
          apiAction = 3;
          actionType = isRTL ? "مرفوض" : "Rejected";
          break;
        case "send_back":
          apiAction = 1;
          actionType = isRTL ? "إرجاع" : "Send Back";
          break;
        case "review":
          apiAction = 2;
          actionType = isRTL ? "تمت المراجعة" : "Reviewed";
          break;
        case "rfi_supervisor":
        case "rfi_senior_supervisor":
          apiAction = 1;
          actionType = "RFI";
          break;
        default:
          apiAction = 1;
          actionType = isRTL ? "مُعيّن" : "Assigned";
      }

      if (isDCRole && (selectedAction === "rfi_supervisor" || selectedAction === "rfi_senior_supervisor")) {
        if (!values.assignedSupervisor) {
          notification.error(isRTL ? "الرجاء اختيار مشرف" : "Please select a supervisor");
          return;
        }

        const selectedOption = getSupervisorDropdownOptions.find((o) => o.value === values.assignedSupervisor);

        if (!selectedOption) {
          notification.error(isRTL ? "اختيار المشرف غير صالح" : "Invalid supervisor selection");
          return;
        }

        if (selectedOption.value === "all") {
          assignedToValue = selectedOption.roleGUID;
          assignType = true;
        } else {
          assignedToValue = selectedOption.value;
          assignType = false;
        }
      } else if (selectedAction === "send_back") {
        assignedToValue = dcRoleGUID;
        assignType = true;
      } else if (selectedAction === "review") {
        assignedToValue = dcRoleGUID;
        assignType = true;
      } else if (selectedAction === "approve" && (isManagerRole || isDirectorRole)) {
        if (isManagerRole) {
          assignedToValue = directorRoleGUID;
          assignType = true;
        } else {
          assignedToValue = null;
          assignType = null;
        }
      } else if (selectedAction === "accept" && isDCRole) {
        assignedToValue = managerRoleGUID;
        assignType = true;
      }

      const payload = {
        dispute_Id: storedDisputeId,
        review_Action: apiAction,
        review_Comments: values.review_Comments,
        action_type: actionType,
        assignedTo: assignedToValue,
        assignType: assignType,
      };

      const response = await updateDisputeStatus(payload).unwrap();

      notification.success(response, t("messages.updateSuccess", { entity: t("sidebar.dispute") }));

      triggerGetDisputeById(storedDisputeId);
      form.resetFields();
      setSelectedAction("");
      onStatusUpdate?.();

      if (isDirectorRole && ["approve", "reject"].includes(selectedAction)) {
        onClose();
      }
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

  const ACTION_COLOR_MAP: Record<string, string> = {
    assigned: "#0ea5e9",
    approved: "#16a34a",
    accept: "#16a34a",
    accepted: "#16a34a",
    rejected: "#dc2626",
    reject: "#dc2626",
    send_back: "#f97316",
    rfi: "#2563eb",
    feedback: "#7c3aed",
    review: "#7c3aed",
    reviewed: "#7c3aed",
  };

  const ROLE_COLOR_MAP: Record<string, string> = {
    "Dispute Coordinator": "#2563eb",
    "منسق المنازعات": "#2563eb",
    Supervisor: "#7c3aed",
    المشرف: "#7c3aed",
    "Senior Supervisor": "#9333ea",
    "المشرف الأول": "#9333ea",
    Manager: "#16a34a",
    المدير: "#16a34a",
    Director: "#f59e0b",
    "المدير العام": "#f59e0b",
  };

  const getTimelineColors = (item: any) => {
    const actionKey = item.actionType?.toLowerCase();
    return {
      actionColor: ACTION_COLOR_MAP[actionKey] || "#64748b",
      roleColor: ROLE_COLOR_MAP[item.role] || "#64748b",
    };
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

  const isParkonicSource = useMemo(() => {
    return typeof dispute?.source === "string" && dispute.source.trim().toLowerCase().includes("parkonic");
  }, [dispute?.source]);

  const isDisputeApprovedOrRejected = dispute?.dispute_Status === 2 || dispute?.dispute_Status === 3;

  const shouldShowFooter = !isDisputeApprovedOrRejected && dispute;

  const getCurrentUserRoleName = useMemo(() => {
    if (isDCRole) return isRTL ? "منسق المنازعات" : "Dispute Coordinator";
    if (isSeniorSupervisorRole) return isRTL ? "المشرف الأول" : "Senior Supervisor";
    if (isSupervisorRoleOnly) return isRTL ? "المشرف" : "Supervisor";
    if (isManagerRole) return isRTL ? "المدير" : "Manager";
    if (isDirectorRole) return isRTL ? "المدير العام" : "Director";
    return isRTL ? "مستخدم" : "User";
  }, [isDCRole, isSeniorSupervisorRole, isSupervisorRoleOnly, isManagerRole, isDirectorRole, isRTL]);

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
    if (open && storedDisputeId) {
      triggerGetDisputeById(storedDisputeId);
    }
  }, [open, storedDisputeId, triggerGetDisputeById]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedAction("");
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
        padding: 24,
        maxHeight: "calc(100vh - 150px)",
        overflowY: "auto",
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Spin spinning={isLoading || isUpdating || isLoadingLookups}>
        <Row align="middle" style={{ marginBottom: 24, direction: isRTL ? "rtl" : "ltr" }}>
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

          <Col flex="auto" style={{ textAlign: "center" }}>
            <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
              {isRTL ? "مسجل الدخول كـ" : "Logged in as"} {getCurrentUserRoleName}
            </Text>
          </Col>

          <Col>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              style={{ fontSize: 16, marginLeft: isRTL ? 0 : "auto", marginRight: isRTL ? "auto" : 0 }}
            />
          </Col>
        </Row>

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
                        {dispute.fineId || t("common.noData")}
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
                      title={t("form.vehicleDetails")}
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
                  <Row gutter={16} dir={isRTL ? "rtl" : "ltr"}>
                    <Col span={8} style={{ textAlign: isRTL ? "right" : "left" }}>
                      <Text strong>{t("form.fineAmount")}:</Text>
                      {dispute.fineDetails.fineAmount !== null && dispute.fineDetails.fineAmount !== undefined ? (
                        <Text type="danger" strong style={{ display: "block", marginTop: 4 }}>
                          {dispute.fineDetails.fineAmount} {t("common.aed")}
                        </Text>
                      ) : (
                        <Text style={{ display: "block", marginTop: 4 }}>{t("common.noData")}</Text>
                      )}
                    </Col>
                    <Col span={8} style={{ textAlign: isRTL ? "right" : "left" }}>
                      <Text strong>{t("form.status")}:</Text>
                      {dispute.fineDetails.fineStatus ? (
                        <div style={{ marginTop: 4 }}>
                          <Tag color={getFineStatusColor(dispute.fineDetails.fineStatus)}>
                            {getLabelFromValue(dispute.fineDetails.fineStatus, 1500)}
                          </Tag>
                        </div>
                      ) : (
                        <Text style={{ display: "block", marginTop: 4 }}>{t("common.noData")}</Text>
                      )}
                    </Col>
                    <Col span={8} style={{ textAlign: isRTL ? "right" : "left" }}>
                      <Text strong>{t("form.fineNumber")}:</Text>
                      <Text style={{ display: "block", marginTop: 4 }}>
                        {dispute.fineDetails.fineNo || t("common.noData")}
                      </Text>
                    </Col>
                  </Row>
                ) : (
                  <Empty description={t("common.noData")} />
                )}
              </Card>

              <Row gutter={16} dir={isRTL ? "rtl" : "ltr"}>
                {!isParkonicSource && (
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

            {/* RIGHT SIDE - Review Timeline */}
            <Col span={6}>
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexDirection: isRTL ? "row-reverse" : "row",
                    }}
                  >
                    <Text strong style={{ fontSize: "16px", color: "#1e293b" }}>
                      {isRTL ? "سجل المراجعات" : "Review Timeline"}
                    </Text>
                    <Tag
                      style={{
                        background: "#e0f2fe",
                        color: "#0369a1",
                        borderRadius: "6px",
                        border: "none",
                        fontWeight: 600,
                        padding: "4px 12px",
                      }}
                    >
                      {isRTL ? "آخرها أولاً" : "Last In First Out"}
                    </Tag>
                  </div>
                }
                size="small"
                style={{
                  borderRadius: 12,
                  background: "#f8fafc",
                  height: 760,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                }}
                bodyStyle={{
                  padding: "20px 16px",
                  height: "calc(100% - 56px)",
                  overflowY: "auto",
                }}
              >
                {timelineData.length > 0 ? (
                  <div style={{ position: "relative" }}>
                    {/* Timeline line */}
                    <div
                      style={{
                        position: "absolute",
                        left: isRTL ? "auto" : "12px",
                        right: isRTL ? "12px" : "auto",
                        top: 0,
                        bottom: 0,
                        width: "2px",
                        background: "#e2e8f0",
                        zIndex: 0,
                      }}
                    />

                    {timelineData.map((item, idx) => {
                      const { actionColor, roleColor } = getTimelineColors(item);

                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            marginBottom: "24px",
                            position: "relative",
                            zIndex: 1,
                            flexDirection: isRTL ? "row-reverse" : "row",
                          }}
                        >
                          {/* Timeline icon */}
                          <div
                            style={{
                              width: "30px",
                              flexShrink: 0,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ background: "white", padding: "2px", marginTop: "4px" }}>
                              {idx === timelineData.length - 1 ? (
                                <RightOutlined
                                  style={{
                                    color: actionColor,
                                    fontSize: "14px",
                                    transform: isRTL ? "scaleX(-1)" : "none",
                                  }}
                                />
                              ) : (
                                <CheckOutlined style={{ color: actionColor, fontSize: "14px", fontWeight: "bold" }} />
                              )}
                            </div>
                          </div>

                          {/* Card */}
                          <div
                            style={{
                              flex: 1,
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              padding: "16px",
                              position: "relative",
                              marginRight: isRTL ? "0" : "0",
                              marginLeft: isRTL ? "0" : "0",
                            }}
                          >
                            {/* Role badge */}
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                right: isRTL ? "auto" : 0,
                                left: isRTL ? 0 : "auto",
                                background: roleColor,
                                color: "white",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "4px 12px",
                                borderRadius: isRTL ? "0 0 11px 0" : "0 11px 0 11px",
                              }}
                            >
                              {item.role}
                            </div>

                            {/* Action */}
                            <div style={{ marginBottom: "12px", textAlign: isRTL ? "right" : "left" }}>
                              <Text style={{ fontSize: "14px", fontWeight: 700 }}>
                                {isRTL ? "الإجراء:" : "Action:"}
                              </Text>{" "}
                              <Tag color={actionColor} style={{ border: "none", fontWeight: 600 }}>
                                {item.actionLabel}
                              </Tag>
                            </div>

                            {/* User */}
                            <div style={{ marginBottom: "12px", textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{item.role}:</Text>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flexDirection: isRTL ? "row-reverse" : "row",
                                }}
                              >
                                <UserOutlined style={{ color: "#64748b" }} />
                                <Text>{item.userName}</Text>
                              </div>
                            </div>

                            {/* Comments */}
                            <div style={{ marginBottom: "12px", textAlign: isRTL ? "right" : "left" }}>
                              <Text strong>{isRTL ? "التعليقات:" : "Comments:"}</Text>
                              <div
                                style={{
                                  padding: "12px",
                                  background: "#f8fafc",
                                  borderLeft: isRTL ? "none" : `4px solid ${actionColor}`,
                                  borderRight: isRTL ? `4px solid ${actionColor}` : "none",
                                  borderRadius: "4px",
                                  textAlign: isRTL ? "right" : "left",
                                }}
                              >
                                <Text style={{ fontSize: "13px", lineHeight: "1.6" }}>{item.comments}</Text>
                              </div>
                            </div>

                            {/* Date */}
                            <div
                              style={{
                                borderTop: "1px dashed #e2e8f0",
                                paddingTop: 8,
                                textAlign: isRTL ? "right" : "left",
                              }}
                            >
                              <ClockCircleOutlined
                                style={{
                                  color: "#64748b",
                                  marginRight: isRTL ? 0 : 6,
                                  marginLeft: isRTL ? 6 : 0,
                                }}
                              />
                              <Text style={{ fontSize: "13px", color: "#64748b" }}>{item.date}</Text>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty description={isRTL ? "لا يوجد سجل مراجعات" : "No Review History"} />
                )}
              </Card>
            </Col>
          </Row>
        )}

        {/* FOOTER - Action Form */}
        {shouldShowFooter && (
          <>
            <Divider />
            <Form form={form} layout="vertical" dir={isRTL ? "rtl" : "ltr"}>
              <Row gutter={16} align="middle" dir={isRTL ? "rtl" : "ltr"}>
                {/* Action Dropdown */}
                <Col span={6}>
                  <Form.Item
                    name="action"
                    label={<Text strong>{isRTL ? "الإجراء" : "Action"}</Text>}
                    rules={[{ required: true, message: isRTL ? "الرجاء اختيار إجراء" : "Please select an action" }]}
                  >
                    <Select
                      placeholder={isRTL ? "اختر إجراء" : "Select action"}
                      value={selectedAction}
                      onChange={handleActionChange}
                      allowClear
                    >
                      {getRoleBasedOptions.map((option) => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* Supervisor Dropdown (for DC RFI actions) */}
                {showSupervisorDropdown && (
                  <Col span={6}>
                    <Form.Item
                      name="assignedSupervisor"
                      label={<Text strong>{isRTL ? "اختر مشرف" : "Select Supervisor"}</Text>}
                      rules={[{ required: true, message: isRTL ? "الرجاء اختيار مشرف" : "Please select a supervisor" }]}
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

                {/* Comment Box */}
                <Col span={showSupervisorDropdown ? 8 : 12}>
                  <Form.Item
                    name="review_Comments"
                    label={<Text strong>{t("form.comments")}</Text>}
                    style={{ marginBottom: 0 }}
                    rules={[{ required: true, message: isRTL ? "الرجاء إدخال التعليقات" : "Please enter comments" }]}
                  >
                    <TextArea
                      placeholder={isRTL ? "أدخل التعليقات" : "Enter comments"}
                      rows={2}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                  </Form.Item>
                </Col>

                {/* Action Buttons */}
                <Col
                  span={showSupervisorDropdown ? 4 : 6}
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
      </Spin>
    </Modal>
  );
};

export default DisputeViewModal;
