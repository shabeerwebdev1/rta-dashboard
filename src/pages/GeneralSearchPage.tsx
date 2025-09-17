import React, { useEffect, useMemo, useState } from "react";
import { Card, Space, Button, Row, Col, Form, Select, Input, Tabs, Descriptions, notification } from "antd";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { SearchOutlined } from "@ant-design/icons";
import { useLazyGetLookupsQuery, useSearchFinesQuery } from "../services/rtkApiFactory";
import dayjs from "dayjs";
import FineViewDrawer from "../components/GeneralSearch/GeneralSearchViewDrawer";
import { carPlatePageConfig, tradeLicensePageConfig } from "../config/pageConfigs/generalSearchConfig";
import i18n from "../config/i18n";
import DataTableWrapper from "../components/common/DataTableWrapper";

const { Option } = Select;
const { TabPane } = Tabs;

const GeneralSearchPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  const [formCar] = Form.useForm();
  const [formTL] = Form.useForm();

  const [plateNumber, setPlateNumber] = useState<string | null>(null);
  const [tlData, setTlData] = useState<any | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any | null>(null);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const [triggerGetLookups] = useLazyGetLookupsQuery();

  useEffect(() => {
    fetchLookupData();
  }, [i18n.language]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([200, 300, 400]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      console.error("Failed to fetch lookup data:", error);
      notification.error({ message: "Failed to load dropdown options" });
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const filterOptionsByCategory = (options: any[], categoryId: number) =>
    options.filter((option) => option.categoryId === categoryId);

  const plateSourceOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 200).map((option) => ({
        value: option.value,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const plateCategoryOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 300).map((option) => ({
        value: option.value,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const plateCodeOptions = useMemo(
    () =>
      filterOptionsByCategory(lookupOptions, 400).map((option) => ({
        value: option.value,
        label: i18n.language === "ar" ? option.labelAr : option.labelEn,
      })),
    [lookupOptions, i18n.language],
  );

  const { data: finesData, isFetching } = useSearchFinesQuery({ plateNumber: plateNumber! }, { skip: !plateNumber });

  useEffect(() => {
    setPageTitle("General Search");
  }, [setPageTitle]);

  const handleCarSearch = (values: any) => {
    setPlateNumber(values.plateNumber);
  };

  const handleTlSearch = (values: any) => {
    setTlData({
      licenseNumber: values.licenseNumber,
      companyName: "ABC Trading LLC",
      ownerName: "Mohammed Ali",
      ownerContact: "+971 55 987 6543",
      issuedYear: "2015",
      fines: [
        { entityNo: "T001", violation: "Late Renewal", amount: "1000 AED", date: "15-12-2022" },
        { entityNo: "T002", violation: "Expired Permit", amount: "1500 AED", date: "20-02-2023" },
      ],
    });
  };

  const handleViewFine = (fine: any, vehicleInfo: any) => {
    setSelectedFine({
      ...fine,
      ...vehicleInfo,
      plateNumber: plateNumber,
    });
    setDrawerVisible(true);
  };

  const carData =
    finesData?.data
      ?.filter((item: any) => item.plateNumber === plateNumber)
      .map((item: any) => ({
        vehicleBrand: item.vehicleBrand,
        vehicleType: item.vehicleType,
        vehicleColor: item.vehicleColor,
        manufacturerYear: item.manufacturerYear,
        ownerName: item.vehicleOwnerName,
        plateNumber: item.plateNumber,
        OwnerEmail: item.vehicleOwnerEmail,
        OwnerMobile: item.vehicleOwnerMobile,
        fines: [
          {
            entityNo: item.entityNo,
            violation: "N/A",
            amount: `${item.fineAmount} AED`,
            date: dayjs(item.entityDateTime).format("DD-MM-YYYY"),
          },
        ],
      }))[0] || null;

  return (
    <>
      <Card bordered={false}>
        <Tabs defaultActiveKey="1" type="card">
          {/* Car Plate Tab */}
          <TabPane tab="Car Plate" key="1">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Card bordered={false}>
                <Form form={formCar} layout="vertical" onFinish={handleCarSearch}>
                  <Row gutter={12} align="bottom">
                    {/* dropdowns + input same as before */}
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="plateSource"
                        label="Plate Source"
                        rules={[{ required: false, message: "Please select a plate source" }]}
                      >
                        <Select placeholder="Select the plate source" loading={isLoadingLookups}>
                          {plateSourceOptions.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="plateCategory"
                        label="Plate Category"
                        rules={[{ required: false, message: "Please select a category" }]}
                      >
                        <Select placeholder="Select plate category" loading={isLoadingLookups}>
                          {plateCategoryOptions.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="plateCode"
                        label="Plate Code"
                        rules={[{ required: false, message: "Please select a code" }]}
                      >
                        <Select placeholder="Select plate code" loading={isLoadingLookups}>
                          {plateCodeOptions.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={5}>
                      <Form.Item
                        name="plateNumber"
                        label="Plate Number"
                        rules={[{ required: true, message: "Please enter plate number" }]}
                      >
                        <Input placeholder="Enter plate number" />
                      </Form.Item>
                    </Col>
                    <Col xs={10} sm={1}>
                      <Form.Item label="&nbsp;">
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={isFetching} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>

              {carData && (
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Card title="Vehicle Details">
                    <Descriptions bordered column={4} size="small">
                      <Descriptions.Item label="Brand">{carData.vehicleBrand}</Descriptions.Item>
                      <Descriptions.Item label="Type">{carData.vehicleType}</Descriptions.Item>
                      <Descriptions.Item label="Color">{carData.vehicleColor}</Descriptions.Item>
                      <Descriptions.Item label="Year">{carData.manufacturerYear}</Descriptions.Item>
                      <Descriptions.Item label="Owner">{carData.ownerName}</Descriptions.Item>
                      <Descriptions.Item label="Email">{carData.OwnerEmail}</Descriptions.Item>
                      <Descriptions.Item label="Mobile">{carData.OwnerMobile}</Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card title="All Fines">
                    <DataTableWrapper
                      pageConfig={carPlatePageConfig}
                      data={carData.fines}
                      total={carData.fines.length}
                      isLoading={false}
                      apiParams={{}}
                        state={{ columnFilters: {} }}

                      handleTableChange={() => {}}
                      handlePaginationChange={() => {}}
                      actionMenuItems={(record: any) => [
                        {
                          key: "view",
                          label: "View",
                          onClick: () => handleViewFine(record, carData),
                        },
                      ]}
                      tableSize="small"
                      showPagination={false}
                    />
                  </Card>
                </Space>
              )}
            </Space>
          </TabPane>

          {/* Trade License Tab */}
          <TabPane tab="Trade License" key="2">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Card bordered={false}>
                <Form form={formTL} layout="vertical" onFinish={handleTlSearch}>
                  <Row gutter={12} align="bottom">
                    <Col xs={24} sm={8}>
                      <Form.Item
                        name="licenseNumber"
                        label="Trade License Number"
                        rules={[{ required: true, message: "Please enter license number" }]}
                      >
                        <Input placeholder="Enter TL Number" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={4}>
                      <Form.Item label="&nbsp;">
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>

              {tlData && (
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Card title="Trade License Details">
                    <Descriptions bordered column={5} size="small">
                      <Descriptions.Item label="License No.">{tlData.licenseNumber}</Descriptions.Item>
                      <Descriptions.Item label="Company">{tlData.companyName}</Descriptions.Item>
                      <Descriptions.Item label="Owner">{tlData.ownerName}</Descriptions.Item>
                      <Descriptions.Item label="Contact">{tlData.ownerContact}</Descriptions.Item>
                      <Descriptions.Item label="Issued Year">{tlData.issuedYear}</Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card title="All Fines">
                    <DataTableWrapper
                      pageConfig={tradeLicensePageConfig}
                      data={tlData.fines}
                      total={tlData.fines.length}
                      isLoading={false}
                      apiParams={{}}
                       state={{ columnFilters: {} }}

                      handleTableChange={() => {}}
                      handlePaginationChange={() => {}}
                      actionMenuItems={(record: any) => [
                        {
                          key: "view",
                          label: "View",
                          onClick: () => handleViewFine(record, tlData),
                        },
                      ]}
                      tableSize="small"
                      showPagination={false}
                    />
                  </Card>
                </Space>
              )}
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      <FineViewDrawer
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedFine(null);
        }}
        record={selectedFine}
      />
    </>
  );
};

export default GeneralSearchPage;
