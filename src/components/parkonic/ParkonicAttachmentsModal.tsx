import React from "react";
import { Modal, Row, Col, Typography, Image, Spin, Empty, Space } from "antd";
import { PaperClipOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useGetInspectionAttachmentsQuery, getMobileFileUrl } from "../../services/rtkApiFactory";
import { skipToken } from "@reduxjs/toolkit/query";

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  record: any;
}

const ParkonicAttachmentsModal: React.FC<Props> = ({ open, onClose, record }) => {
  const { t } = useTranslation();

  const { data: attachments = [], isLoading } = useGetInspectionAttachmentsQuery(
    record ? { inspectionGUID: record.inspectionGUID, entityCode: record.entityCode } : skipToken,
  );

  // ✅ SAME path logic as drawer
  const getCompleteFilePath = (file: any) => {
    if (file.filePath && file.filePath.includes(file.fileName)) {
      return file.filePath;
    }
    const separator = file.filePath.endsWith("\\") ? "" : "\\";
    return `${file.filePath}${separator}${file.fileName}`;
  };

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
      <Spin spinning={isLoading}>
        {attachments.length > 0 ? (
          <Image.PreviewGroup>
            <Row gutter={[16, 16]}>
              {attachments.map((file: any) => {
                const completePath = getCompleteFilePath(file);

                return (
                  <Col span={8} key={file.attachmentGUID}>
                    <Image
                      width="100%"
                      height={150}
                      src={getMobileFileUrl(completePath)}
                      alt={file.fileName}
                      style={{
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #f0f0f0",
                      }}
                      placeholder={
                        <div
                          style={{
                            height: 150,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Spin size="small" />
                        </div>
                      }
                    />
                    <Text style={{ display: "block", textAlign: "center", marginTop: 8 }} type="secondary">
                      {file.fileName}
                    </Text>
                  </Col>
                );
              })}
            </Row>
          </Image.PreviewGroup>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("common.noData")} style={{ padding: 40 }} />
        )}
      </Spin>
    </Modal>
  );
};

export default ParkonicAttachmentsModal;
