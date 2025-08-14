// components/ParkonicViewDrawer.tsx
import React, { useState } from "react";
import { Drawer, Descriptions, Tag, Space, Image, Timeline, Empty, Button, Select, Input, message } from "antd";
import { getFileUrl } from "../../services/fileApi";
import { useReviewParkonicMutation } from "../../services/rtkApiFactory";

const { TextArea } = Input;
const { Option } = Select;

interface ParkonicViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const ParkonicViewDrawer: React.FC<ParkonicViewDrawerProps> = ({ open, onClose, record }) => {
  const [reviewParkonic, { isLoading }] = useReviewParkonicMutation();
  const [reviewStatus, setReviewStatus] = useState<number>(record?.reviewStatus || 0);
  const [rejectionReason, setRejectionReason] = useState<string>(record?.rejectionReason || "");

  const handleSubmitReview = async () => {
    if (reviewStatus === 0 && !rejectionReason) {
      message.error("Please provide a rejection reason");
      return;
    }

    try {
      await reviewParkonic({
        fineId: record.fineId,
        reviewerName: "CurrentUser", // replace with actual user
        reviewTimestamp: new Date().toISOString(),
        reviewStatus,
        updatedby: "CurrentUser", // replace with actual user
        rejectionReason,
      }).unwrap();

      message.success("Review submitted successfully");
      onClose(); // close drawer after review
    } catch (error: any) {
      message.error(error?.data?.message || "Failed to submit review");
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title="Parkonic Details"
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" loading={isLoading} onClick={handleSubmitReview}>
            Submit Review
          </Button>
        </div>
      }
    >
      {!record ? (
        <Empty description="No Data" />
      ) : (
        <>
          {/* Basic Info */}
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Fine ID">{record.fineId || "No Data"}</Descriptions.Item>
            <Descriptions.Item label="Vehicle Number">{record.plateNumber || "No Data"}</Descriptions.Item>
            <Descriptions.Item label="Review Status">
              <Tag color={record.reviewStatus === 1 ? "green" : record.reviewStatus === 0 ? "red" : "blue"}>
                {record.reviewStatus === 1 ? "Approved" : record.reviewStatus === 0 ? "Rejected" : "Unknown"}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Entry Date Time">{record.entryDateTime || "No Data"}</Descriptions.Item>

            <Descriptions.Item label="Exit Date Time">{record.exitDateTime || "No Data"}</Descriptions.Item>
          </Descriptions>

          {/* Location */}
          <h4 style={{ marginTop: 16 }}>Location Details</h4>
          {record.locationDescription ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Description">{record.locationDescription}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty description="No Location Data" />
          )}

          {/* Map */}
          {record.location?.lat && record.location?.lng && (
            <iframe
              title="Parkonic Location"
              width="100%"
              height={300}
              style={{ border: 0, marginTop: 16 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${record.location.lat},${record.location.lng}&z=15&output=embed`}
            />
          )}

          {/* Photos */}
          <h4 style={{ marginTop: 16 }}>Attached Photos</h4>
          {record.photos && record.photos.length ? (
            <Image.PreviewGroup>
              <Space wrap>
                {record.photos.map((photo: string, idx: number) => (
                  <Image key={idx} width={120} src={getFileUrl(photo)} />
                ))}
              </Space>
            </Image.PreviewGroup>
          ) : (
            <Empty description="No Photos" />
          )}

          {/* Permits */}
          <h4 style={{ marginTop: 16 }}>Permits</h4>
          {record.permits && record.permits.length ? (
            <Timeline>
              {record.permits.map((permit: any, idx: number) => (
                <Timeline.Item key={idx}>
                  <strong>{permit.number}</strong> - {permit.type}
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Empty description="No Permits" />
          )}

          {/* Review Section */}
          <h4 style={{ marginTop: 16 }}>Review Fine</h4>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Select value={reviewStatus} onChange={(value) => setReviewStatus(value)} style={{ width: "100%" }}>
              <Option value={1}>Approve</Option>
              <Option value={0}>Reject</Option>
            </Select>

            {reviewStatus === 0 && (
              <TextArea
                placeholder="Enter rejection reason"
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
