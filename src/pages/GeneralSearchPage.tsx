import React, { useEffect, useMemo, useState } from "react";
import { Card, Space, Button, Row, Col, Form, Select, Input, Tabs, Descriptions } from "antd";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { SearchOutlined } from "@ant-design/icons";
import {
  useLazyGetLookupsQuery,
  useSearchFinesQuery,
  useLazyGetCarPlateDetailsQuery,
  useLazyGetTradeLicenseDetailsQuery,
} from "../services/rtkApiFactory";
import dayjs from "dayjs";
import FineViewDrawer from "../components/GeneralSearch/GeneralSearchViewDrawer";
import { carPlatePageConfig, tradeLicensePageConfig } from "../config/pageConfigs/generalSearchConfig";
import i18n from "../config/i18n";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { useAppNotification } from "../utils/notificationManager"; //
import { data } from "react-router-dom";

const { Option } = Select;
const { TabPane } = Tabs;

const GeneralSearchPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  const notification = useAppNotification(); // ✅ initialize notification hook

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
  const [triggerGetCarPlateDetails, { isFetching: isFetchingCarDetails }] = useLazyGetCarPlateDetailsQuery();
  const [triggerGetTradeLicenseDetails, { isFetching: isFetchingTL }] = useLazyGetTradeLicenseDetailsQuery();

  // Fetch fines using only the plate number
  // const { data: finesData, isFetching: isFetchingFines } = useSearchFinesQuery(
  //   { plateNumber: plateNumber },
  //   { skip: !plateNumber },
  // );

  const { data: finesData, isFetching: isFetchingFines } = useSearchFinesQuery(
    {
      OrFilters: {
        plateNumber: plateNumber,
      },
      PageSize: 9999,
      PageNumber: 0,
    },
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
    } catch (error: any) {
      console.error("Failed to fetch lookup data:", error);
      notification.error(error, t("messages.failedToLoadDropdowns"));
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

    const params = {
      plateNumber: plateNumber?.toString() || "",
      plateSource: plateSource?.toString() || "",
      plateCategory: plateCategory?.toString() || "",
      plateCode: plateCode?.toString() || "",
    };

    try {
      const result = await triggerGetCarPlateDetails(params).unwrap();
      setVehicleDetails(result?.data || null);

      notification.success(result, t("messages.vehicleDetailsFetched"));
    } catch (error: any) {
      console.error("Car plate details fetch failed:", error);
      notification.error(error, t("messages.vehicleDetailsFetched"));
      setVehicleDetails(null);
    }
  };

  // const handleCarSearch = async (values: any) => {
  //   const { plateNumber } = values;

  //   // Set plate number for fines query
  //   setPlateNumber(plateNumber);

  //   // API payload: last three dropdowns forced to "111"
  //   const params = {
  //     plateNumber: plateNumber?.toString() || "",
  //     plateSource: plateSource?.toString() || "",
  //     plateCategory: plateCategory?.toString() || "",
  //     plateCode: plateCode?.toString() || "",
  //   };

  //   try {
  //     const result = await triggerGetCarPlateDetails(params).unwrap();
  //     setVehicleDetails(result?.data || null);
  //     notification.success(result, t("messages.vehicleDetailsFetched"));
  //   } catch (error: any) {
  //     console.error("Car plate details fetch failed:", error);
  //     notification.error(error, t("messages.vehicleDetailsFetched"));
  //     setVehicleDetails(null);
  //   }
  // };

  const handleTlSearch = async (values: any) => {
    try {
      const result = await triggerGetTradeLicenseDetails(values.licenseNumber.toString()).unwrap();

      setTlData(result?.data || result); // bind response to state
      notification.success({ message: t("messages.tradeLicenseFetched") });
    } catch (error: any) {
      console.error("Trade License fetch failed:", error);
      notification.error({ message: t("messages.failedToFetchTradeLicense") });
      setTlData(null);
    }
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
  // Filter fines by plateNumber
  // const finesList = finesData?.data?.filter((fine: any) => fine.plateNumber === plateNumber) || [];

  const finesList = finesData?.data.filter((fine: any) => fine.plateNumber === plateNumber) || [];

  return (
    <>
      <Card bordered={false}>
        <Tabs defaultActiveKey="1" type="card">
          {/* Car Plate Tab */}
          <TabPane tab="Car Plate" key="1">
            <Form form={formCar} layout="vertical" onFinish={handleCarSearch} initialValues={{}}>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item
                    name="plateNumber"
                    label={t("form.plateNumber")}
                    rules={[{ required: true, message: t("validation.required") }]}
                  >
                    <Input placeholder={t("placeholders.plateNumber")} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="plateSource" label={t("form.plateSource")}>
                    <Select showSearch loading={isLoadingLookups} placeholder={t("placeholders.plateSource")}>
                      {plateSourceOptions.map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="plateCategory" label={t("form.plateCategory")}>
                    <Select showSearch loading={isLoadingLookups} placeholder={t("placeholders.plateCategory")}>
                      {plateCategoryOptions.map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="plateCode" label={t("form.plateCode")}>
                    <Select showSearch loading={isLoadingLookups} placeholder={t("placeholders.plateCode")}>
                      {plateCodeOptions.map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24} style={{ textAlign: "right" }}>
                  <Button type="primary" htmlType="submit" loading={isFetchingCarDetails}>
                    {t("common.search")}
                  </Button>
                </Col>
              </Row>
            </Form>

            {/* Show vehicle details and fines only if vehicleDetails exist */}
            {vehicleDetails && (
              <>
                <Card title="Vehicle Details" className="mt-4">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Plate No">{vehicleDetails.plateNo || "N/A"}</Descriptions.Item>

                    <Descriptions.Item label="Traffic File No">
                      {vehicleDetails.trafficFileNo || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Company Name">{vehicleDetails.companyName || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Company Email">{vehicleDetails.companyEmail || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Vehicle Type">{vehicleDetails.vehicleType || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Vehicle Color">{vehicleDetails.vehicleColor || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Owner Name">{vehicleDetails.ownerName || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Owner Email">{vehicleDetails.ownerEmail || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Owner Mobile">{vehicleDetails.ownerMobile || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Owner Phone">{vehicleDetails.ownerPhone || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label="Manufacture Year">
                      {vehicleDetails.manufactureYear || "N/A"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {finesList.length > 0 && (
                  <Card title="All Fines" className="mt-4">
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
              </>
            )}
          </TabPane>

          {/* Trade License Tab */}
          {/* Trade License Tab */}
          <TabPane tab="Trade License" key="2">
            <Form form={formTL} layout="vertical" onFinish={handleTlSearch}>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item
                    name="licenseNumber"
                    label={t("fields.licenseNumber")}
                    rules={[{ required: true, message: t("validation.required") }]}
                  >
                    <Input placeholder={t("placeholders.enterLicenseNumber")} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={isFetchingTL}>
                    {t("common.search")}
                  </Button>
                </Col>
              </Row>
            </Form>

            {tlData && (
              <Card title="Trade License Details" className="mt-4">
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="License No">{tlData.licenseNumber || "N/A"}</Descriptions.Item>
                  <Descriptions.Item label="Company Name">{tlData.companyName || "N/A"}</Descriptions.Item>
                  <Descriptions.Item label="Owner Name">{tlData.ownerName || "N/A"}</Descriptions.Item>
                  <Descriptions.Item label="Owner Contact">{tlData.ownerContact || "N/A"}</Descriptions.Item>
                  <Descriptions.Item label="Issued Year">{tlData.issuedYear || "N/A"}</Descriptions.Item>
                </Descriptions>
              </Card>
            )}
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
