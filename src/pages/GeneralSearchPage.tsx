import React, { useEffect, useMemo, useState } from "react";
import { Card, Space, Button, Row, Col, Form, Select, Input, Tabs, Descriptions, notification } from "antd";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { SearchOutlined } from "@ant-design/icons";
import {
  useLazyGetLookupsQuery,
  useSearchFinesQuery,
  useLazyGetCarPlateDetailsQuery,
} from "../services/rtkApiFactory";
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
  const [vehicleDetails, setVehicleDetails] = useState<any | null>(null);
  const [tlData, setTlData] = useState<any | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any | null>(null);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetCarPlateDetails, { isFetching: isFetchingCarDetails }] =
    useLazyGetCarPlateDetailsQuery();

  // Fetch fines using only the plate number
  const { data: finesData, isFetching: isFetchingFines } = useSearchFinesQuery(
    { plateNumber: plateNumber },
    { skip: !plateNumber },
  );

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

  useEffect(() => {
    setPageTitle("General Search");
  }, [setPageTitle]);

  const handleCarSearch = async (values: any) => {
    const { plateNumber, plateSource, plateCategory, plateCode } = values;

    // Set plate number for fines query
    setPlateNumber(plateNumber);

    // Prepare params for car plate details API
    const params = {
    plateNumber: plateNumber?.toString() || "",
    plateSource_Id: plateSource?.toString() || "",
    plateType_Id: plateCategory?.toString() || "",
    plateColor_Id: plateCode?.toString() || "",
  };

    try {
      const result = await triggerGetCarPlateDetails(params).unwrap();
      setVehicleDetails(result?.data || null);
    } catch (error) {
      console.error("Car plate details fetch failed:", error);
      notification.error({ message: "Failed to fetch vehicle details" });
      setVehicleDetails(null);
    }
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

  // Extract fines data
  const finesList = finesData?.data || [];

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
                    <Col xs={24} sm={6}>
                      <Form.Item name="plateSource" label="Plate Source">
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
                      <Form.Item name="plateCategory" label="Plate Category">
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
                      <Form.Item name="plateCode" label="Plate Code">
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
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SearchOutlined />}
                          loading={isFetchingCarDetails || isFetchingFines}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>

              {/* Show fines table regardless of vehicle details */}
              {finesList.length > 0 && (
                <Card title="All Fines">
                  <DataTableWrapper
                    pageConfig={carPlatePageConfig}
                    data={finesList}
                    total={finesList.length}
                    isLoading={isFetchingFines}
                    apiParams={{}}
                    state={{ columnFilters: {} }}
                    handleTableChange={() => {}}
                    handlePaginationChange={() => {}}
                    actionMenuItems={(record: any) => [
                      {
                        key: "view",
                        label: "View",
                        onClick: () => handleViewFine(record, vehicleDetails || {}),
                      },
                    ]}
                    tableSize="small"
                    showPagination={false}
                  />
                </Card>
              )}

              {/* Show vehicle details only when available */}
              {vehicleDetails && (
                <Card title="Vehicle Details">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Plate No">{vehicleDetails.PlateNo || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Plate Category">
                      {vehicleDetails.PlateCategory || "N/A"}
                    </Descriptions.Item>
                    {/* ... other fields ... */}
                  </Descriptions>
                </Card>
              )}
            </Space>
          </TabPane>

          {/* Trade License Tab */}
          <TabPane tab="Trade License" key="2">
            {/* existing TL code here */}
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
