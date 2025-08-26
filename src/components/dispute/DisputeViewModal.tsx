// import React from "react";
// import { Modal, Card, Row, Col, Typography, Divider, Image, Timeline, Button, Input, Select } from "antd";
// import { ClockCircleOutlined, CloseOutlined } from "@ant-design/icons";

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// const DisputeViewModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
//   return (
//     <Modal
//       open={open}
//       onCancel={onClose}
//       width={1200}
//       footer={null}
//       title={null} // remove default header
//       closable={false} // hide default close btn
//       bodyStyle={{ padding: 0 }}
//     >
//       <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
//         {/* Custom Header */}
//         <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
//           <Title level={4} style={{ margin: 0 }}>
//             Dispute Review <Text type="danger">#FN000111</Text>
//           </Title>
//           <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
//         </Row>

//         <Row gutter={16}>
//           {/* LEFT SIDE */}
//           <Col span={18}>
//             <Row gutter={16}>
//               {/* Dispute Details */}
//               <Col span={12}>
//                 <Card title="Dispute Details" size="small" headStyle={{ background: "#fafafa", fontWeight: 600 }}>
//                   <Row gutter={[0, 8]}>
//                     <Col span={12}>
//                       <Text strong>Department:</Text>
//                     </Col>
//                     <Col span={12}>Traffic Management</Col>

//                     <Col span={12}>
//                       <Text strong>Payment Type:</Text>
//                     </Col>
//                     <Col span={12}>Online</Col>

//                     <Col span={12}>
//                       <Text strong>Reason:</Text>
//                     </Col>
//                     <Col span={12}>Parking in a non-designated area.</Col>

//                     <Col span={12}>
//                       <Text strong>Fine Type:</Text>
//                     </Col>
//                     <Col span={12}>Traffic Violation</Col>

//                     <Col span={12}>
//                       <Text strong>Email:</Text>
//                     </Col>
//                     <Col span={12}>Email123@gmail.com</Col>

//                     <Col span={12}>
//                       <Text strong>Phone Number:</Text>
//                     </Col>
//                     <Col span={12}>1234567897</Col>

//                     <Col span={12}>
//                       <Text strong>CRM Reference:</Text>
//                     </Col>
//                     <Col span={12}>Reference</Col>

//                     <Col span={12}>
//                       <Text strong>Address:</Text>
//                     </Col>
//                     <Col span={12}>123 Sheikh Zayed Road, Dubai</Col>
//                   </Row>
//                 </Card>
//               </Col>

//               {/* Vehicle Fine Details */}
//               <Col span={12}>
//                 <Card
//                   title="Vehicle & Fine Details"
//                   size="small"
//                   style={{ borderRadius: 12, marginBottom: 16 }}
//                   headStyle={{ background: "#fafafa", fontWeight: 600 }}
//                 >
//                   <Row gutter={[0, 8]}>
//                     <Col span={12}>
//                       <Text strong>Plate Code:</Text>
//                     </Col>
//                     <Col span={12}>DXB</Col>

//                     <Col span={12}>
//                       <Text strong>Plate Type:</Text>
//                     </Col>
//                     <Col span={12}>Private</Col>

//                     <Col span={12}>
//                       <Text strong>Plate Number:</Text>
//                     </Col>
//                     <Col span={12}>A12345</Col>

//                     <Col span={12}>
//                       <Text strong>Vehicle Type:</Text>
//                     </Col>
//                     <Col span={12}>Lamborghini</Col>

//                     <Col span={12}>
//                       <Text strong>Brand:</Text>
//                     </Col>
//                     <Col span={12}>Lamborghini</Col>

//                     <Col span={12}>
//                       <Text strong>Color:</Text>
//                     </Col>
//                     <Col span={12}>Silver</Col>

//                     <Col span={12}>
//                       <Text strong>Fine Type:</Text>
//                     </Col>
//                     <Col span={12}>Over Speeding</Col>

//                     <Col span={12}>
//                       <Text strong>Fine Amount:</Text>
//                     </Col>
//                     <Col span={12}>
//                       <Text type="danger">5000 AED</Text>
//                     </Col>

//                     <Col span={12}>
//                       <Text strong>Owner Name:</Text>
//                     </Col>
//                     <Col span={12}>Name</Col>
//                   </Row>
//                 </Card>
//               </Col>
//             </Row>

