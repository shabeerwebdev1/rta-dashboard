import React, { useState, useEffect, useRef } from "react";
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
    user?.roleGUID === "EFB6EF6A-128B-4DD9-9641-2B04205C8CF8" ||
    user?.roleGUID === "137db453-07cc-4218-9ef8-3aa236d9e951"; 

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
    return sup ? sup.employeeName : id; // fallback to ID if not found
  };

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
      // Category IDs for department (1000) and payment type (1100)
      const categoryIds = [1000, 1100, 1002, 1500]; // Added dispute status category
      const result = await triggerGetLookups(categoryIds).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
    } finally {
      setIsLoadingLookups(false);
    }
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
      notification.success(response, t("messages.updateSuccess", { entity: "Dispute Status" }));

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

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
        return "Approved";
      case 2:
        return "Rejected";
      case 3:
        return "Under Review";
      default:
        return "Unknown";
    }
  };

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
      width={1400}
      footer={null}
      title={null}
      closable={false}
      bodyStyle={{ padding: 24 }}
    >
      <Spin spinning={isLoading || isUpdating || isLoadingLookups}>
        <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
          {/* Custom Header */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                Dispute Review <Text type="danger">#{dispute?.fine_Number || storedDisputeId}</Text>
                {/* {dispute?.dispute_Status !== undefined && (
                  <Tag color={getStatusColor(dispute.dispute_Status)} style={{ marginLeft: 8 }}>
                    {getStatusText(dispute.dispute_Status)}
                  </Tag>
                )} */}
              </Title>
            </Col>
            <Col>
              <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
            </Col>
          </Row>

          {!dispute ? (
            <Empty description="No Data Available" />
          ) : (
            <Row gutter={24}>
              {/* LEFT SIDE */}
              <Col span={18}>
                <Row gutter={16}>
                  {/* Dispute Details */}
                  <Col span={12}>
                    <Card
                      title="Dispute Details"
                      size="small"
                      headStyle={{ background: "#fafafa", fontWeight: 600 }}
                      style={{ marginBottom: 16 }}
                    >
                      <Row gutter={[0, 12]}>
                        <Col span={10}>
                          <Text strong>Fine Number:</Text>
                        </Col>
                        <Col span={14}>{dispute.fine_Number || "No Data"}</Col>

                        <Col span={10}>
                          <Text strong>Department:</Text>
                        </Col>
                        <Col span={14}>
                          {dispute.department ? getLabelFromValue(dispute.department, 1000) : "No Data"}
                        </Col>

                        <Col span={10}>
                          <Text strong>Payment Type:</Text>
                        </Col>
                        <Col span={14}>
                          {dispute.payment_Type ? getLabelFromValue(dispute.payment_Type, 1100) : "No Data"}
                        </Col>

                        <Col span={10}>
                          <Text strong>Dispute Reason:</Text>
                        </Col>
                        <Col span={14}>{dispute.dispute_Reason || "No Data"}</Col>

                        <Col span={10}>
                          <Text strong>Email:</Text>
                        </Col>
                        <Col span={14}>{dispute.email || "No Data"}</Col>

                        <Col span={10}>
                          <Text strong>Phone Number:</Text>
                        </Col>
                        <Col span={14}>{dispute.phone || "No Data"}</Col>

                        <Col span={10}>
                          <Text strong>CRM Reference:</Text>
                        </Col>
                        <Col span={14}>{dispute.crM_Ref || "No Data"}</Col>

                        <Col span={10}>
                          <Text strong>Address:</Text>
                        </Col>
                        <Col span={14}>{dispute.address || "No Data"}</Col>
                      </Row>
                    </Card>
                  </Col>

                  {/* Vehicle Details (changed to column layout like Dispute Details) */}
                  {dispute.vehicle && (
                    <Col span={12}>
                      <Card
                        title="Vehicle Details"
                        size="small"
                        headStyle={{ background: "#fafafa", fontWeight: 600 }}
                        style={{ marginBottom: 16 }}
                      >
                        <Row gutter={[0, 12]}>
                          <Col span={10}>
                            <Text strong>Plate Number:</Text>
                          </Col>
                          <Col span={14}>{dispute.vehicle.plateNumber || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Plate Color:</Text>
                          </Col>
                          <Col span={14}>{dispute.vehicle.plateColor || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Plate Type:</Text>
                          </Col>
                          <Col span={14}>{dispute.vehicle.plateType || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Plate Source:</Text>
                          </Col>
                          <Col span={14}>{dispute.vehicle.plateSource || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Vehicle Brand:</Text>
                          </Col>
                          <Col span={14}>{dispute.vehicle.vehicleBrand || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Vehicle Type:</Text>
                          </Col>
                          <Col span={14}>{dispute.vehicle.vehicleType || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Vehicle Color:</Text>
                          </Col>
                          <Col span={14}>{dispute.vehicle.vehicleColor || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Manufacturer Year:</Text>
                          </Col>
                          <Col span={14}>{dispute.vehicle.manufacturerYear || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Owner Name:</Text>
                          </Col>
                          <Col span={14}>{dispute.vehicle.ownerName || "No Data"}</Col>
                        </Row>
                      </Card>
                    </Col>
                  )}
                </Row>

                {/* Fine Details (changed to row layout like Vehicle Details) */}
                <Card
                  title="Fine Details"
                  size="small"
                  style={{ borderRadius: 12, marginBottom: 16 }}
                  headStyle={{ background: "#fafafa", fontWeight: 600 }}
                >
                  {dispute.fineDetails ? (
                    <Row gutter={16}>
                      <Col span={8}>
                        <Text strong>Fine Amount:</Text>
                        {dispute.fineDetails.fineAmount !== null && dispute.fineDetails.fineAmount !== undefined ? (
                          <Text type="danger" strong style={{ display: "block", marginTop: 4 }}>
                            {dispute.fineDetails.fineAmount} AED
                          </Text>
                        ) : (
                          <Text style={{ display: "block", marginTop: 4 }}>No Data</Text>
                        )}
                      </Col>

                      <Col span={8}>
                        <Text strong>Fine Status:</Text>
                        {dispute.fineDetails.fineStatus ? (
                          <div style={{ marginTop: 4 }}>
                            <Tag color={getStatusColor(dispute.fineDetails.fineStatus)}>
                              {getLabelFromValue(dispute.fineDetails.fineStatus, 1500)}
                            </Tag>
                          </div>
                        ) : (
                          <Text style={{ display: "block", marginTop: 4 }}>No Data</Text>
                        )}
                      </Col>

                      <Col span={8}>
                        <Text strong>Fine Number:</Text>
                        <Text style={{ display: "block", marginTop: 4 }}>
                          {dispute.fineDetails.fineNo || "No Data"}
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
                      title="Location Map"
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
                        <Empty description="No Location Data Available" />
                      )}
                    </Card>
                  </Col>

                  <Col span={12}>
                    <Card
                      title="Evidence Photos"
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
                        <Empty description="No Photos Available" />
                      )}
                    </Card>
                  </Col>
                </Row>
              </Col>

              {/* RIGHT SIDE - Review Timeline */}
              <Col span={6}>
                <Card
                  title="Review Timeline"
                  size="small"
                  style={{ borderRadius: 12, background: "#f0f7ff", marginBottom: 16 }}
                  headStyle={{ background: "#e6f2ff", fontWeight: 600 }}
                >
                  {dispute.reviews && dispute.reviews.length > 0 ? (
                    <Timeline>
                      {dispute.reviews.map((review: any, idx: number) => (
                        <Timeline.Item dot={<ClockCircleOutlined />} color="blue" key={idx}>
                          <Text strong>
                            {review.review_Action === 1
                              ? "Assigned"
                              : review.review_Action === 2
                                ? "Approved"
                                : review.review_Action === 3
                                  ? "Rejected"
                                  : "Review"}
                          </Text>
                          <br />
                          <Text type="secondary">{review.review_Comments || "No Comments"}</Text>
                          {review.assignedTo && (
                            <>
                              <br />
                              <Text type="secondary">Assigned to: {getSupervisorName(review.assignedTo)}</Text>
                            </>
                          )}

                          {review.createdAt && (
                            <>
                              <br />
                              <Text type="secondary" style={{ fontSize: "10px" }}>
                                {formatDateTime(review.createdAt)}
                              </Text>
                            </>
                          )}
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

          {/* FOOTER - Action Form */}
          {dispute && (
            <>
              <Divider />
              <Form form={form} layout="vertical">
                <Row gutter={16} align="middle">
                  {/* Assignment Controls - Only show for non-supervisor roles */}
                  {!isSupervisorRole && (
                    <>
                      <Col span={6}>
                        <Form.Item name="assignedTo" label={<Text strong>Assign To</Text>}>
                          <Select
                        placeholder="Select Supervisor"
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
                    </>
                  )}

                  {/* Comment Box */}
                  <Col span={isSupervisorRole ? 14 : 8}>
                    <Form.Item
                      name="review_Comments"
                      label={<Text strong>Comment</Text>}
                      style={{ marginBottom: 0 }}
                      rules={[{ required: true, message: "Please enter your comments" }]}
                    >
                      <TextArea placeholder="Enter your review comments" rows={2} />
                    </Form.Item>
                  </Col>

                  {/* Action Buttons */}
                  <Col span={isSupervisorRole ? 10 : 8} style={{ textAlign: "right", paddingTop: 30 }}>
                    {isSupervisorRole ? (
                      // Supervisor buttons (Approve/Reject)
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
                          Approve
                        </Button>
                        <Button
                          danger
                          loading={isUpdating && reviewAction === 3}
                          onClick={() => {
                            setReviewAction(3);
                            handleStatusUpdate(3); // Rejected = 3
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      // Regular user button (Assign)
                      <Button
                        type="default"
                        loading={isUpdating && reviewAction === 1}
                        onClick={() => {
                          setReviewAction(1);
                          handleStatusUpdate(1); // Assigned = 1
                        }}
                      >
                        Assign
                      </Button>
                    )}
                  </Col>
                </Row>
              </Form>
            </>
          )}
        </Card>
      </Spin>
    </Modal>
  );
};

export default DisputeViewModal;