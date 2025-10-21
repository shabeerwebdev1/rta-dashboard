import React, { useState, useEffect } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Space, Image, Select } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { useUpdateParkonicMutation, useGetParkonicVoilationsQuery } from "../../services/rtkApiFactory";
import { useGetInspectionAttachmentsQuery, getMobileFileUrl } from "../../services/inspectionFileApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppNotification } from "../../utils/notificationManager";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ParkonicViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
  isLoading?: boolean;
  onShare?: () => void;
}

const ParkonicViewDrawer: React.FC<ParkonicViewDrawerProps> = ({ open, onClose, record, isLoading = false }) => {
  const { t, i18n } = useTranslation();
  const { success, error } = useAppNotification();

  const [reviewParkonic, { isLoading: isSubmitting }] = useUpdateParkonicMutation();
  const { data: violationsData, isLoading: violationsLoading } = useGetParkonicVoilationsQuery({});

  // Use the inspection attachments query like in FinesViewDrawer
  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    record ? { inspectionGUID: record.inspectionGUID, entityCode: record.entityCode } : skipToken,
  );

  // Map API response to component expected structure
  const mappedRecord = React.useMemo(() => {
    return record
      ? {
          fineId: record.entityNo,
          plateNumber: record.plateNumber,
          reviewStatus: record.reviewStatus ?? 2,
          rejectionReason: record.rejectionReason || "",
          entryDateTime: record.actualDateTime,
          exitDateTime: record.actualDateTime,
          locationDescription: null,
          originalRecord: record,
        }
      : null;
  }, [record]);

  const [reviewStatus, setReviewStatus] = useState<number | undefined>(undefined);
  const [rejectionReason, setRejectionReason] = useState<string>(mappedRecord?.rejectionReason || "");
  const [selectedViolation, setSelectedViolation] = useState<string | null>(null);

  const statusLabels: Record<number, { en: string; ar: string }> = {
    1: { en: t("status.approved"), ar: "موافق" },
    0: { en: t("status.rejected"), ar: "مرفوض" },
    2: { en: t("status.pending"), ar: "قيد الانتظار" },
  };

  const getStatusTag = (status: number) => {
    const label = statusLabels[status] || { en: t("common.noData"), ar: "غير معروف" };
    const color = status === 1 ? "green" : status === 0 ? "red" : "blue";
    return <Tag color={color}>{label[i18n.language === "ar" ? "ar" : "en"]}</Tag>;
  };

  const handleSubmitReview = async () => {
    if (reviewStatus === 0 && !rejectionReason) {
      error(
        {
          data: {
            en_Msg: t("messages.enterRejectionReason") || "Please provide a rejection reason",
            ar_Msg: "يرجى تقديم سبب الرفض",
          },
        },
        "",
      );
      return;
    }

    if (reviewStatus === 1 && !selectedViolation) {
      error(
        {
          data: {
            en_Msg: t("messages.selectViolation") || "Please select a violation before approving",
            ar_Msg: "يرجى اختيار المخالفة قبل الموافقة",
          },
        },
        "",
      );
      return;
    }

    try {
      await reviewParkonic({
        fineId: mappedRecord?.fineId,
        reviewerName: "CurrentUser",
        reviewTimestamp: new Date().toISOString(),
        reviewStatus,
        updatedby: "CurrentUser",
        rejectionReason,
        violationGUID: selectedViolation,
        inspectionGUID: record?.inspectionGUID,
      }).unwrap();

      success(
        {
          data: {
            en_Msg: t("messages.reviewSubmitted") || "Review submitted successfully",
            ar_Msg: "تم إرسال المراجعة بنجاح",
          },
        },
        "",
      );
      onClose();
    } catch (err: any) {
      error(err, t("messages.reviewFailed") || "Failed to submit review");
    }
  };

  useEffect(() => {
    setReviewStatus(undefined);
    setRejectionReason(mappedRecord?.rejectionReason || "");
    setSelectedViolation(null);
  }, [mappedRecord]);

  return (
    <Modal open={open} onCancel={onClose} width={1000} footer={null} title={null} closable={false}>
      <Spin spinning={isLoading || isSubmitting}>
        {/* Header - Same as FinesViewDrawer */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space size="middle" align="center">
              <Title level={4} style={{ margin: 0 }}>
                {t("form.parkonicdetails")} <Text type="danger">#{mappedRecord?.fineId || "---"}</Text>
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
            </Space>
          </Col>
        </Row>

        {!mappedRecord ? (
          <Empty description="No Data" />
        ) : (
          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Row gutter={16}>
              {/* Parkonic Details */}
              <Col span={12}>
                <Card
                  title={t("form.parkonicdetails")}
                  size="small"
                  headStyle={{ background: "#fafafa", fontWeight: 600 }}
                  style={{ marginBottom: 16, borderRadius: 12 }}
                >
                  <Row gutter={[0, 12]}>
                    <Col span={10}>
                      <Text strong>{t("form.fineNumber")}:</Text>
                    </Col>
                    <Col span={14}>{mappedRecord.fineId || "---"}</Col>

                    <Col span={10}>
                      <Text strong>{t("form.reviewStatus")}:</Text>
                    </Col>
                    <Col span={14}>{getStatusTag(mappedRecord.reviewStatus)}</Col>

                    <Col span={10}>
                      <Text strong>{t("form.entryDateTime")}:</Text>
                    </Col>
                    <Col span={14}>
                      {mappedRecord.entryDateTime ? dayjs(mappedRecord.entryDateTime).format("DD-MM-YYYY ") : "---"}
                    </Col>

                    <Col span={10}>
                      <Text strong>{t("form.source")}:</Text>
                    </Col>
                    <Col span={14}>{record?.sourceCode || "---"}</Col>
                  </Row>
                </Card>
              </Col>

              {/* Additional Information */}
              <Col span={12}>
                <Card
                  title={t("form.vehicleDetails")}
                  size="small"
                  headStyle={{ background: "#fafafa", fontWeight: 600 }}
                  style={{ marginBottom: 16, borderRadius: 12 }}
                >
                  <Row gutter={[0, 12]}>
                    <Col span={10}>
                      <Text strong>{t("form.vehicleNumber")}:</Text>
                    </Col>
                    <Col span={14}>{mappedRecord.plateNumber || "---"}</Col>
                    <Col span={10}>
                      <Text strong>{t("form.plateSource")}</Text>
                    </Col>
                    <Col span={14}>{record?.plateSource || "---"}</Col>

                    <Col span={10}>
                      <Text strong>{t("form.plateCategory")}</Text>
                    </Col>
                    <Col span={14}>{record?.plateCategory || "---"}</Col>

                    <Col span={10}>
                      <Text strong>{t("form.plateCode")}</Text>
                    </Col>
                    <Col span={14}>{record?.plateCode || "---"}</Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            {/* Location Information */}
            <Card
              title={t("common.location")}
              size="small"
              style={{ marginBottom: 16, borderRadius: 12 }}
              headStyle={{ background: "#fafafa", fontWeight: 600 }}
            >
              <Empty description={t("form.NoLocationDataAvailable")} />
            </Card>

            {/* Attached Photos - Same format as FinesViewDrawer */}
            <Card
              title={t("form.AttachedPhotos")}
              size="small"
              style={{ marginBottom: 16, borderRadius: 12 }}
              headStyle={{ background: "#fafafa", fontWeight: 600 }}
            >
              <Spin spinning={isLoadingAttachments}>
                {attachments.length > 0 ? (
                  <Image.PreviewGroup>
                    <Space wrap>
                      {attachments.slice(0, 3).map((file) => (
                        <Image
                          key={file.attachmentGUID}
                          width={100}
                          height={100}
                          src={getMobileFileUrl(file.filePath)}
                          alt={file.fileName}
                          style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                      ))}
                      {attachments.length > 3 && (
                        <div
                          style={{
                            width: 100,
                            height: 100,
                            background: "#f5f5f5",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text type="secondary">+{attachments.length - 3} more</Text>
                        </div>
                      )}
                    </Space>
                  </Image.PreviewGroup>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
                )}
              </Spin>
            </Card>

            {/* Review Section */}
            <Card
              title={t("common.review")}
              size="small"
              style={{ marginBottom: 16, borderRadius: 12 }}
              headStyle={{ background: "#fafafa", fontWeight: 600 }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Select
                  value={reviewStatus}
                  onChange={(value) => setReviewStatus(value)}
                  style={{ width: "100%" }}
                  placeholder={t("form.selectReviewStatus")}
                >
                  <Option value={1}>{t("common.approve")}</Option>
                  <Option value={0}>{t("common.reject")}</Option>
                </Select>

                {/* Violations dropdown - only show if approving */}
                {reviewStatus === 1 && (
                  <Select
                    placeholder={t("form.selectViolation")}
                    value={selectedViolation || undefined}
                    onChange={(value) => setSelectedViolation(value)}
                    loading={violationsLoading}
                    style={{ width: "100%" }}
                  >
                    {violationsData?.map((violation: any) => (
                      <Option key={violation.violationGUID} value={violation.violationGUID}>
                        {i18n.language === "ar" ? violation.violationNameAr : violation.violationNameEn}
                      </Option>
                    ))}
                  </Select>
                )}

                {reviewStatus === 0 && (
                  <TextArea
                    placeholder={t("messages.enterRejectionReason")}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    style={{ width: "100%" }}
                  />
                )}

                <div style={{ textAlign: "right", marginTop: 16 }}>
                  <Button onClick={onClose} style={{ marginRight: 8 }}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="primary" loading={isSubmitting} onClick={handleSubmitReview}>
                    {t("common.submit")}
                  </Button>
                </div>
              </Space>
            </Card>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default ParkonicViewDrawer;
