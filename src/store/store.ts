import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { dynamicApi } from "../services/rtkApiFactory";
import { fileApi } from "../services/fileApi";

export const store = configureStore({
  reducer: {
    [dynamicApi.reducerPath]: dynamicApi.reducer,
    [fileApi.reducerPath]: fileApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(dynamicApi.middleware)
      .concat(fileApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
