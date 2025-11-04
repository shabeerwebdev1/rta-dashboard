import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Space,
  Button,
  Row,
  Col,
  Form,
  Select,
  Input,
  Tabs,
  Descriptions,
  Table,
  TableColumnProps,
  theme,
} from "antd";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import {
  useLazyGetLookupsQuery,
  useSearchFinesQuery,
  useLazyGetCarPlateDetailsQuery,
  useLazyGetTradeLicenseDetailsQuery,
  useLazyGetPermitsRequestQuery,
} from "../services/rtkApiFactory";

import FineViewDrawer from "../components/GeneralSearch/GeneralSearchViewDrawer";
import { carPlatePageConfig } from "../config/pageConfigs/generalSearchConfig";
import i18n from "../config/i18n";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { useAppNotification } from "../utils/notificationManager"; //

const { Option } = Select;
const { TabPane } = Tabs;

const GeneralSearchPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  const notification = useAppNotification(); // ✅ initialize notification hook

  const { token } = theme.useToken();

  const [formCar] = Form.useForm();
  const [formTL] = Form.useForm();

  const [plateNumber, setPlateNumber] = useState<string | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<any | null>(null);
  const [tlData, setTlData] = useState<any | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any | null>(null);
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [permitsRequest, setPermitsRequest] = useState([]);

  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetCarPlateDetails, { isFetching: isFetchingCarDetails }] = useLazyGetCarPlateDetailsQuery();
  const [triggerGetTradeLicenseDetails, { isFetching: isFetchingTL }] = useLazyGetTradeLicenseDetailsQuery();

  // Fetch fines using only the plate number
  // const { data: finesData, isFetching: isFetchingFines } = useSearchFinesQuery(
  //   { plateNumber: plateNumber },
  //   { skip: !plateNumber },
  // );

  const permitsRequestTableColumn: TableColumnProps[] = [
    { title: t("form.applicationId"), dataIndex: "applicationID", key: "applicationID" },
    { title: t("form.permitStatus"), dataIndex: "permitStatus", key: "permitStatus" },
    { title: t("form.permitType"), dataIndex: "permitType", key: "permitType" },
    { title: t("form.tradeLicenseNumber"), dataIndex: "tradeLicenseNumber", key: "tradeLicenseNumber" },
  ];

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

  const [triggerGetPermitsRequest, { isLoading: isLoadingPermitsRequest }] = useLazyGetPermitsRequestQuery();

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
    setPageTitle(t("sidebar.general"));
  }, [setPageTitle, i18n.language]); // 👈 Add i18n.language

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
      notification.error(error, t("messages.failedvehicleDetailsFetched"));
      setVehicleDetails(null);
    }
  };

  const handleTlSearch = async (values: any) => {
    try {
      const permitsRequestsParams = {
        permitIssueDateFrom: "string",
        permitIssueDateTo: "string",
        permitType: "string",
        tradeLicenseNumber: values.licenseNo.toString() || "",
      };

      // API expects only a string in JSON (e.g., "1234")
      const result = await triggerGetTradeLicenseDetails(JSON.stringify(values.licenseNo.toString())).unwrap();
      const permitsRequestResult = await triggerGetPermitsRequest(permitsRequestsParams);
      setTlData(result?.data || result); // bind response to state
      console.log(permitsRequestResult);

      setPermitsRequest(permitsRequestResult?.data?.data || []);
      notification.success(result, t("messages.tradeLicenseFetched"));
    } catch (error: any) {
      console.error("Trade License fetch failed:", error);
      notification.error(error, t("messages.failedToFetchTradeLicense"));
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

  const finesList = finesData?.data.filter((fine: any) => fine.plateNumber === plateNumber) || [];

  return (
    <>
      <Card bordered={false}>
        <Tabs defaultActiveKey="1" type="card">
          {/* Car Plate Tab */}
          <TabPane tab={t("tabs.carPlate")} key="1">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* Search Form */}
              <Form form={formCar} layout="vertical" onFinish={handleCarSearch} initialValues={{}}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item
                      name="plateNumber"
                      label={t("form.plateNumber")}
                      rules={[{ required: true, message: t("placeholders.plateNumber") }]}
                    >
                      <Input placeholder={t("placeholders.plateNumber")} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="plateSource"
                      label={t("form.plateSource")}
                      rules={[{ required: true, message: t("placeholders.plateSource") }]}
                    >
                      <Select
                        showSearch
                        placeholder={t("placeholders.plateSource")}
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label as string).toLowerCase().includes(input.toLowerCase())
                        }
                        options={plateSourceOptions.map((option) => ({
                          label: option.label,
                          value: option.value,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item
                      name="plateCategory" // 👈 this is "Type"
                      label={t("form.plateCategory")}
                      rules={[{ required: true, message: t("placeholders.plateCategory") }]}
                    >
                      <Select
                        showSearch
                        placeholder={t("placeholders.plateCategory")}
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label as string).toLowerCase().includes(input.toLowerCase())
                        }
                        options={plateCategoryOptions.map((option) => ({
                          label: option.label,
                          value: option.value,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item
                      name="plateCode" // 👈 this is "Color"
                      label={t("form.plateCode")}
                      rules={[{ required: true, message: t("placeholders.plateCode") }]}
                    >
                      <Select
                        showSearch
                        placeholder={t("placeholders.plateCode")}
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label as string).toLowerCase().includes(input.toLowerCase())
                        }
                        options={plateCodeOptions.map((option) => ({
                          label: option.label,
                          value: option.value,
                        }))}
                      />
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
                  <Card title={t("info.basicDetails")}>
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label={t("form.plateNumber")}>
                        {vehicleDetails.plateNo || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.trafficFileNo")}>
                        {vehicleDetails.trafficFileNo || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.businessName")}>
                        {vehicleDetails.companyName || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.email")}>
                        {vehicleDetails.companyEmail || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.vehicleType")}>
                        {vehicleDetails.vehicleType || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.vehicleColor")}>
                        {vehicleDetails.vehicleColor || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.vehicleOwnerName")}>
                        {vehicleDetails.ownerName || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.vehicleOwnerEmail")}>
                        {vehicleDetails.ownerEmail || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.vehicleOwnerMobile")}>
                        {vehicleDetails.ownerMobile || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.phoneNumber")}>
                        {vehicleDetails.ownerPhone || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("form.manufacturerYear")}>
                        {vehicleDetails.manufactureYear || "N/A"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {finesList.length > 0 && (
                    <Card title={t("info.allFines")}>
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
            </Space>
          </TabPane>

          {/* Trade License Tab */}
          <TabPane tab={t("tabs.tradeLicense")} key="2">
            <Form form={formTL} layout="vertical" onFinish={handleTlSearch}>
              <Row gutter={16} align="bottom">
                <Col span={8}>
                  <Form.Item
                    name="licenseNo"
                    label={t("form.tradeLicenseNumber")}
                    rules={[{ required: true, message: t("placeholders.tradeLicenseNumber") }]}
                  >
                    <Input placeholder={t("placeholders.tradeLicenseNumber")} />
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item label="&nbsp;">
                    {" "}
                    {/* Empty label to align with input */}
                    <Button type="primary" htmlType="submit" loading={isFetchingTL} style={{ marginTop: "4px" }}>
                      {t("common.search")}
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            <>
              {tlData && (
                <Card title={t("info.basicDetails")} className="mt-4">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label={t("form.licenseNo")}>{tlData.licenseNo || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.companyName")}>{tlData.companyName || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.companyEmail")}>{tlData.companyEmail || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.blackPoints")}>
                      {tlData.totalBlackPoints || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("form.goldenPoints")}>{tlData.goldenPoints || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.mobileNumber")}>{tlData.mobileNo || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.faxNumber")}>{tlData.faxNo || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.streetName")}>{tlData.streetName || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.streetNumber")}>{tlData.streetNo || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.buildingName")}>{tlData.buildingName || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.floorNumber")}>{tlData.floorNo || "N/A"}</Descriptions.Item>
                    <Descriptions.Item label={t("form.premiseNameEn")}>
                      {tlData.premiseNameEn || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("form.premiseNameAr")}>
                      {tlData.premiseNameAr || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("form.licenseIssuedDate")}>
                      {tlData.licenseIssueDate || "N/A"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}
              {permitsRequest.length > 0 && (
                <Card title={t("info.permitsRequest")} style={{ marginTop: "16px" }}>
                  <Table
                    scroll={{ x: "max-content" }}
                    columns={permitsRequestTableColumn}
                    dataSource={permitsRequest}
                    style={{
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: token.borderRadiusLG,
                      overflow: "hidden",
                      fontSize: 13,
                    }}
                  />
                </Card>
              )}
            </>
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
