export const getCurrentLang = () => {
  return localStorage.getItem("language") || "en";
};