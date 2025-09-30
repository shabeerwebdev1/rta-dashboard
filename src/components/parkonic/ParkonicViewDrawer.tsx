import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Space, Image, Empty, Button, Select, Input, Typography, Spin } from "antd";
import { getFileUrl } from "../../services/fileApi";
import { useUpdateParkonicMutation, useGetParkonicVoilationsQuery } from "../../services/rtkApiFactory";
import { ShareAltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useAppNotification } from "../../utils/notificationManager";

const { TextArea } = Input;
const { Option } = Select;

interface ParkonicViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const ParkonicViewDrawer: React.FC<ParkonicViewDrawerProps> = ({ open, onClose, record }) => {
  const { t, i18n } = useTranslation();
  const { success, error } = useAppNotification();

  const [reviewParkonic, { isLoading }] = useUpdateParkonicMutation();
  const { data: violationsData, isLoading: violationsLoading } = useGetParkonicVoilationsQuery({});

  const [reviewStatus, setReviewStatus] = useState<number>(record?.reviewStatus ?? 2);
  const [rejectionReason, setRejectionReason] = useState<string>(record?.rejectionReason || "");
  const [selectedViolation, setSelectedViolation] = useState<string | null>(null);

  const entryPhotos = record?.entryImageUrl ? record.entryImageUrl.split(",") : [];
  const exitPhotos = record?.exitImageUrl ? record.exitImageUrl.split(",") : [];

  const statusLabels: Record<number, { en: string; ar: string }> = {
    1: { en: t("status.approved"), ar: "موافق" },
    0: { en: t("status.rejected"), ar: "مرفوض" },
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
        fineId: record.fineId,
        reviewerName: "CurrentUser",
        reviewTimestamp: new Date().toISOString(),
        reviewStatus,
        updatedby: "CurrentUser",
        rejectionReason,
        violationGUID: selectedViolation, // <-- send selected violation
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

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/parkonic/${record?.fineId}`;
    navigator.clipboard.writeText(shareUrl).then(
      () =>
        success(
          { data: { en_Msg: t("common.share") || "Share link copied to clipboard!", ar_Msg: "تم نسخ الرابط!" } },
          "",
        ),
      () =>
        error(
          { data: { en_Msg: t("common.shareFailed") || "Failed to copy link.", ar_Msg: "فشل في نسخ الرابط." } },
          "",
        ),
    );
  };

  useEffect(() => {
    setReviewStatus(record?.reviewStatus ?? 2);
    setRejectionReason(record?.rejectionReason || "");
    setSelectedViolation(null);
  }, [record]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("form.parkonicdetails")}
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
      extra={
        <Button icon={<ShareAltOutlined />} onClick={handleShare}>
          {t("common.share")}
        </Button>
      }
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            {t("common.cancel")}
          </Button>
          <Button type="primary" loading={isLoading} onClick={handleSubmitReview}>
            {t("common.submit")}
          </Button>
        </div>
      }
    >
      {!record ? (
        <Empty description={t("common.noData")} />
      ) : (
        <>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t("form.fineNumber")}>{record.fineId || t("common.noData")}</Descriptions.Item>
            <Descriptions.Item label={t("form.vehicleNumber")}>
              {record.plateNumber || t("common.noData")}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.reviewStatus")}>{getStatusTag(record.reviewStatus)}</Descriptions.Item>
            <Descriptions.Item label={t("form.entryDateTime")}>
              {record.entryDateTime ? dayjs(record.entryDateTime).format("DD-MM-YYYY") : t("common.noData")}
            </Descriptions.Item>
            <Descriptions.Item label={t("form.exitDateTime")}>
              {record.exitDateTime ? dayjs(record.exitDateTime).format("DD-MM-YYYY ") : t("common.noData")}
            </Descriptions.Item>
          </Descriptions>

          <h4 style={{ marginTop: 16 }}>{t("common.location")}</h4>
          {record.locationDescription ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t("form.description")}>{record.locationDescription}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty description={t("common.noData")} />
          )}

          {/* Entry Photos */}
          <Typography.Title level={5} style={{ marginBottom: 16, marginTop: 16 }}>
            {t("form.entryDateTime")}
          </Typography.Title>
          <Spin spinning={false}>
            {entryPhotos.length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {entryPhotos.map((photo: string, idx: number) => (
                    <Image key={idx} width={100} height={100} src={getFileUrl(photo)} alt={`entry-${idx}`} />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("messages.noEntryPhotos")} />
            )}
          </Spin>

          {/* Exit Photos */}
          <Typography.Title level={5} style={{ marginBottom: 16, marginTop: 16 }}>
            {t("form.exitDateTime")}
          </Typography.Title>
          <Spin spinning={false}>
            {exitPhotos.length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {exitPhotos.map((photo: string, idx: number) => (
                    <Image key={idx} width={100} height={100} src={getFileUrl(photo)} alt={`exit-${idx}`} />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("messages.noExitPhotos")} />
            )}
          </Spin>

          {/* Review Section */}
          <h4 style={{ marginTop: 16 }}>{t("common.review")}</h4>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Select value={reviewStatus} onChange={(value) => setReviewStatus(value)} style={{ width: "100%" }}>
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
              />
            )}
          </Space>
        </>
      )}
    </Drawer>
  );
};

export default ParkonicViewDrawer;
