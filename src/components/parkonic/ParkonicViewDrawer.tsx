/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Space, Image, Divider } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  useUpdateParkonicMutation,
  useGetInspectionAttachmentsQuery,
  getMobileFileUrl,
} from "../../services/rtkApiFactory";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppNotification } from "../../utils/notificationManager";
import dayjs from "dayjs";
import { plateSources, PLATE_TYPE_SHORT, PLATE_COLOR } from "../../config/pageConfigs/finesConfig";
import UAEPlate from "../UAEPlate";
import "dayjs/locale/ar";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ParkonicViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
  isLoading?: boolean;
}

const ParkonicViewDrawer: React.FC<ParkonicViewDrawerProps> = ({ open, onClose, record, isLoading = false }) => {
  const { t, i18n } = useTranslation();
  const { success, error } = useAppNotification();
  const [modal, contextHolder] = Modal.useModal();
  const [reviewParkonic, { isLoading: isSubmitting }] = useUpdateParkonicMutation();

  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    record
      ? {
          inspectionGUID: record.inspectionGUID,
          entityCode: record.entityCode,
        }
      : skipToken,
  );

  const formatDateTime = (value: number) => {
    if (!value) return "";

    const lang = localStorage.getItem("i18nextLng") || (document.documentElement.dir === "rtl" ? "ar" : "en");

    const isArabic = lang.startsWith("ar");

    return dayjs(value)
      .locale(isArabic ? "ar" : "en")
      .format(isArabic ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A");
  };
  const mappedRecord = React.useMemo(() => {
    return record
      ? {
          fineId: record.entityNo,
          plateNumber: record.plateNumber,
          reviewStatus: record.reviewStatus ?? 2,
          rejectionReason: record.rejectionReason || "",
          entryDateTime: record.startDateTime,
          exitDateTime: record.endDateTime,
        }
      : null;
  }, [record]);

  /** Violation Details (scalable for future multiple violations) */
  const violationDetails = React.useMemo(() => {
    if (!record) return [];

    return [
      {
        violationCategoryId: record.categoryId,
        violationNameEn: record.violationNameEn,
        violationNameAr: record.violationNameAr,
        violationAmount: record.violationAmount,
      },
    ];
  }, [record]);

  const [rejectionReason, setRejectionReason] = useState<string>("");

  const isPending = mappedRecord?.reviewStatus === 0;
  const isIntegrationFailed = record?.review_updateback_status === 2;

  const statusLabels: Record<number, { en: string; ar: string }> = {
    1: { en: t("status.approved"), ar: "موافق" },
    2: { en: t("status.rejected"), ar: "مرفوض" },
    0: { en: t("status.pending"), ar: "قيد الانتظار" },
  };

  const getStatusTag = (status: number) => {
    const label = statusLabels[status];
    const color = status === 1 ? "green" : status === 0 ? "blue" : "red";
    return <Tag color={color}>{label?.[i18n.language === "ar" ? "ar" : "en"]}</Tag>;
  };

  const submitReview = async (action: 1 | 2) => {
    // Validation handled by backend only
    if (action === 2 && !rejectionReason.trim()) {
      error(
        {
          data: {
            en_Msg: "Rejection comments are required",
            ar_Msg: "سبب الرفض مطلوب",
          },
        },
        "",
      );
      return;
    }

    try {
      const payload = {
        iid: record?.iid,
        review_Action: action, // 1 approve, 2 reject
        review_Comments: action === 2 ? rejectionReason.trim() : "",
      };

      const response = await reviewParkonic(payload).unwrap();

      // ✅ SUCCESS → backend message only
      success(response, "");

      onClose();
    } catch (err: any) {
      // ✅ ERROR → backend message only
      error(err, "");
    }
  };

  const confirmApprove = () => {
    modal.confirm({
      title: t("common.confirmApproval"),
      content: t("common.confirmApprovalContent"),
      okText: t("common.approve"),
      cancelText: t("common.cancel"),
      onOk: () => submitReview(1), // ✅ APPROVE
    });
  };

  const confirmReject = () => {
    modal.confirm({
      title: t("common.confirmRejection"),
      content: t("common.confirmRejectionContent"),
      okText: t("common.reject"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () => submitReview(2), // ✅ REJECT
    });
  };

  const rejectionValidationMsg = i18n.language === "ar" ? "الرجاء إدخال سبب الرفض" : "Please enter rejection comments";

  useEffect(() => {
    setRejectionReason(mappedRecord?.rejectionReason || "");
  }, [mappedRecord]);

  // Helper function to construct the complete file path
  const getCompleteFilePath = (file: any) => {
    // Check if filePath already contains the filename
    if (file.filePath && file.filePath.includes(file.fileName)) {
      return file.filePath;
    }
    // Otherwise, combine filePath and fileName
    const separator = file.filePath.endsWith("\\") ? "" : "\\";
    return `${file.filePath}${separator}${file.fileName}`;
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={onClose}
        width={1100}
        footer={null}
        closable={false}
        centered
        styles={{
          body: {
            padding: "24px",
            maxHeight: "85vh",
            overflowY: "auto",
          },
        }}
      >
        <Spin spinning={isLoading || isSubmitting}>
          {/* Header with border */}
          <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "16px", marginBottom: "24px" }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4} style={{ margin: 0 }}>
                  {t("form.parkonicdetails")}
                  <Text type="danger" style={{ marginLeft: "8px", fontWeight: 600 }}>
                    #{mappedRecord?.fineId}
                  </Text>
                </Title>
              </Col>
              <Col>
                <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: "16px" }} />
              </Col>
            </Row>
          </div>

          {!mappedRecord ? (
            <Empty />
          ) : (
            <>
              {/* Main Content - Two Column Layout */}
              <Row gutter={[24, 24]}>
                {/* Left Column */}
                <Col span={12}>
                  {/* Parkonic Details Card */}
                  <Card
                    title={
                      <Text strong style={{ fontSize: "16px" }}>
                        {t("form.parkonicdetails")}
                      </Text>
                    }
                    size="small"
                    styles={{
                      body: { padding: "20px" },
                    }}
                  >
                    <Row gutter={[0, 16]}>
                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.fineNumber")}:
                        </Text>
                      </Col>
                      <Col span={14}>
                        <Text strong>{mappedRecord.fineId}</Text>
                      </Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.status")}:
                        </Text>
                      </Col>
                      <Col span={14}>{getStatusTag(mappedRecord.reviewStatus)}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.vehicleEntryDateTime")}:
                        </Text>
                      </Col>
                      <Col span={14}>{formatDateTime(mappedRecord.entryDateTime)}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.vehicleExitDateTime")}:
                        </Text>
                      </Col>
                      <Col span={14}>{formatDateTime(mappedRecord.exitDateTime)}</Col>
                    </Row>
                  </Card>

                  {/* Violation Details Card */}
                  <Card
                    title={
                      <Text strong style={{ fontSize: "16px" }}>
                        {t("form.violationDetails")}
                      </Text>
                    }
                    size="small"
                    styles={{
                      body: { padding: "20px" },
                    }}
                    style={{ marginTop: "24px" }}
                  >
                    {violationDetails.length === 0 ? (
                      <Empty description={t("form.Noviolationdetailsavailable")} />
                    ) : (
                      <Row gutter={[0, 16]}>
                        <Col span={10}>
                          <Text strong style={{ color: "#666" }}>
                            {t("form.violationCategoryId")}:
                          </Text>
                        </Col>
                        <Col span={14}>{violationDetails[0].violationCategoryId ?? "No Data"}</Col>

                        <Col span={10}>
                          <Text strong style={{ color: "#666" }}>
                            {t("form.violationDescription")}:
                          </Text>
                        </Col>
                        <Col span={14}>
                          {i18n.language === "ar"
                            ? violationDetails[0].violationNameAr
                            : violationDetails[0].violationNameEn}
                        </Col>

                        <Col span={10}>
                          <Text strong style={{ color: "#666" }}>
                            {t("form.amount")}:
                          </Text>
                        </Col>
                        <Col span={14}>
                          <Text strong type="danger" style={{ fontSize: "16px", fontWeight: 600 }}>
                            {violationDetails[0].violationAmount} AED
                          </Text>
                        </Col>
                      </Row>
                    )}
                  </Card>

                  {/* Notes Card */}
                  <Card
                    title={
                      <Text strong style={{ fontSize: "16px" }}>
                        {t("form.notes")}
                      </Text>
                    }
                    size="small"
                    styles={{
                      body: { padding: "20px", minHeight: "120px" },
                    }}
                    style={{ marginTop: "24px" }}
                  >
                    {record?.notes ? (
                      <Text style={{ whiteSpace: "pre-wrap" }}>{record.notes}</Text>
                    ) : (
                      <Empty description={t("form.noNotesAvailable")} />
                    )}
                  </Card>
                </Col>

                {/* Right Column */}
                <Col span={12}>
                  {/* Vehicle Details Card with Plate */}
                  <Card
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text strong style={{ fontSize: "16px" }}>
                          {t("form.vehicleDetails")}
                        </Text>
                        <div style={{ marginTop: "4px" }}>
                          <UAEPlate
                            code={record?.plateCode ? PLATE_COLOR[record.plateCode] : "---"}
                            number={record?.plateNumber ?? "---"}
                            emirateEn={record?.plateSource ? plateSources[record.plateSource]?.en || "" : ""}
                            emirateAr={record?.plateSource ? plateSources[record.plateSource]?.ar || "" : ""}
                          />
                        </div>
                      </div>
                    }
                    size="small"
                    styles={{
                      body: { padding: "20px" },
                    }}
                  >
                    <Row gutter={[0, 16]}>
                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.plateNumber")}:
                        </Text>
                      </Col>
                      <Col span={14}>{record?.plateNumber || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.plateSource")}:
                        </Text>
                      </Col>
                      <Col span={14}>{record?.plateSource ? plateSources[record.plateSource]?.en : "---"}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.plateCategory")}:
                        </Text>
                      </Col>
                      <Col span={14}>{record?.plateCategory ? PLATE_TYPE_SHORT[record.plateCategory] : "---"}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.plateCode")}:
                        </Text>
                      </Col>
                      <Col span={14}>{record?.plateCode ? PLATE_COLOR[record.plateCode] : "---"}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.vehicleColor")}:
                        </Text>
                      </Col>
                      <Col span={14}>{record?.vehicleColor || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.vehicleType")}:
                        </Text>
                      </Col>
                      <Col span={14}>{record?.vehicleType || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.vehicleBrand")}:
                        </Text>
                      </Col>
                      <Col span={14}>{record?.vehicleBrand || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.manufacturerYear")}:
                        </Text>
                      </Col>
                      <Col span={14}>{record?.manufacturerYear || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong style={{ color: "#666" }}>
                          {t("form.vehicleOwnerName")}:
                        </Text>
                      </Col>
                      <Col span={14}>{record?.vehicleOwnerName || "No Data"}</Col>
                    </Row>
                  </Card>

                  {/* Photos Section */}
                  <Card
                    title={
                      <Text strong style={{ fontSize: "16px" }}>
                        {t("form.AttachedPhotos")}
                      </Text>
                    }
                    size="small"
                    styles={{
                      body: { padding: "20px" },
                    }}
                    style={{ marginTop: "24px" }}
                  >
                    <Spin spinning={isLoadingAttachments}>
                      {attachments.length > 0 ? (
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                          {attachments.map((file) => {
                            const completeFilePath = getCompleteFilePath(file);
                            return (
                              <div key={file.attachmentGUID} style={{ position: "relative" }}>
                                <Image
                                  width={120}
                                  height={120}
                                  src={getMobileFileUrl(completeFilePath)}
                                  alt={file.fileName}
                                  style={{
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    border: "1px solid #f0f0f0",
                                  }}
                                  preview={{
                                    mask: null,
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={t("common.noData")}
                          style={{ padding: "20px 0" }}
                        />
                      )}
                    </Spin>
                  </Card>

                  {/* Comments Section */}
                  {isPending && (
                    <Card
                      title={
                        <Text strong style={{ fontSize: "16px" }}>
                          {t("form.comments")}
                        </Text>
                      }
                      size="small"
                      styles={{
                        body: { padding: "20px" },
                      }}
                      style={{ marginTop: "24px" }}
                    >
                      <TextArea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={5}
                        placeholder={rejectionValidationMsg}
                        style={{ borderRadius: "6px" }}
                      />
                    </Card>
                  )}
                </Col>
              </Row>

              {/* Action Buttons - Fixed at bottom */}
              <Divider style={{ margin: "32px 0 24px 0" }} />
              <Row justify="end">
                <Space size="middle">
                  <Button onClick={onClose} size="large">
                    {t("common.cancel")}
                  </Button>

                  {/* Show Approve / Reject ONLY when Pending */}
                  {isPending && (
                    <>
                      <Button danger onClick={confirmReject} size="large" style={{ minWidth: "100px" }}>
                        {t("common.reject")}
                      </Button>
                      <Button type="primary" onClick={confirmApprove} size="large">
                        {t("common.approve")}
                      </Button>
                    </>
                  )}

                  {/* Show Resubmit ONLY when not pending AND integration failed */}
                  {!isPending && isIntegrationFailed && (
                    <Button type="primary" size="large">
                      {t("common.resubmit") || "Resubmit"}
                    </Button>
                  )}
                </Space>
              </Row>
            </>
          )}
        </Spin>
      </Modal>
    </>
  );
};

export default ParkonicViewDrawer;
