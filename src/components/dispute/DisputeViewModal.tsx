import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Image,
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
  useLazyGetLookupsQuery, // Add this import
} from "../../services/rtkApiFactory";
import { useAppNotification } from "../../utils/notificationManager";

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

  const [triggerGetDisputeById, { data: disputeData, isLoading }] = useLazyGetDisputeByIdQuery();
  const [updateDisputeStatus, { isLoading: isUpdating }] = useUpdateDisputeStatusMutation();
  const [triggerGetLookups] = useLazyGetLookupsQuery(); // Add this

  const [reviewAction, setReviewAction] = useState<number>(2); // 2=Approved, 3=Rejected
  const [storedDisputeId, setStoredDisputeId] = useState<string>("");
  const [lookupOptions, setLookupOptions] = useState<any[]>([]); // Add this state
  const [isLoadingLookups, setIsLoadingLookups] = useState(false); // Add this state

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
      const categoryIds = [1000, 1100];
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
                {dispute?.dispute_Status !== undefined && (
                  <Tag color={getStatusColor(dispute.dispute_Status)} style={{ marginLeft: 8 }}>
                    {getStatusText(dispute.dispute_Status)}
                  </Tag>
                )}
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

                  {/* Fine Details */}
                  <Col span={12}>
                    <Card
                      title="Fine Details"
                      size="small"
                      style={{ borderRadius: 12, marginBottom: 16 }}
                      headStyle={{ background: "#fafafa", fontWeight: 600 }}
                    >
                      {dispute.fineDetails ? (
                        <Row gutter={[0, 12]}>
                          <Col span={10}>
                            <Text strong>Fine Number:</Text>
                          </Col>
                          <Col span={14}>{dispute.fineDetails.fineNo || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Fine Type:</Text>
                          </Col>
                          <Col span={14}>{dispute.fineDetails.fineType || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Fine Amount:</Text>
                          </Col>
                          <Col span={14}>
                            {dispute.fineDetails.fineAmount ? (
                              <Text type="danger" strong>
                                {dispute.fineDetails.fineAmount} AED
                              </Text>
                            ) : (
                              "No Data"
                            )}
                          </Col>

                          <Col span={10}>
                            <Text strong>Fine Status:</Text>
                          </Col>
                          <Col span={14}>
                            <Tag color={dispute.fineDetails.fineStatus === "Pending" ? "orange" : "green"}>
                              {dispute.fineDetails.fineStatus || "No Data"}
                            </Tag>
                          </Col>

                          <Col span={10}>
                            <Text strong>Section:</Text>
                          </Col>
                          <Col span={14}>{dispute.fineDetails.section || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Supervisor ID:</Text>
                          </Col>
                          <Col span={14}>{dispute.fineDetails.supervisorID || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Device Number:</Text>
                          </Col>
                          <Col span={14}>{dispute.fineDetails.inspectionDeviceNo || "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>Comments:</Text>
                          </Col>
                          <Col span={14}>{dispute.fineDetails.comments || "No Data"}</Col>
                        </Row>
                      ) : (
                        <Empty description="No Fine Details Available" />
                      )}
                    </Card>
                  </Col>
                </Row>

                {/* Vehicle Details (if available) */}
                {dispute.vehicle && (
                  <Card
                    title="Vehicle Details"
                    size="small"
                    style={{ borderRadius: 12, marginBottom: 16 }}
                    headStyle={{ background: "#fafafa", fontWeight: 600 }}
                  >
                    <Row gutter={16}>
                      <Col span={4}>
                        <Text strong>Plate:</Text> {dispute.vehicle.plateNumber || "No Data"}
                      </Col>
                      <Col span={4}>
                        <Text strong>Type:</Text> {dispute.vehicle.vehicleType || "No Data"}
                      </Col>
                      <Col span={4}>
                        <Text strong>Brand:</Text> {dispute.vehicle.brand || "No Data"}
                      </Col>
                      <Col span={4}>
                        <Text strong>Color:</Text> {dispute.vehicle.color || "No Data"}
                      </Col>
                      <Col span={4}>
                        <Text strong>Owner:</Text> {dispute.vehicle.ownerName || "No Data"}
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* Evidence & Location */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Card
                      title="Evidence"
                      size="small"
                      style={{ borderRadius: 12, marginBottom: 16 }}
                      headStyle={{ background: "#fafafa", fontWeight: 600 }}
                    >
                      {dispute.fineDetails?.documents ? (
                        <Row justify="center">
                          <Col>
                            <Text>{dispute.fineDetails.documents}</Text>
                          </Col>
                        </Row>
                      ) : (
                        <Empty description="No Evidence Available" />
                      )}
                    </Card>
                  </Col>

                  <Col span={12}>
                    <Card
                      title="Location"
                      size="small"
                      style={{ borderRadius: 12, marginBottom: 16 }}
                      headStyle={{ background: "#fafafa", fontWeight: 600 }}
                    >
                      {dispute.fineDetails?.latitude && dispute.fineDetails?.longitude ? (
                        <iframe
                          title="location-map"
                          width="100%"
                          height="200"
                          style={{ border: 0, borderRadius: 8 }}
                          src={`https://www.google.com/maps?q=${dispute.fineDetails.latitude},${dispute.fineDetails.longitude}&z=15&output=embed`}
                        />
                      ) : (
                        <Empty description="No Location Data Available" />
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
                              <Text type="secondary">Assigned to: {review.assignedTo}</Text>
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
                <Row gutter={16} align="bottom">
                  <Col span={8}>
                    <Form.Item
                      name="review_Comments"
                      label={<Text strong>Comment *</Text>}
                      rules={[{ required: true, message: "Please enter your comments" }]}
                    >
                      <TextArea placeholder="Enter your review comments" rows={3} />
                    </Form.Item>
                  </Col>

                  <Col span={4}>
                    <Form.Item name="assignedTo" label={<Text strong>Assign To</Text>}>
                      <Select placeholder="Select Supervisor">
                        <Select.Option value="supervisor1">Supervisor 1</Select.Option>
                        <Select.Option value="supervisor2">Supervisor 2</Select.Option>
                        <Select.Option value="supervisor3">Supervisor 3</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={10} style={{ textAlign: "right", paddingTop: 30 }}>
                    <Button onClick={onClose} style={{ marginRight: 8 }} disabled={isUpdating}>
                      Cancel
                    </Button>
                    <Button
                      type="default"
                      style={{ marginRight: 8 }}
                      loading={isUpdating && reviewAction === 1}
                      onClick={() => {
                        setReviewAction(1);
                        handleStatusUpdate(1); // Assigned = 1
                      }}
                    >
                      Assign
                    </Button>
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
