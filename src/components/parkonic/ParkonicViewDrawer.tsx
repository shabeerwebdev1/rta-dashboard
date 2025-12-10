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
    record ? { inspectionGUID: record.inspectionGUID, entityCode: record.entityCode } : skipToken,
  );

  const mappedRecord = React.useMemo(() => {
    return record
      ? {
          fineId: record.entityNo,
          plateNumber: record.plateNumber,
          reviewStatus: record.reviewStatus ?? 2,
          rejectionReason: record.rejectionReason || "",
          entryDateTime: record.actualDateTime,
          exitDateTime: record.endDateTime,
          originalRecord: record,
        }
      : null;
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

  const submitReview = async (status: number) => {
    try {
      await reviewParkonic({
        fineId: mappedRecord?.fineId,
        reviewerName: "CurrentUser",
        reviewTimestamp: new Date().toISOString(),
        reviewStatus: status,
        updatedby: "CurrentUser",
        rejectionReason: status === 0 ? rejectionReason : "",
        inspectionGUID: record?.inspectionGUID,
      }).unwrap();

      success(
        {
          data: {
            en_Msg: status === 1 ? "Approved Successfully" : "Rejected Successfully",
            ar_Msg: status === 1 ? "تمت الموافقة" : "تم الرفض",
          },
        },
        "",
      );

      onClose();
    } catch (err: any) {
      error(err, t("messages.reviewFailed") || "Action failed");
    }
  };

  /** ✅ Confirmation Handlers */
  const confirmApprove = () => {
    modal.confirm({
      title: t("common.confirmApproval"),
      content: t("common.confirmApprovalContent"),
      okText: t("common.approve"),
      cancelText: t("common.cancel"),
      onOk: () => submitReview(1),
    });
  };

  const confirmReject = () => {
    modal.confirm({
      title: t("common.confirmRejection"),
      content: t("common.confirmRejectionContent"),
      okText: t("common.reject"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () => submitReview(0),
    });
  };

  useEffect(() => {
    setRejectionReason(mappedRecord?.rejectionReason || "");
  }, [mappedRecord]);

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
              <Row gutter={16}>
                {/* Parkonic Details */}
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
                      <Col span={14}>{dayjs(mappedRecord.entryDateTime).format("DD-MM-YYYY")}</Col>

                      <Col span={10}>
                        <Text strong>{t("form.vehicleExitDateTime")}:</Text>
                      </Col>
                      <Col span={14}>{dayjs(mappedRecord.entryDateTime).format("DD-MM-YYYY")}</Col>
                    </Row>
                  </Card>
                </Col>

                {/* Vehicle Details */}
                <Col span={12}>
                  <Card title={t("form.vehicleDetails")} size="small">
                    <Row gutter={[0, 12]}>
                      <Col span={10}>
                        <Text strong>{t("form.vehicleNumber")}:</Text>
                      </Col>
                      <Col span={14}>{mappedRecord.plateNumber}</Col>

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
                    </Row>
                  </Card>
                </Col>
              </Row>

              {/* Photos */}
              <Card title={t("form.AttachedPhotos")} size="small" style={{ marginTop: 16 }}>
                <Spin spinning={isLoadingAttachments}>
                  <Image.PreviewGroup>
                    {attachments.length === 0 ? (
                      <Empty />
                    ) : (
                      <Space wrap>
                        {attachments.map((file) => (
                          <Image key={file.attachmentGUID} width={100} src={getMobileFileUrl(file.filePath)} />
                        ))}
                      </Space>
                    )}
                  </Image.PreviewGroup>
                </Spin>
              </Card>

              {/* Comment Box */}
              <div style={{ marginTop: 16 }}>
                <Text strong>{t("form.comments")}</Text>
                <TextArea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
              </div>

              {/* ✅ Approve / Reject With Confirmation */}
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