//             {/* More Details */}
//             <Card
//               title="More Details"
//               size="small"
//               style={{ borderRadius: 12, marginBottom: 16 }}
//               headStyle={{ background: "#fafafa", fontWeight: 600 }}
//             >
//               <Row gutter={16}>
//                 <Col span={4}>
//                   <Text strong>Area:</Text> Area
//                 </Col>
//                 <Col span={4}>
//                   <Text strong>Zone:</Text> Zone
//                 </Col>
//                 <Col span={4}>
//                   <Text strong>Time:</Text> Time
//                 </Col>
//                 <Col span={4}>
//                   <Text strong>Date:</Text> Date
//                 </Col>
//                 <Col span={4}>
//                   <Text strong>Inspector:</Text> Name
//                 </Col>
//                 <Col span={4}>
//                   <Text strong>Supervisor:</Text> Name
//                 </Col>
//               </Row>
//             </Card>

//             {/* Evidence & Location */}
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Card
//                   title="Evidence"
//                   size="small"
//                   style={{ borderRadius: 12, marginBottom: 16 }}
//                   headStyle={{ background: "#fafafa", fontWeight: 600 }}
//                 >
//                   <Row gutter={[8, 8]}>
//                     {[
//                       "https://picsum.photos/200/120?random=1",
//                       "https://picsum.photos/200/120?random=2",
//                       "https://picsum.photos/200/120?random=3",
//                       "https://picsum.photos/200/120?random=4",
//                       "https://picsum.photos/200/120?random=5",
//                       "https://picsum.photos/200/120?random=6",
//                     ].map((src, i) => (
//                       <Col span={8} key={i}>
//                         <Image src={src} style={{ borderRadius: 8, objectFit: "cover" }} />
//                       </Col>
//                     ))}
//                   </Row>
//                 </Card>
//               </Col>
//               <Col span={12}>
//                 <Card
//                   title="Location"
//                   size="small"
//                   style={{ borderRadius: 12, marginBottom: 16 }}
//                   headStyle={{ background: "#fafafa", fontWeight: 600 }}
//                 >
//                   <iframe
//                     title="map"
//                     width="100%"
//                     height="200"
//                     style={{ border: 0, borderRadius: 8 }}
//                     src="https://www.google.com/maps?q=25.276987,55.296249&z=15&output=embed"
//                   />
//                 </Card>
//               </Col>
//             </Row>
//           </Col>

//           {/* RIGHT SIDE TIMELINE */}
//           <Col span={6}>
//             <Card
//               title="Review Timeline"
//               size="small"
//               style={{
//                 borderRadius: 12,
//                 background: "#f0f7ff",
//                 marginBottom: 16,
//               }}
//               headStyle={{ background: "#e6f2ff", fontWeight: 600 }}
//             >
//               <Timeline mode="left">
//                 <Timeline.Item dot={<ClockCircleOutlined />} color="blue">
//                   <Text strong>Created</Text>
//                   <br />
//                   <Text type="secondary">2023-10-18 10:30 AM</Text>
//                 </Timeline.Item>
//                 <Timeline.Item dot={<ClockCircleOutlined />} color="blue">
//                   <Text strong>Review 1</Text>
//                   <br />
//                   <Text type="secondary">2023-10-19 11:30 AM</Text>
//                 </Timeline.Item>
//                 <Timeline.Item dot={<ClockCircleOutlined />} color="blue">
//                   <Text strong>Review 2</Text>
//                   <br />
//                   <Text type="secondary">2023-10-20 10:30 AM</Text>
//                 </Timeline.Item>
//                 <Timeline.Item dot={<ClockCircleOutlined />} color="blue">
//                   <Text strong>Review 3</Text>
//                   <br />
//                   <Text type="secondary">2023-10-21 10:30 AM</Text>
//                 </Timeline.Item>
//                 <Timeline.Item dot={<ClockCircleOutlined />} color="blue">
//                   <Text strong>Review 4</Text>
//                   <br />
//                   <Text type="secondary">2023-10-22 10:30 AM</Text>
//                 </Timeline.Item>
//               </Timeline>
//             </Card>
//           </Col>
//         </Row>

