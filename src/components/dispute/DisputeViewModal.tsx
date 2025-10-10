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
import { useGetActiveShiftsQuery } from "../../services/rtkApiFactory";
import { Image, Space } from "antd";
import { useGetInspectionAttachmentsQuery, getMobileFileUrl } from "../../services/inspectionFileApi";
import { skipToken } from "@reduxjs/toolkit/query";
import ArcGISMap from "../common/ArcGISMap";
import { useAuth } from "../../contexts/AuthContext";
import dayjs from "dayjs";
import { PLATE_COLOR, PLATE_TYPE_SHORT } from "../../config/pageConfigs/finesConfig";
import { EMIRATES } from "../../config/pageConfigs/whitelistPlateConfig";

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
  const allowedRoles = ["PARSUP", "PARDC", "PARDIR", "PARMGR", "PARSRSUP"];
  const filteredSupervisors = activeShiftsData?.filter((shift: any) => allowedRoles.includes(shift.roleCode)) || [];

  const { user } = useAuth();

  // Updated condition to include all three role GUIDs that can approve/reject
  const isSupervisorRole =
    user?.roleGUID === "9e8331a6-3828-421b-9c5d-835f7b6f8710" ||
    user?.roleGUID === "137db453-07cc-4218-9ef8-3aa236d9e951" ||
    user?.roleGUID === "6d20d858-1128-4cd2-af7e-e8eb3c4bf887" ||
    user?.roleGUID === "33fa8623-20f8-417a-b655-18da372f18bd";

  // Special role ID that should ALWAYS see comment, dropdown, assign BUT NOT approve/reject
  const isSpecialRoleId = user?.roleGUID === "efb6ef6a-128b-4dd9-9641-2b04205c8cf8";

  // Checks if current user is assigned to this dispute (look at last review)
  const isUserAssignedToDispute = useMemo(() => {
    if (!disputeData?.data?.reviews?.length || !user?.userGUID) return false;

    const lastReview = disputeData.data.reviews[disputeData.data.reviews.length - 1];

    return lastReview?.assignedTo === user.userGUID;
  }, [disputeData?.data?.reviews, user?.userGUID]);

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
    const sup = filteredSupervisors.find((s: any) => s.employeeId === id);
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
      // Category IDs for department (1000), payment type (1100), dispute status (1002), fine status (1500)
      // AND dispute reasons (16001, 16002) and sub-reasons (1600)
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
    if (type === "source") return EMIRATES[value]?.en || value;
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

  // NEW: Function to get dispute reason label (for main reasons which are category IDs)
  const getDisputeReasonLabel = (reasonId: number) => {
    if (!reasonId) return t("common.noData");

    // For main reasons (16001, 16002), we need to find the category name
    const categoryOption = lookupOptions.find(
      (opt) => (opt.categoryId === 16001 || opt.categoryId === 16002) && opt.value === reasonId,
    );

    if (categoryOption) {
      return i18n.language === "ar" ? categoryOption.categoryNameAr : categoryOption.categoryName;
    }

    // If not found as category, try to find as regular option
    const option = lookupOptions.find((opt) => opt.value === reasonId);
    if (option) {
      return i18n.language === "ar" ? option.labelAr : option.labelEn;
    }

    return reasonId; // Fallback to original value
  };

  // NEW: Function to get dispute sub-reason label
  const getDisputeSubReasonLabel = (subReasonId: number) => {
    if (!subReasonId) return t("common.noData");

    const option = lookupOptions.find((opt) => opt.value === subReasonId);
    if (option) {
      return i18n.language === "ar" ? option.labelAr : option.labelEn;
    }

    return subReasonId; // Fallback to original value
  };

  const handleStatusUpdate = async (action: number) => {
    try {
      const values = await form.validateFields();

      const payload = {
        dispute_Id: storedDisputeId,
        review_Action: action,
        review_Comments: values.review_Comments,
        assignedTo: values.assignedTo || "",
        action_type: action === 1 ? "Assigned" : action === 2 ? "Approved" : "Rejected",
      };

      const response = await updateDisputeStatus(payload).unwrap();
      notification.success(response, t("messages.updateSuccess", { entity: t("sidebar.dispute") }));

      // Refresh the dispute data to get the updated reviews
      triggerGetDisputeById(storedDisputeId);

      // Reset the form
      form.resetFields();

      // Call the callback if provided (but don't close the modal)
      onStatusUpdate?.();
    } catch (error: any) {
      if (error.errorFields) {
        // Validation errors
        return;
      }
      notification.error(error, "Status Update Failed");
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "orange"; // Pending
      case 1:
        return "green"; // Approved
      case 2:
        return "red"; // Rejected
      case 3:
        return "blue"; // Under Review
      default:
        return "default";
    }
  };

  const fineStatusColorMap: Record<number, string> = {
    15001: "orange",
    15002: "green",
    15003: "red",
    15004: "blue",
    15005: "purple", // example
  };

  const getFineStatusColor = (status: number) => fineStatusColorMap[status] || "default";

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "No Date";
    return new Date(dateString).toLocaleString();
  };

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
      bodyStyle={{ padding: 24 }}
    >
      <Spin spinning={isLoading || isUpdating || isLoadingLookups}>
        {/* Custom Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space size="middle" align="center">
              <Title level={4} style={{ margin: 0 }}>
                {t("form.disputereview")} <Text type="danger">#{dispute?.fineId || storedDisputeId}</Text>
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
                    headStyle={{ background: "#fafafa", fontWeight: 600 }}
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

                      {/* FIXED: Display dispute reason with label instead of value */}
                      <Col span={10}>
                        <Text strong>{t("form.reason")}:</Text>
                      </Col>
                      <Col span={14}>{getDisputeReasonLabel(dispute.disputeMainReason || dispute.dispute_Reason)}</Col>

                      {/* FIXED: Display dispute sub-reason with label instead of value */}
                      <Col span={10}>
                        <Text strong>{t("form.subreason")}:</Text>
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
                          ? dayjs(dispute.actualDisputeDate).format("DD-MM-YYYY")
                          : t("common.noData")}
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* Vehicle Details */}
                {dispute.vehicle && Object.values(dispute.vehicle).some((val) => val !== null && val !== "") && (
                  <Col span={12}>
                    <Card
                      title={t("form.vehicleDetails")}
                      size="small"
                      headStyle={{ background: "#fafafa", fontWeight: 600 }}
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
                headStyle={{ background: "#fafafa", fontWeight: 600 }}
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
                <Col span={12}>
                  <Card
                    title={t("common.location")}
                    size="small"
                    style={{ borderRadius: 12, marginBottom: 16 }}
                    headStyle={{ background: "#fafafa", fontWeight: 600 }}
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

                <Col span={12}>
                  <Card
                    title={t("form.AttachedPhotos")}
                    size="small"
                    style={{ borderRadius: 12, marginBottom: 16 }}
                    headStyle={{ background: "#fafafa", fontWeight: 600 }}
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
                  background: "#f0f7ff",
                  marginBottom: 16,
                  height: 760,
                  overflow: "hidden",
                }}
                headStyle={{
                  background: "#e6f2ff",
                  fontWeight: 600,
                  color: "#1d4ed8", // Darker blue for title
                }}
                bodyStyle={{ paddingRight: 8, height: "100%", overflowY: "auto" }}
              >
                {dispute.reviews && dispute.reviews.length > 0 ? (
                  <Timeline>
                    {dispute.reviews.map((review: any, idx: number) => (
                      <Timeline.Item dot={<ClockCircleOutlined style={{ color: "#3b82f6" }} />} color="blue" key={idx}>
                        <div
                          style={{
                            background: "#fff",
                            border: "1px solid #d9d9d9",
                            borderRadius: 8,
                            padding: "10px 14px",
                            marginBottom: 8,
                          }}
                        >
                          {/* Action Tag */}
                          <div style={{ marginBottom: 6 }}>
                            <Tag
                              color={
                                review.review_Action === 2 ? "green" : review.review_Action === 3 ? "red" : "orange"
                              }
                            >
                              {review.review_Action === 1
                                ? t("status.assigned")
                                : review.review_Action === 2
                                  ? t("status.approved")
                                  : review.review_Action === 3
                                    ? t("status.rejected")
                                    : t("common.review")}
                            </Tag>
                          </div>

                          {/* Review Comment */}
                          <Text style={{ display: "block", marginBottom: 6 }}>
                            {review.assignedTo && (
                              <span style={{ marginRight: 8, color: "#2600ffff" }}>
                                {getSupervisorName(review.assignedTo)}
                              </span>
                            )}
                          </Text>

                          {/* Reviewer Info */}
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {review.review_Comments || t("common.noComments")}
                            {review.createdAt && <span>{formatDateTime(review.createdAt)}</span>}
                          </div>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <Empty description="No Review History" />
                )}
              </Card>
            </Col>
          </Row>
        )}

        {/* FOOTER - Action Form - Show for assigned users OR the special role ID */}
        {dispute && (isUserAssignedToDispute || isSpecialRoleId) && (
          <>
            <Divider />
            <Form form={form} layout="vertical">
              <Row gutter={16} align="middle">
                {/* Assignment Controls - Always show for special role ID OR (non-supervisor roles with specific conditions) */}
                {(isSpecialRoleId ||
                  (!isSupervisorRole &&
                    dispute?.fineDetails?.fineStatus !== 15005 &&
                    dispute?.dispute_Status !== 3)) && (
                  <Col span={6}>
                    <Form.Item name="assignedTo" label={<Text strong>{t("form.assignedTo")}</Text>}>
                      <Select
                        placeholder={t("common.selectUser")}
                        loading={isLoadingSupervisors}
                        allowClear
                        showSearch
                        optionFilterProp="children"
                      >
                        {filteredSupervisors.map((sup: any) => (
                          <Select.Option key={sup.employeeId} value={sup.employeeId}>
                            {sup.employeeName} ({sup.roleCode})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                )}

                {/* Comment Box - Always show for special role ID OR when other conditions are met */}
                {(isSpecialRoleId || (dispute?.fineDetails?.fineStatus === 15005 && dispute?.dispute_Status !== 3)) && (
                  <Col span={isSupervisorRole && !isSpecialRoleId ? 14 : 8}>
                    <Form.Item
                      name="review_Comments"
                      label={<Text strong>{t("form.comments")}</Text>}
                      style={{ marginBottom: 0 }}
                      rules={[{ required: true, message: "Please enter your comments" }]}
                    >
                      <TextArea placeholder={t("placeholders.enterComments")} rows={2} />
                    </Form.Item>
                  </Col>
                )}

                {/* Action Buttons - Handle special role ID separately */}
                {(isSpecialRoleId || dispute?.dispute_Status !== 3) && (
                  <Col
                    span={isSupervisorRole && !isSpecialRoleId ? 10 : 8}
                    style={{ textAlign: "right", paddingTop: 30 }}
                  >
                    {isSpecialRoleId ? (
                      // Special role ID efb6ef6a-128b-4dd9-9641-2b04205c8cf8 - ONLY assign button, NO approve/reject
                      <Button
                        type="default"
                        loading={isUpdating && reviewAction === 1}
                        onClick={() => {
                          setReviewAction(1);
                          handleStatusUpdate(1); // Assigned = 1
                        }}
                      >
                        {t("form.assign")}
                      </Button>
                    ) : isSupervisorRole ? (
                      // Supervisor buttons (Approve/Reject) - Only show when fineStatus = 15005
                      dispute?.fineDetails?.fineStatus === 15005 && (
                        <>
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
                        </>
                      )
                    ) : (
                      // Regular user button (Assign) - Only show when fineStatus ≠ 15005
                      dispute?.fineDetails?.fineStatus !== 15005 && (
                        <Button
                          type="default"
                          loading={isUpdating && reviewAction === 1}
                          onClick={() => {
                            setReviewAction(1);
                            handleStatusUpdate(1); // Assigned = 1
                          }}
                        >
                          {t("form.assign")}
                        </Button>
                      )
                    )}
                  </Col>
                )}
              </Row>
            </Form>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default DisputeViewModal;