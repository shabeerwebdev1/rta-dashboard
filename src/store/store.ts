import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { whitelistApi } from "./api/whitelistApi";
import { pledgeApi } from "./api/pledgeApi";
import { inspectionObstacleApi } from "./api/inspectionobstacleApi";

export const store = configureStore({
  reducer: {
    [whitelistApi.reducerPath]: whitelistApi.reducer,
    [pledgeApi.reducerPath]: pledgeApi.reducer,
    [inspectionObstacleApi.reducerPath]: inspectionObstacleApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(whitelistApi.middleware)
      .concat(pledgeApi.middleware)
      .concat(inspectionObstacleApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