//         {/* FOOTER */}
//         <Divider />
//         <Row gutter={16} align="middle" justify="space-between">
//           <Col span={8}>
//             <Text strong>Comment *</Text>
//             <TextArea placeholder="Enter your comment" rows={2} />
//           </Col>
//           <Col span={8}>
//             <Text strong>Select Supervisor</Text>
//             <Select style={{ width: "100%" }} placeholder="Select Supervisor">
//               <Select.Option value="1">Supervisor 1</Select.Option>
//               <Select.Option value="2">Supervisor 2</Select.Option>
//             </Select>
//           </Col>
//           <Col span={8} style={{ textAlign: "right" }}>
//             <Button onClick={onClose} style={{ marginRight: 8 }}>
//               Cancel
//             </Button>
//             <Button type="primary" style={{ marginRight: 8 }}>
//               Approve
//             </Button>
//             <Button danger>Reject</Button>
//           </Col>
//         </Row>
//       </Card>
//     </Modal>
//   );
// };

// export default DisputeViewModal;

import React from "react";
import { Modal, Card, Row, Col, Typography, Divider, Image, Timeline, Button, Input, Select, Empty } from "antd";
import { ClockCircleOutlined, CloseOutlined } from "@ant-design/icons";
import { getFileUrl } from "../../services/fileApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface DisputeViewModalProps {
  open: boolean;
  onClose: () => void;
  dispute?: any; // API data
}

