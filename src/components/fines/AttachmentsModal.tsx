import React from "react";
import { Modal, Row, Col, Typography, Image, Spin, Empty, Space } from "antd";
import { PaperClipOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useGetInspectionAttachmentsQuery, getMobileFileUrl } from "../../services/inspectionFileApi";
import { skipToken } from "@reduxjs/toolkit/query";

const { Text } = Typography;

interface AttachmentsModalProps {
  open: boolean;
  onClose: () => void;
  fine: any;
}

const AttachmentsModal: React.FC<AttachmentsModalProps> = ({ open, onClose, fine }) => {
  const { t } = useTranslation();

  const { data: attachments = [], isLoading: isLoadingAttachments } = useGetInspectionAttachmentsQuery(
    fine ? { inspectionGUID: fine.inspectionGUID, entityCode: fine.entityCode } : skipToken,
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      title={
        <Space>
          <PaperClipOutlined />
          {t("form.AttachedPhotos")}
        </Space>
      }
    >
      <Spin spinning={isLoadingAttachments}>
        {attachments.length > 0 ? (
          <Image.PreviewGroup>
            <Row gutter={[16, 16]}>
              {attachments.map((file) => (
                <Col span={8} key={file.attachmentGUID}>
                  <Image
                    width="100%"
                    height={150}
                    src={getMobileFileUrl(file.filePath)}
                    alt={file.fileName}
                    style={{ objectFit: "cover", borderRadius: 8 }}
                    placeholder={
                      <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Spin size="small" />
                      </div>
                    }
                  />
                  <Text style={{ display: "block", textAlign: "center", marginTop: 8 }} type="secondary">
                    {file.fileName}
                  </Text>
                </Col>
              ))}
            </Row>
          </Image.PreviewGroup>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} style={{ padding: 40 }} />
        )}
      </Spin>
    </Modal>
  );
};

export default AttachmentsModal;