const API_ENDPOINTS = {
  plate: {
    create: "/api/WhitelistPlate",
    update: "/api/WhitelistPlate",
    delete: (id: string) => `/api/WhitelistPlate/${id}`,
    getById: (id: string) => `/api/WhitelistPlate/${id}`,
    list: "/api/WhitelistPlate",
  },
  trade: {
    create: "/api/WhitelistTradeLicense",
    update: "/api/WhitelistTradeLicense",
    delete: (id: string) => `/api/WhitelistTradeLicense/${id}`,
    getById: (id: string) => `/api/WhitelistTradeLicense/${id}`,
    list: "/api/WhitelistTradeLicense",
  },
};

export default API_ENDPOINTS;
