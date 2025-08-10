import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// const RTA_API_TARGET = "https://devparkingapi.kandaprojects.live";
// const FILE_SERVER_TARGET = "https://fileserver.kandaprojects.live";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["bitter-towns-float.loca.lt"],
    watch: {
      usePolling: true,
    },
    // proxy: {
    //   "/api": {
    //     target: RTA_API_TARGET,
    //     changeOrigin: true,
    //     secure: false,
    //   },

    //   "/file-api": {
    //     target: FILE_SERVER_TARGET,
    //     changeOrigin: true,
    //     secure: false,
    //     rewrite: (path) => path.replace(/^\/file-api/, ""),
    //   },
    // },
  },
});
