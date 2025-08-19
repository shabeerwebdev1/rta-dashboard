import React from "react";
import { App, List, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface ApiErrorResponse {
  data?: {
    en_Msg?: string;
    ar_Msg?: string;
    validationErrors?: {
      fieldName: string;
      enMessage: string;
      arMessage: string;
    }[];
  };
}
const { Text } = Typography;

export const useAppNotification = () => {
  const { notification } = App.useApp();
  const { i18n } = useTranslation();

  const getLangMsg = (enMsg?: string, arMsg?: string) => {
    return i18n.language === "ar" && arMsg ? arMsg : enMsg;
  };

  const success = (response: unknown, defaultMessage: string) => {
    const data = response?.data ?? response;
    const title = getLangMsg(data?.en_Msg, data?.ar_Msg) || defaultMessage;
    notification.success({
      message: title,
      placement: "topRight",
    });
  };

  const error = (error: ApiErrorResponse, defaultMessage: string) => {
    const errData = error?.data;
    const title = getLangMsg(errData?.en_Msg, errData?.ar_Msg) || defaultMessage;

    let description: React.ReactNode = null;
    if (errData?.validationErrors && errData.validationErrors.length > 0) {
      description = React.createElement(List, {
        size: "small",
        dataSource: errData.validationErrors,
        renderItem: (ve: { fieldName: string; enMessage: string; arMessage: string }) =>
          React.createElement(
            List.Item,
            {},
            React.createElement(Text, { strong: true }, ve.fieldName + ": "),
            getLangMsg(ve.enMessage, ve.arMessage),
          ),
      });
    }

    notification.error({
      message: title,
      description: description,
      placement: "topRight",
    });
  };

  return { success, error };
};
