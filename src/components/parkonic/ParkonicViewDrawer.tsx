/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Modal, Card, Row, Col, Typography, Button, Input, Empty, Spin, Tag, Space, Image } from "antd";
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

  const statusLabels: Record<number, { en: string; ar: string }> = {
    1: { en: t("status.approved"), ar: "موافق" },
    0: { en: t("status.rejected"), ar: "مرفوض" },
    2: { en: t("status.pending"), ar: "قيد الانتظار" },
  };

  const getStatusTag = (status: number) => {
    const label = statusLabels[status];
    const color = status === 1 ? "green" : status === 0 ? "red" : "blue";
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
      <Modal open={open} onCancel={onClose} width={1000} footer={null} closable={false}>
        <Spin spinning={isLoading || isSubmitting}>
          {/* Header */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={4}>
                {t("form.parkonicdetails")} <Text type="danger">#{mappedRecord?.fineId}</Text>
              </Title>
            </Col>
            <Col>
              <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
            </Col>
          </Row>

          {!mappedRecord ? (
            <Empty />
          ) : (
            <>
              {/* Details */}
              <Row gutter={16}>
                <Col span={12}>
                  <Card title={t("form.parkonicdetails")} size="small">
                    <Row gutter={[0, 12]}>
                      <Col span={10}>
                        <Text strong>{t("form.fineNumber")}:</Text>
                      </Col>
                      <Col span={14}>{mappedRecord.fineId}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.status")}:</Text>
                      </Col>
                      <Col span={14}>{getStatusTag(mappedRecord.reviewStatus)}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.vehicleEntryDateTime")}:</Text>
                      </Col>
                      <Col span={14}>{formatDateTime(mappedRecord.entryDateTime)}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.vehicleExitDateTime")}:</Text>
                      </Col>
                      <Col span={14}>{formatDateTime(mappedRecord.exitDateTime)}</Col>
                    </Row>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card
                    title={
                      <span
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <span>{t("form.vehicleDetails")}</span>
                        <span style={{ marginTop: "5px" }}>
                          <UAEPlate
                            code={record?.plateCode ? PLATE_COLOR[record.plateCode] : "---"}
                            number={record?.plateNumber ?? "---"}
                            emirateEn={record?.plateSource ? plateSources[record.plateSource]?.en || "" : ""}
                            emirateAr={record?.plateSource ? plateSources[record.plateSource]?.ar || "" : ""}
                          />
                        </span>
                      </span>
                    }
                    size="small"
                  >
                    <Row gutter={[0, 12]}>
                      <Col span={10}>
                        <Text strong>{t("form.plateNumber")}:</Text>
                      </Col>
                      <Col span={14}>{record?.plateNumber || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.plateSource")}:</Text>
                      </Col>
                      <Col span={14}>{record?.plateSource ? plateSources[record.plateSource]?.en : "---"}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.plateCategory")}:</Text>
                      </Col>
                      <Col span={14}>{record?.plateCategory ? PLATE_TYPE_SHORT[record.plateCategory] : "---"}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.plateCode")}:</Text>
                      </Col>
                      <Col span={14}>{record?.plateCode ? PLATE_COLOR[record.plateCode] : "---"}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.vehicleColor")}:</Text>
                      </Col>
                      <Col span={14}>{record?.vehicleColor || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.vehicleType")}:</Text>
                      </Col>
                      <Col span={14}>{record?.vehicleType || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.vehicleBrand")}:</Text>
                      </Col>
                      <Col span={14}>{record?.vehicleBrand || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.manufacturerYear")}:</Text>
                      </Col>
                      <Col span={14}>{record?.manufacturerYear || "No Data"}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.vehicleOwnerName")}:</Text>
                      </Col>
                      <Col span={14}>{record?.vehicleOwnerName || "No Data"}</Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
              {/* Violation Details */}
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Card title={t("form.violationDetails")} size="small" style={{ borderRadius: 12 }}>
                    {violationDetails.length === 0 ? (
                      <Empty description={t("form.Noviolationdetailsavailable")} />
                    ) : (
                      violationDetails.map((violation, index) => (
                        <Row key={index} gutter={[0, 12]}>
                          <Col span={10}>
                            <Text strong>{t("form.violationCategoryId")}:</Text>
                          </Col>
                          <Col span={14}>{violation.violationCategoryId ?? "No Data"}</Col>

                          <Col span={10}>
                            <Text strong>{t("form.violationDescription")}:</Text>
                          </Col>
                          <Col span={14}>
                            {i18n.language === "ar" ? violation.violationNameAr : violation.violationNameEn}
                          </Col>

                          <Col span={10}>
                            <Text strong>{t("form.amount")}:</Text>
                          </Col>
                          <Col span={14}>
                            <Text strong type="danger">
                              {violation.violationAmount} AED
                            </Text>
                          </Col>
                        </Row>
                      ))
                    )}
                  </Card>
                </Col>

                <Col span={12}>
                  <Card title={t("form.notes")} size="small" style={{ borderRadius: 12 }}>
                    {record?.notes ? <Text>{record.notes}</Text> : <Empty description={t("form.noNotesAvailable")} />}
                  </Card>
                </Col>
              </Row>
              {/* Photos - FIXED SECTION */}
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Card title={t("form.AttachedPhotos")} size="small">
                    <Spin spinning={isLoadingAttachments}>
                      {attachments.length > 0 ? (
                        <Image.PreviewGroup>
                          <Space wrap>
                            {attachments.map((file) => {
                              const completeFilePath = getCompleteFilePath(file);
                              return (
                                <Image
                                  key={file.attachmentGUID}
                                  width={100}
                                  height={100}
                                  src={getMobileFileUrl(completeFilePath)}
                                  alt={file.fileName}
                                  style={{ objectFit: "cover" }}
                                />
                              );
                            })}
                          </Space>
                        </Image.PreviewGroup>
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} />
                      )}
                    </Spin>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card title={t("form.comments")} size="small">
                    <TextArea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4} />
                  </Card>
                </Col>
              </Row>
              {/* Actions */}
              <Row justify="end" style={{ marginTop: 24 }}>
                <Space>
                  <Button onClick={onClose}>{t("common.cancel")}</Button>
                  <Button danger onClick={confirmReject}>
                    {t("common.reject")}
                  </Button>
                  <Button type="primary" onClick={confirmApprove}>
                    {t("common.approve")}
                  </Button>
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
