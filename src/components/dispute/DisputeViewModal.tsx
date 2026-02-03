import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Timeline,
  Button,
  Input,
  Select,
  Empty,
  Spin,
  Tag,
  Form,
  App,
} from "antd";
import { ClockCircleOutlined, CloseOutlined } from "@ant-design/icons";
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

  const [reviewAction, setReviewAction] = useState<number>(2); // 2=Approved, 3=Rejected
  const [storedDisputeId, setStoredDisputeId] = useState<string>("");
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const { data: activeShiftsData, isLoading: isLoadingSupervisors } = useGetActiveShiftsQuery({});

  const { user } = useAuth();

  // Helper function to normalize GUIDs (convert to lowercase)
  const normalizeGuid = (guid: string | null | undefined): string | null => {
    if (!guid) return null;
    return guid.toLowerCase().trim();
  };

  // Get user's roleGUID with fallback to localStorage
  const getUserRoleGUID = () => {
    // Primary: from user context
    if (user?.roleGUID) {
      return normalizeGuid(user.roleGUID);
    }

    // Fallback: from localStorage
    const roleGUIDFromStorage = localStorage.getItem("roleGUID");
    if (roleGUIDFromStorage) {
      return normalizeGuid(roleGUIDFromStorage);
    }

    return null;
  };

  const userRoleGUID = getUserRoleGUID();

  // Define role GUIDs as per your specification (store as lowercase)
  const dcRoleGUID = "efb6ef6a-128b-4dd9-9641-2b04205c8cf8".toLowerCase(); // Dispute Coordinator
  const seniorSupervisorRoleGUID = "9e8331a6-3828-421b-9c5d-835f7b6f8710".toLowerCase(); // Senior Supervisor
  const supervisorRoleGUID = "137db453-07cc-4218-9ef8-3aa236d9e951".toLowerCase(); // Supervisor
  const directorRoleGUID = "6d20d858-1128-4cd2-af7e-e8eb3c4bf887".toLowerCase(); // Director
  const managerRoleGUID = "33fa8623-20f8-417a-b655-18da372f18bd".toLowerCase(); // Manager

  // All supervisor role GUIDs that can approve/reject (already lowercase from above)
  const supervisorRoleGUIDs = [seniorSupervisorRoleGUID, supervisorRoleGUID, managerRoleGUID, directorRoleGUID];

  // Check if user is DC (Dispute Coordinator) - case-insensitive
  const isDCRole = userRoleGUID === dcRoleGUID;

  // Check if user is a supervisor (can approve/reject) - case-insensitive
  const isSupervisorRole = useMemo(() => {
    if (!userRoleGUID) return false;
    return supervisorRoleGUIDs.some((roleGuid) => roleGuid === userRoleGUID);
  }, [userRoleGUID]);

  // Define the roles for DC assignment dropdown - only name, no role code
  const assignmentRoles = [
    {
      roleGUID: seniorSupervisorRoleGUID,
      roleName: "Senior Supervisor",
    },
    {
      roleGUID: supervisorRoleGUID,
      roleName: "Supervisor",
    },
    {
      roleGUID: managerRoleGUID,
      roleName: "Manager",
    },
    {
      roleGUID: directorRoleGUID,
      roleName: "Director",
    },
  ];

  // Function to find role by GUID (case-insensitive)
  const findRoleByGUID = (guid: string | null) => {
    if (!guid) return null;
    const normalizedGuid = normalizeGuid(guid);
    return assignmentRoles.find((role) => normalizeGuid(role.roleGUID) === normalizedGuid);
  };

  // Check if dispute is assigned to current user's role - case-insensitive
  const isAssignedToCurrentUserRole = useMemo(() => {
    if (!userRoleGUID) return false;

    // Check if dispute is assigned to user's role (normalize from API response)
    if (disputeData?.data?.assignedToRole) {
      const assignedRole = normalizeGuid(disputeData.data.assignedToRole);
      if (assignedRole === userRoleGUID) {
        return true;
      }
    }

    // Check in reviews if last action was assignment to this role
    if (disputeData?.data?.reviews?.length) {
      const lastReview = disputeData.data.reviews[disputeData.data.reviews.length - 1];
      if (lastReview.review_Action === 1) {
        // Check both possible fields
        const assignedRole = normalizeGuid(lastReview.assignedToRole) || normalizeGuid(lastReview.assignedTo);
        if (assignedRole === userRoleGUID) {
          return true;
        }
      }
    }

    // Check if assignedTo contains current user's role GUID in any field
    const checkAssignment = (data: any) => {
      if (!data) return false;
      
      // Convert to lowercase for comparison
      const fieldsToCheck = [
        data.assignedToRole,
        data.assignedTo,
        data.assignedTo?.roleGUID,
        data.assignedToRoleGUID
      ];
      
      return fieldsToCheck.some(field => {
        if (!field) return false;
        const normalizedField = normalizeGuid(field);
        return normalizedField === userRoleGUID;
      });
    };

    return checkAssignment(disputeData?.data) || 
           disputeData?.data?.reviews?.some((review: any) => checkAssignment(review));
  }, [disputeData?.data, userRoleGUID]);

  // Use disputeData instead of dispute to avoid reference before initialization
  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    disputeData?.data?.fineDetails?.inspectionId
      ? {
          inspectionGUID: disputeData.data.fineDetails.inspectionId,
          entityCode: disputeData.data.fineDetails.entityCode,
        }
      : skipToken,
  );

  const getSupervisorName = (id: string) => {
    if (!activeShiftsData) return id;
    const sup = activeShiftsData.find((s: any) => s.employeeId === id);
    return sup ? sup.employeeName : id;
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

  // Initialize map
  useEffect(() => {
    if (open && mapRef.current) {
      const map = new Map({
        basemap: "streets-navigation-vector",
      });

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

  // Store disputeId in localStorage when it changes
  useEffect(() => {
    if (disputeId) {
      localStorage.setItem("currentDisputeId", disputeId);
      setStoredDisputeId(disputeId);
    }
  }, [disputeId]);

  // Get disputeId from localStorage on component mount
  useEffect(() => {
    const savedDisputeId = localStorage.getItem("currentDisputeId");
    if (savedDisputeId) {
      setStoredDisputeId(savedDisputeId);
    }
  }, []);

  // Fetch lookup data when modal opens
  useEffect(() => {
    if (open) {
      fetchLookupData();
    }
  }, [open, i18n.language]);

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
    if (type === "source") return plateSources[value]?.en || value;
    return value;
  };

  // Fetch dispute data when modal opens
  useEffect(() => {
    if (open && storedDisputeId) {
      triggerGetDisputeById(storedDisputeId);
    }
  }, [open, storedDisputeId, triggerGetDisputeById]);

  // Reset form and clear storage when modal closes
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setReviewAction(2);
      localStorage.removeItem("currentDisputeId");
    }
  }, [open, form]);

  const dispute = disputeData?.data;

  // Helper function to get label from value
  const getLabelFromValue = (value: number, categoryId: number) => {
    const option = lookupOptions.find((opt) => opt.value === value && opt.categoryId === categoryId);
    if (!option) return value;
    return i18n.language === "ar" ? option.labelAr : option.labelEn;
  };

  // Function to get dispute reason label
  const getDisputeReasonLabel = (reasonId: number) => {
    if (!reasonId) return t("common.noData");

    const categoryOption = lookupOptions.find(
      (opt) => (opt.categoryId === 16001 || opt.categoryId === 16002) && opt.value === reasonId,
    );

    if (categoryOption) {
      return i18n.language === "ar" ? categoryOption.categoryNameAr : categoryOption.categoryName;
    }

    const option = lookupOptions.find((opt) => opt.value === reasonId);
    if (option) {
      return i18n.language === "ar" ? option.labelAr : option.labelEn;
    }

    return reasonId;
  };

  // Function to get dispute sub-reason label
  const getDisputeSubReasonLabel = (subReasonId: number) => {
    if (!subReasonId) return t("common.noData");

    const option = lookupOptions.find((opt) => opt.value === subReasonId);
    if (option) {
      return i18n.language === "ar" ? option.labelAr : option.labelEn;
    }

    return subReasonId;
  };

  const handleStatusUpdate = async (action: number) => {
    try {
      const values = await form.validateFields();

      // For assignment action (action=1), validate that role is selected
      if (action === 1 && !values.assignedToRole) {
        notification.error("Please select a role to assign this dispute");
        return;
      }

      // Ensure assignedToRole is lowercase before sending
      const assignedToRole = values.assignedToRole ? normalizeGuid(values.assignedToRole) : "";

      const payload = {
        dispute_Id: storedDisputeId,
        review_Action: action,
        review_Comments: values.review_Comments,
        assignedTo: assignedToRole,
        action_type: action === 1 ? "Assigned" : action === 2 ? "Approved" : "Rejected",
      };

      const response = await updateDisputeStatus(payload).unwrap();
      notification.success(response, t("messages.updateSuccess", { entity: t("sidebar.dispute") }));

      // Refresh the dispute data
      triggerGetDisputeById(storedDisputeId);

      // Reset the form
      form.resetFields();

      // Call the callback if provided
      onStatusUpdate?.();
      onClose?.();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      notification.error(error, "Status Update Failed");
    }
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "No Date";
    return new Date(dateString).toLocaleString();
  };

  const isParkonicSource = useMemo(() => {
    return typeof dispute?.source === "string" && dispute.source.trim().toLowerCase().includes("parkonic");
  }, [dispute?.source]);

  // Check if dispute status is 2 (Approved) or 3 (Rejected) - hide footer
  const isDisputeApprovedOrRejected = dispute?.dispute_Status === 2 || dispute?.dispute_Status === 3;

  // Check if dispute is pending or in review
  const isDisputePendingOrInReview = dispute?.dispute_Status === 1 || dispute?.dispute_Status === 4;

  // Check if review timeline is empty
  const isReviewTimelineEmpty = useMemo(() => {
    return !dispute?.reviews || dispute.reviews.length === 0;
  }, [dispute?.reviews]);

  // Get the last assigned role GUID from reviews
  const getLastAssignedRoleGUID = useMemo(() => {
    if (!dispute?.reviews?.length) return null;

    // Find the last assignment review (review_Action === 1)
    const assignmentReviews = dispute.reviews.filter((review: any) => review.review_Action === 1);
    
    if (assignmentReviews.length === 0) return null;

    // Get the most recent assignment
    const lastAssignment = assignmentReviews[assignmentReviews.length - 1];

    // Check both possible fields for role GUID
    const assignedToRole = lastAssignment.assignedToRole || lastAssignment.assignedTo;
    
    if (!assignedToRole) return null;

    // Check if it's a GUID format
    const normalizedAssigned = normalizeGuid(assignedToRole);
    const isRoleGUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalizedAssigned || "");

    return isRoleGUID ? normalizedAssigned : null;
  }, [dispute?.reviews]);

  // Check if last assigned role is Dispute Coordinator
  const isLastAssignedRoleDC = useMemo(() => {
    if (!getLastAssignedRoleGUID) return false;
    return getLastAssignedRoleGUID === dcRoleGUID;
  }, [getLastAssignedRoleGUID]);

  // Check if DC should see assign footer based on timeline conditions
  const showAssignFooterForDC = useMemo(() => {
    if (!isDCRole || !isDisputePendingOrInReview) return false;

    // Condition 1: If review timeline is empty
    if (isReviewTimelineEmpty) {
      return true;
    }

    // Condition 2: If review timeline is not empty AND last assigned role is DC
    if (!isReviewTimelineEmpty && isLastAssignedRoleDC) {
      return true;
    }

    return false;
  }, [isDCRole, isDisputePendingOrInReview, isReviewTimelineEmpty, isLastAssignedRoleDC]);

  // Check if DC should see approve/reject buttons (when assigned to their role)
  const showFooterForDC = useMemo(() => {
    return isDCRole && isDisputePendingOrInReview && isAssignedToCurrentUserRole;
  }, [isDCRole, isDisputePendingOrInReview, isAssignedToCurrentUserRole]);

  // Check if supervisor should see footer (comments and approve/reject buttons)
  const showFooterForSupervisors = useMemo(() => {
    return isSupervisorRole && isDisputePendingOrInReview && isAssignedToCurrentUserRole;
  }, [isSupervisorRole, isDisputePendingOrInReview, isAssignedToCurrentUserRole]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterOpenChange={(visible) => {
        if (visible && mapRef.current && !viewRef.current) {
          const map = new Map({
            basemap: "streets-navigation-vector",
          });

          const view = new MapView({
            container: mapRef.current,
            map,
            center: [55.2743, 25.1972],
            zoom: 12,
          });

          viewRef.current = view;
        }
      }}
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
    >
      <Spin spinning={isLoading || isUpdating || isLoadingLookups}>
        {/* Custom Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space size="middle" align="center">
              <Title level={4} style={{ margin: 0 }}>
                {t("form.disputereview")} <Text type="danger">#{dispute?.dispute_Id || storedDisputeId}</Text>
              </Title>

              {dispute?.dispute_Status !== undefined &&
                (() => {
                  const status = disputeStatusEnum.find((s) => s.value === dispute.dispute_Status);
                  return status ? (
                    <Tag color={status.color}>{i18n.language === "ar" ? status.labelAr : status.labelEn}</Tag>
                  ) : null;
                })()}
            </Space>
          </Col>

          <Col>
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
          </Col>
        </Row>

        {!dispute ? (
          <Empty description={t("common.noData")} />
        ) : (
          <Row gutter={24}>
            {/* LEFT SIDE */}
            <Col span={18}>
              <Row gutter={16}>
                {/* Dispute Details */}
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
                    headStyle={{ background: token.colorBgContainer, fontWeight: 600 }}
                    style={{ marginBottom: 16 }}
                  >
                    <Row gutter={[0, 12]}>
                      <Col span={10}>
                        <Text strong>{t("form.fineNumber")}:</Text>
                      </Col>
                      <Col span={14}>{dispute.fineId || t("common.noData")}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.department")}:</Text>
                      </Col>
                      <Col span={14}>
                        {dispute.department ? getLabelFromValue(dispute.department, 1000) : t("common.noData")}
                      </Col>

                      <Col span={10}>
                        <Text strong>{t("form.paymentType")}:</Text>
                      </Col>
                      <Col span={14}>
                        {dispute.payment_Type ? getLabelFromValue(dispute.payment_Type, 1100) : t("common.noData")}
                      </Col>

                      <Col span={10}>
                        <Text strong>{t("form.disputeCategory")}:</Text>
                      </Col>
                      <Col span={14}>{getDisputeReasonLabel(dispute.disputeMainReason || dispute.dispute_Reason)}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.disputeSubcategory")}:</Text>
                      </Col>
                      <Col span={14}>
                        {getDisputeSubReasonLabel(dispute.disputeSubReason || dispute.dispute_SubReason)}
                      </Col>

                      <Col span={10}>
                        <Text strong>{t("form.email")}:</Text>
                      </Col>
                      <Col span={14}>{dispute.email || t("common.noData")}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.phoneNumber")}:</Text>
                      </Col>
                      <Col span={14}>{dispute.phone || t("common.noData")}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.crmReference")}:</Text>
                      </Col>
                      <Col span={14}>{dispute.crm_Ref || t("common.noData")}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.address")}:</Text>
                      </Col>
                      <Col span={14}>{dispute.address || t("common.noData")}</Col>
                      <Col span={10}>
                        <Text strong>{t("form.date")}:</Text>
                      </Col>
                      <Col span={14}>
                        {dispute.actualDisputeDate
                          ? dayjs(dispute.actualDisputeDate).format("DD MMM  YYYY ,  hh:mm A")
                          : t("common.noData")}
                      </Col>

                      <Col span={10}>
                        <Text strong>{t("form.source")}:</Text>
                      </Col>
                      <Col span={14}>{dispute.source || t("common.noData")}</Col>
                    </Row>
                  </Card>
                </Col>

                {/* Vehicle Details */}
                {dispute.vehicle && Object.values(dispute.vehicle).some((val) => val !== null && val !== "") && (
                  <Col span={12}>
                    <Card
                      title={t("form.vehicleDetails")}
                      size="small"
                      headStyle={{ background: token.colorBgContainer, fontWeight: 600 }}
                      style={{ marginBottom: 16 }}
                    >
                      <Row gutter={[0, 12]}>
                        <Col span={10}>
                          <Text strong>{t("form.plateNumber")}:</Text>
                        </Col>
                        <Col span={14}>{dispute.vehicle.plateNumber || t("common.noData")}</Col>

                        <Col span={10}>
                          <Text strong>{t("form.Color")}:</Text>
                        </Col>
                        <Col span={14}>
                          {getVehicleLabel("color", dispute.vehicle.plateColor) || t("common.noData")}
                        </Col>

                        <Col span={10}>
                          <Text strong>{t("form.Type")}:</Text>
                        </Col>
                        <Col span={14}>
                          {getVehicleLabel("plateType", dispute.vehicle.plateType) || t("common.noData")}
                        </Col>

                        <Col span={10}>
                          <Text strong>{t("form.Source")}:</Text>
                        </Col>
                        <Col span={14}>
                          {getVehicleLabel("source", dispute.vehicle.plateSource) || t("common.noData")}
                        </Col>

                        <Col span={10}>
                          <Text strong>{t("form.vehicleBrand")}:</Text>
                        </Col>
                        <Col span={14}>{dispute.vehicle.vehicleBrand || t("common.noData")}</Col>

                        <Col span={10}>
                          <Text strong>{t("form.vehicleType")}:</Text>
                        </Col>
                        <Col span={14}>{dispute.vehicle.vehicleType || t("common.noData")}</Col>

                        <Col span={10}>
                          <Text strong>{t("form.vehicleColor")}:</Text>
                        </Col>
                        <Col span={14}>{dispute.vehicle.vehicleColor || t("common.noData")}</Col>

                        <Col span={10}>
                          <Text strong>{t("form.manufacturerYear")}:</Text>
                        </Col>
                        <Col span={14}>{dispute.vehicle.manufacturerYear || t("common.noData")}</Col>

                        <Col span={10}>
                          <Text strong>{t("form.vehicleOwnerName")}:</Text>
                        </Col>
                        <Col span={14}>{dispute.vehicle.ownerName || t("common.noData")}</Col>
                      </Row>
                    </Card>
                  </Col>
                )}
              </Row>

              {/* Fine Details */}
              <Card
                title={t("form.finedetails")}
                size="small"
                style={{ borderRadius: 12, marginBottom: 16 }}
                headStyle={{ background: token.colorBgContainer, fontWeight: 600 }}
              >
                {dispute.fineDetails ? (
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text strong>{t("form.fineAmount")}:</Text>
                      {dispute.fineDetails.fineAmount !== null && dispute.fineDetails.fineAmount !== undefined ? (
                        <Text type="danger" strong style={{ display: "block", marginTop: 4 }}>
                          {dispute.fineDetails.fineAmount} AED
                        </Text>
                      ) : (
                        <Text style={{ display: "block", marginTop: 4 }}>{t("common.noData")}</Text>
                      )}
                    </Col>

                    <Col span={8}>
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

                    <Col span={8}>
                      <Text strong>{t("form.fineNumber")}:</Text>
                      <Text style={{ display: "block", marginTop: 4 }}>
                        {dispute.fineDetails.fineNo || t("common.noData")}
                      </Text>
                    </Col>
                  </Row>
                ) : (
                  <Empty description="No Fine Details Available" />
                )}
              </Card>

              <Row gutter={16}>
                {!isParkonicSource && (
                  <Col span={12}>
                    <Card
                      title={t("common.location")}
                      size="small"
                      style={{ borderRadius: 12, marginBottom: 16 }}
                      headStyle={{ background: token.colorBgContainer, fontWeight: 600 }}
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
                    headStyle={{ background: token.colorBgContainer, fontWeight: 600 }}
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
                              src={getMobileFileUrl(file.filePath)}
                              alt={file.fileName}
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
                title={t("form.reviewtimeline")}
                size="small"
                style={{
                  borderRadius: 12,
                  background: token.colorBgContainer,
                  marginBottom: 16,
                  height: 760,
                  overflow: "hidden",
                }}
                headStyle={{
                  background: token.colorBgContainer,
                  fontWeight: 600,
                  color: "#1d4ed8",
                }}
                bodyStyle={{ paddingRight: 8, height: "100%", overflowY: "auto" }}
              >
                {dispute.reviews && dispute.reviews.length > 0 ? (
                  <Timeline>
                    {dispute.reviews.map((review: any, idx: number) => {
                      const isAssigned = review.review_Action === 1;
                      const isApproved = review.review_Action === 2;
                      const isRejected = review.review_Action === 3;

                      // Timeline action text: "Assigned" for assignment, "Reviewed" for approve/reject
                      const actionLabel = isAssigned
                        ? t("status.assigned")
                        : isApproved || isRejected
                          ? t("status.reviewed")
                          : t("common.review");

                      const tagColor = isAssigned ? "orange" : "blue";

                      // Function to get role name from GUID (only name, no code)
                      const getRoleNameFromGUID = (guid: string | null) => {
                        if (!guid) return t("common.unknown");

                        const normalizedGuid = normalizeGuid(guid);
                        const role = findRoleByGUID(normalizedGuid);

                        if (role) {
                          return role.roleName;
                        }

                        // Check if it's the DC role
                        if (normalizedGuid === dcRoleGUID) {
                          return "Dispute Coordinator";
                        }

                        // If not a known role GUID, check if it's a user GUID
                        return getSupervisorName(guid);
                      };

                      return (
                        <Timeline.Item
                          dot={<ClockCircleOutlined style={{ color: token.colorPrimary }} />}
                          color="blue"
                          key={idx}
                        >
                          <div
                            style={{
                              background: token.colorBgElevated,
                              border: `1px solid ${token.colorBorder}`,
                              borderRadius: 8,
                              padding: "10px 14px",
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ fontSize: "12px", marginBottom: 4 }}>
                              <Text strong style={{ color: token.colorText }}>
                                {t("form.action")}:
                              </Text>
                              <Tag color={tagColor}>{actionLabel}</Tag>
                            </div>

                            {/* Show Review Result separately for Approved/Rejected */}
                            {(isApproved || isRejected) && (
                              <div style={{ fontSize: "12px", marginBottom: 4 }}>
                                <Text strong style={{ color: token.colorText }}>
                                  {t("form.reviewResult")}:
                                </Text>
                                <Tag color={isApproved ? "green" : "red"}>
                                  {isApproved ? t("status.approved") : t("status.rejected")}
                                </Tag>
                              </div>
                            )}

                            <div style={{ fontSize: "12px", marginBottom: 4 }}>
                              <Text strong style={{ color: token.colorText }}>
                                {isAssigned ? t("form.assignedTo") : t("form.reviewedBy")}:
                              </Text>
                              <Text style={{ color: token.colorTextSecondary }}>
                                {isAssigned
                                  ? review.assignedTo
                                    ? getRoleNameFromGUID(review.assignedTo)
                                    : t("common.unknown")
                                  : review.reviewedBy
                                    ? getSupervisorName(review.reviewedBy)
                                    : t("common.unknown")}
                              </Text>
                            </div>

                            <div style={{ fontSize: "12px", marginBottom: 4 }}>
                              <Text strong style={{ color: token.colorText }}>
                                {t("form.comments")}:
                              </Text>
                              <Text style={{ color: token.colorTextSecondary }}>
                                {review.review_Comments || t("common.noComments")}
                              </Text>
                            </div>

                            <div style={{ fontSize: "12px" }}>
                              <Text strong style={{ color: token.colorText }}>
                                {t("form.date")}:
                              </Text>
                              <Text style={{ color: token.colorTextSecondary }}>
                                {review.action_DateTime ? formatDateTime(review.action_DateTime) : t("common.noDate")}
                              </Text>
                            </div>
                          </div>
                        </Timeline.Item>
                      );
                    })}
                  </Timeline>
                ) : (
                  <Empty description={t("form.NoReviewHistory")} />
                )}
              </Card>
            </Col>
          </Row>
        )}

        {/* FOOTER - Action Form */}
        {/* Show footer when dispute exists and is not Approved or Rejected */}
        {dispute &&
          !isDisputeApprovedOrRejected &&
          (showFooterForDC || showFooterForSupervisors || showAssignFooterForDC) && (
            <>
              <Divider />
              <Form form={form} layout="vertical">
                <Row gutter={16} align="middle">
                  {/* Assignment Dropdown - for DC role based on timeline conditions */}
                  {showAssignFooterForDC && (
                    <Col span={6}>
                      <Form.Item
                        name="assignedToRole"
                        label={<Text strong>{t("form.assignedTo")}</Text>}
                        rules={[
                          {
                            required: true,
                            message: t("form.selectRole"),
                          },
                        ]}
                      >
                        <Select placeholder={t("common.selectRole")} allowClear showSearch optionFilterProp="children">
                          {assignmentRoles.map((role) => (
                            <Select.Option key={role.roleGUID.toLowerCase()} value={role.roleGUID.toLowerCase()}>
                              {role.roleName} {/* Only name, no role code */}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  )}

                  {/* Comment Box - Show for all footer types */}
                  {(showFooterForDC || showFooterForSupervisors || showAssignFooterForDC) && (
                    <Col
                      span={
                        showAssignFooterForDC
                          ? showFooterForSupervisors || showFooterForDC
                            ? 10
                            : 12
                          : showFooterForDC || showFooterForSupervisors
                            ? 16
                            : 12
                      }
                    >
                      <Form.Item
                        name="review_Comments"
                        label={<Text strong>{t("form.comments")}</Text>}
                        style={{ marginBottom: 0 }}
                        rules={[{ required: true, message: t("placeholders.enterComments") }]}
                      >
                        <TextArea placeholder={t("placeholders.enterComments")} rows={2} />
                      </Form.Item>
                    </Col>
                  )}

                  {/* Action Buttons */}
                  <Col span={8} style={{ textAlign: "right", paddingTop: 30 }}>
                    {showAssignFooterForDC ? (
                      // DC role - Show assign button based on timeline conditions
                      <Button
                        type="primary"
                        loading={isUpdating && reviewAction === 1}
                        onClick={() => {
                          setReviewAction(1);
                          handleStatusUpdate(1); // Assigned = 1
                        }}
                      >
                        {t("form.assign")}
                      </Button>
                    ) : showFooterForDC ? (
                      // DC role - Show Approve/Reject buttons when dispute is assigned to their role
                      <div>
                        <div style={{ marginBottom: 8, textAlign: "center" }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t("form.asReviewerSelectDecision")}
                          </Text>
                        </div>
                        <div>
                          <Button
                            type="primary"
                            style={{ marginRight: 8 }}
                            loading={isUpdating && reviewAction === 2}
                            onClick={() => {
                              setReviewAction(2);
                              handleStatusUpdate(2); // Approved = 2
                            }}
                          >
                            {t("form.approve")}
                          </Button>
                          <Button
                            danger
                            loading={isUpdating && reviewAction === 3}
                            onClick={() => {
                              setReviewAction(3);
                              handleStatusUpdate(3); // Rejected = 3
                            }}
                          >
                            {t("common.reject")}
                          </Button>
                        </div>
                      </div>
                    ) : showFooterForSupervisors ? (
                      // Supervisor role - Show Approve/Reject buttons when dispute is assigned to role
                      <div>
                        <div style={{ marginBottom: 8, textAlign: "center" }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t("form.asReviewerSelectDecision")}
                          </Text>
                        </div>
                        <div>
                          <Button
                            type="primary"
                            style={{ marginRight: 8 }}
                            loading={isUpdating && reviewAction === 2}
                            onClick={() => {
                              setReviewAction(2);
                              handleStatusUpdate(2); // Approved = 2
                            }}
                          >
                            {t("form.approve")}
                          </Button>
                          <Button
                            danger
                            loading={isUpdating && reviewAction === 3}
                            onClick={() => {
                              setReviewAction(3);
                              handleStatusUpdate(3); // Rejected = 3
                            }}
                          >
                            {t("common.reject")}
                          </Button>
                        </div>
                      </div>
                    ) : null}
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