const DisputeViewModal: React.FC<DisputeViewModalProps> = ({ open, onClose, dispute }) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1400}
      footer={null}
      title={null}
      closable={false}
      bodyStyle={{ padding: 0 }}
    >
      <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        {/* Custom Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
          <Title level={4} style={{ margin: 0 }}>
            Dispute Review <Text type="danger">#{dispute?.disputeNo || "No Data"}</Text>
          </Title>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} style={{ fontSize: 16 }} />
        </Row>

        {!dispute ? (
          <Empty description="No Data" />
        ) : (
          <Row gutter={16}>
            {/* LEFT SIDE */}
            <Col span={18}>
              <Row gutter={16}>
                {/* Dispute Details */}
                <Col span={12}>
                  <Card title="Dispute Details" size="small" headStyle={{ background: "#fafafa", fontWeight: 600 }}>
                    <Row gutter={[0, 8]}>
                      <Col span={12}>
                        <Text strong>Department:</Text>
                      </Col>
                      <Col span={12}>{dispute.department || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Payment Type:</Text>
                      </Col>
                      <Col span={12}>{dispute.paymentType || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Reason:</Text>
                      </Col>
                      <Col span={12}>{dispute.reason || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Fine Type:</Text>
                      </Col>
                      <Col span={12}>{dispute.fineType || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Email:</Text>
                      </Col>
                      <Col span={12}>{dispute.email || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Phone Number:</Text>
                      </Col>
                      <Col span={12}>{dispute.phone || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>CRM Reference:</Text>
                      </Col>
                      <Col span={12}>{dispute.crmReference || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Address:</Text>
                      </Col>
                      <Col span={12}>{dispute.address || "No Data"}</Col>
                    </Row>
                  </Card>
                </Col>

                {/* Vehicle Fine Details */}
                <Col span={12}>
                  <Card
                    title="Vehicle & Fine Details"
                    size="small"
                    style={{ borderRadius: 12, marginBottom: 16 }}
                    headStyle={{ background: "#fafafa", fontWeight: 600 }}
                  >
                    <Row gutter={[0, 8]}>
                      <Col span={12}>
                        <Text strong>Plate Code:</Text>
                      </Col>
                      <Col span={12}>{dispute.plateCode || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Plate Type:</Text>
                      </Col>
                      <Col span={12}>{dispute.plateType || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Plate Number:</Text>
                      </Col>
                      <Col span={12}>{dispute.plateNumber || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Vehicle Type:</Text>
                      </Col>
                      <Col span={12}>{dispute.vehicleType || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Brand:</Text>
                      </Col>
                      <Col span={12}>{dispute.vehicleBrand || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Color:</Text>
                      </Col>
                      <Col span={12}>{dispute.vehicleColor || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Fine Type:</Text>
                      </Col>
                      <Col span={12}>{dispute.fineType || "No Data"}</Col>

                      <Col span={12}>
                        <Text strong>Fine Amount:</Text>
                      </Col>
                      <Col span={12}>
                        {dispute.fineAmount ? <Text type="danger">{dispute.fineAmount} AED</Text> : "No Data"}
                      </Col>

                      <Col span={12}>
                        <Text strong>Owner Name:</Text>
                      </Col>
                      <Col span={12}>{dispute.ownerName || "No Data"}</Col>
                    </Row>
                  </Card>
                </Col>
              </Row>

              {/* More Details */}
              <Card
                title="More Details"
                size="small"
                style={{ borderRadius: 12, marginBottom: 16 }}
                headStyle={{ background: "#fafafa", fontWeight: 600 }}
              >
                <Row gutter={16}>
                  <Col span={4}>
                    <Text strong>Area:</Text> {dispute.area || "No Data"}
                  </Col>
                  <Col span={4}>
                    <Text strong>Zone:</Text> {dispute.zone || "No Data"}
                  </Col>
                  <Col span={4}>
                    <Text strong>Time:</Text> {dispute.time || "No Data"}
                  </Col>
                  <Col span={4}>
                    <Text strong>Date:</Text> {dispute.date || "No Data"}
                  </Col>
                  <Col span={4}>
                    <Text strong>Inspector:</Text> {dispute.inspector || "No Data"}
                  </Col>
                  <Col span={4}>
                    <Text strong>Supervisor:</Text> {dispute.supervisor || "No Data"}
                  </Col>
                </Row>
              </Card>

              {/* Evidence & Location */}
              <Row gutter={16}>
                <Col span={12}>
                  <Card
                    title="Evidence"
                    size="small"
                    style={{ borderRadius: 12, marginBottom: 16 }}
                    headStyle={{ background: "#fafafa", fontWeight: 600 }}
                  >
                    {dispute.documents?.length ? (
                      <Image.PreviewGroup>
                        <Row gutter={[8, 8]}>
                          {dispute.documents.map((doc: string, i: number) => (
                            <Col span={8} key={i}>
                              <Image src={getFileUrl(doc)} style={{ borderRadius: 8, objectFit: "cover" }} />
                            </Col>
                          ))}
                        </Row>
                      </Image.PreviewGroup>
                    ) : (
                      <Row gutter={[8, 8]}>
                        {[
                          "https://picsum.photos/200/120?random=1",
                          "https://picsum.photos/200/120?random=2",
                          "https://picsum.photos/200/120?random=3",
                        ].map((src, i) => (
                          <Col span={8} key={i}>
                            <Image src={src} style={{ borderRadius: 8, objectFit: "cover" }} />
                          </Col>
                        ))}
                      </Row>
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
                    {dispute.latitude && dispute.longitude ? (
                      <iframe
                        title="map"
                        width="100%"
                        height="200"
                        style={{ border: 0, borderRadius: 8 }}
                        src={`https://www.google.com/maps?q=${dispute.latitude},${dispute.longitude}&z=15&output=embed`}
                      />
                    ) : (
                      <Empty description="No Location Data" />
                    )}
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* RIGHT SIDE TIMELINE */}
            <Col span={6}>
              <Card
                title="Review Timeline"
                size="small"
                style={{ borderRadius: 12, background: "#f0f7ff", marginBottom: 16 }}
                headStyle={{ background: "#e6f2ff", fontWeight: 600 }}
              >
                {dispute.activities?.length ? (
                  <Timeline mode="left">
                    {dispute.activities.map((act: any, idx: number) => (
                      <Timeline.Item dot={<ClockCircleOutlined />} color="blue" key={idx}>
                        <Text strong>{act.title}</Text>
                        <br />
                        <Text type="secondary">{act.time}</Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <Empty description="No Activities" />
                )}
              </Card>
            </Col>
          </Row>
        )}

        {/* FOOTER */}
        <Divider />
        <Row gutter={16} align="middle" justify="space-between">
          <Col span={8}>
            <Text strong>Comment *</Text>
            <TextArea placeholder="Enter your comment" rows={2} />
          </Col>
          <Col span={8}>
            <Text strong>Select Supervisor</Text>
            <Select style={{ width: "100%" }} placeholder="Select Supervisor">
              <Select.Option value="1">Supervisor 1</Select.Option>
              <Select.Option value="2">Supervisor 2</Select.Option>
            </Select>
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" style={{ marginRight: 8 }}>
              Approve
            </Button>
            <Button danger>Reject</Button>
          </Col>
        </Row>
      </Card>
    </Modal>
  );
};

export default DisputeViewModal;
