import dayjs from "dayjs";
import "dayjs/locale/ar";

const getUILanguage = () => {
  const storedLang = localStorage.getItem("i18nextLng");
  if (storedLang) return storedLang;
  if (document.documentElement.dir === "rtl") return "ar";
  return "en";
};

export const formatDateByLocale = (
  value: string | number | Date,
  formats: { en: string; ar: string },
  language?: string,
) => {
  if (!value) return "";
  const lang = language || getUILanguage();
  const isArabic = lang.startsWith("ar");
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "";
  return parsed.locale(isArabic ? "ar" : "en").format(isArabic ? formats.ar : formats.en);
};

export const formatDateDisplay = (value: string | number | Date, language?: string) =>
  formatDateByLocale(value, { en: "DD MMM YYYY", ar: "DD MMMM YYYY" }, language);

export const formatDateTimeDisplay = (value: string | number | Date, language?: string) =>
  formatDateByLocale(value, { en: "DD MMM YYYY, h:mm A", ar: "DD MMMM YYYY، hh:mm A" }, language);
