/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from "react";
import { FolderOpenFilled } from "@ant-design/icons";

import ParkonicViewDrawer from "../parkonic/ParkonicViewDrawer";
import ParkonicLocationViewDrawer from "../ParkonicLocation/ParkonicLocationViewDrawer";
import LeaveViewDrawer from "../Leaves/LeaveViewDrawer";
import FinesViewDrawer from "../fines/FinesViewDrawer";
import DisputeViewModal from "../dispute/DisputeViewModal";
import TowingViewDrawer from "../Towing/TowingViewDrawer";

import {
  useLazyGetLeaveDetailsByIdQuery,
  useLazyGetCarInspectionByIdQuery,
  useLazyGetTLInspectionByIdQuery,
  useLazyGetParkonicByIdQuery,
  useLazyGetParkonicsLocationByIdQuery,
} from "../../services/rtkApiFactory";

const ENTITY_CONFIG: Record<string, any> = {
  // Leave request
  "parking-user-leave-request": {
    component: LeaveViewDrawer,
    type: "drawer",
    fetchData: true,
    fetcher: "getLeaveById",
    getFetchId: (record: any) => record?.EntityGUID || record?.entityGUID || record?.leaveId || record?.id,
    mergeRecord: (apiRes: any, original: any) => ({
      ...(apiRes?.data || apiRes),
      ...original,
      leaveId:
        original.leaveId ||
        original.id ||
        apiRes?.data?.leaveId ||
        apiRes?.data?.id ||
        apiRes?.data?.EntityGUID ||
        apiRes?.data?.entityId,
      id: original.id || apiRes?.data?.EntityGUID,
      EntityCode: original.EntityCode,
      entityCode: original.entityCode,
      EntityGUID: original.EntityGUID || original.entityGUID || apiRes?.data?.EntityGUID || apiRes?.data?.entityGUID,
      $SKWorkItemData: original.$SKWorkItemData || apiRes?.data?.$SKWorkItemData,
      ActivityCode:
        original.ActivityCode || original.nvarchar3 || apiRes?.data?.ActivityCode || apiRes?.data?.nvarchar3 || "",
    }),
  },

  // Parkonic Fines
  "parking-parkonic-fines": {
    component: ParkonicViewDrawer,
    type: "drawer",
    fetchData: true,
    fetcher: "getParkonicById",
    mergeRecord: (apiRes: any, original: any) => ({
      ...(apiRes?.data || apiRes),
      $SKWorkItemData: original.$SKWorkItemData,
      EntityGUID: original.EntityGUID,
      EntityCode: original.EntityCode,
      ActivityCode: original.ActivityCode || original.nvarchar3,
      iid: original.id,
    }),
  },

  // Parkonic Location
  "parking-parkonic-location": {
    component: ParkonicLocationViewDrawer,
    type: "drawer",
    fetchData: true,
    fetcher: "getLocationById",
    extraProps: { config: { name: { singular: "entity.location" } } },
    mergeRecord: (apiRes: any, original: any) => ({
      ...(apiRes?.data || apiRes),
      $SKWorkItemData: original.$SKWorkItemData,
      EntityGUID: original.EntityGUID,
      EntityCode: original.EntityCode,
      ActivityCode: original.ActivityCode || original.nvarchar3 || apiRes?.data?.ActivityCode || "",
    }),
  },

  // Fine cancel request
  "parking-fine-cancel-request": {
    component: FinesViewDrawer,
    type: "drawer",
    fetchData: true,
    fetcher: "getFineById",
    getFetchId: (record: any) => record?.EntityGUID || record?.entityGUID || record?.inspectionGUID || record?.id,
    mergeRecord: (apiRes: any, original: any) => ({
      ...original,
      ...(apiRes?.data || apiRes),
      inspectionGUID: original.EntityGUID || original.entityGUID || original.inspectionGUID || original.id,
      EntityGUID: original.EntityGUID || original.entityGUID || original.inspectionGUID || original.id,
      entityCode: original.entityCode || original.EntityCode,
      EntityCode: original.EntityCode || original.entityCode,
      inspectionStatus: 15003,
    }),
  },

  // Dispute
  "parking-parkonic-fine-dispute": {
    component: DisputeViewModal,
    type: "modal",
    fetchData: false,
    mergeRecord: (_apiRes: any, original: any) => original,
  },
  "parking-vehicle-fine-dispute": {
    component: DisputeViewModal,
    type: "modal",
    fetchData: false,
    mergeRecord: (_apiRes: any, original: any) => original,
  },
  "parking-parking-fine-dispute": {
    component: DisputeViewModal,
    type: "modal",
    fetchData: false,
    mergeRecord: (_apiRes: any, original: any) => original,
  },
  "parking-towing": {
    component: TowingViewDrawer,
    type: "drawer",
    fetchData: false,
    mergeRecord: (_apiRes: any, original: any) => original,
  },
};

export const useEntityHandler = () => {
  const [state, setState] = useState({
    open: false,
    record: null as any,
    entityCode: "",
    isLoading: false,
    fetchedData: null as any,
  });

  const [getLeaveById] = useLazyGetLeaveDetailsByIdQuery();
  const [getCarInspectionById] = useLazyGetCarInspectionByIdQuery();
  const [getTLInspectionById] = useLazyGetTLInspectionByIdQuery();
  const [getParkonicById] = useLazyGetParkonicByIdQuery();
  const [getLocationById] = useLazyGetParkonicsLocationByIdQuery();

  // Map fetchers to their functions
  const fetchers: Record<string, any> = {
    getLeaveById,
    getFineById: async (entityId: string | number) => {
      try {
        const carRes = await getCarInspectionById(String(entityId)).unwrap();
        if (carRes) return carRes;
      } catch {
        // Try TL inspection if car inspection is unavailable for this GUID.
      }

      const tlRes = await getTLInspectionById(String(entityId)).unwrap();
      return tlRes;
    },
    getParkonicById,
    getLocationById,
    // Add more fetchers here as needed
  };

  const fetchEntityData = useCallback(async (entityCode: string, entityId: string | number) => {
    const config = ENTITY_CONFIG[entityCode];
    if (!config?.fetchData || !config.fetcher) return null;

    const fetcher = fetchers[config.fetcher];
    if (!fetcher) {
      console.warn(`No fetcher found for: ${config.fetcher}`);
      return null;
    }

    try {
      const res = await fetcher(entityId).unwrap();
      return res;
    } catch (error) {
      console.error(`Error fetching data for ${entityCode}:`, error);
      throw error;
    }
  }, []);

  const openEntity = useCallback(
    async (entityCode: string, record: any) => {
      const config = ENTITY_CONFIG[entityCode];

      if (!config) {
        console.warn(`No configuration found for entity: ${entityCode}`);
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, entityCode, record }));

        let fetchedData = null;

        if (config.fetchData) {
          const fetchId = config.getFetchId ? config.getFetchId(record) : record.EntityGUID;

          if (fetchId === undefined || fetchId === null || fetchId === "") {
            console.warn(`No fetch id found for entity: ${entityCode}`);
            setState((prev) => ({ ...prev, isLoading: false }));
            return;
          }

          fetchedData = await fetchEntityData(entityCode, fetchId);
        }

        if (config.mergeRecord) {
          fetchedData = config.mergeRecord(fetchedData, record);
        }

        setState({
          open: true,
          record,
          entityCode,
          isLoading: false,
          fetchedData: fetchedData || record,
        });
      } catch (error) {
        console.error(`Error opening ${entityCode}:`, error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [fetchEntityData],
  );

  const closeEntity = useCallback(() => {
    setState({
      open: false,
      record: null,
      entityCode: "",
      isLoading: false,
      fetchedData: null,
    });
  }, []);

  return {
    ...state,
    openEntity,
    closeEntity,
  };
};

interface DynamicEntityHandlerProps {
  entityCode: string;
  record: any;
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  fetchedData?: any;
}

export const DynamicEntityHandler: React.FC<DynamicEntityHandlerProps> = ({
  entityCode,
  record,
  open,
  onClose,
  isLoading = false,
  fetchedData,
}) => {
  if (!open || !entityCode || !record) return null;

  const config = ENTITY_CONFIG[entityCode];
  if (!config) {
    console.warn(`No configuration found for entity: ${entityCode}`);
    return null;
  }

  const Component = config.component;
  const mergedRecord = fetchedData || record;

  const commonProps = {
    open,
    onClose,
    record: mergedRecord,
    isLoading,
    ...(config.extraProps || {}),
  };

  return <Component {...commonProps} />;
};

interface EntityActionButtonProps {
  record: any;
  entityCode: string;
  onClick: (entityCode: string, record: any) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const EntityActionButton: React.FC<EntityActionButtonProps> = ({
  record,
  entityCode,
  onClick,
  disabled = false,
  icon = <FolderOpenFilled style={{ fontSize: 16 }} />,
}) => {
  const config = ENTITY_CONFIG[entityCode];

  if (!config) {
    console.warn(`No config for entity: ${entityCode}`);
    return null;
  }

  return (
    <span
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={() => !disabled && onClick(entityCode, record)}
    >
      {icon}
    </span>
  );
};

// Export everything
export default {
  DynamicEntityHandler,
  EntityActionButton,
  useEntityHandler,
  ENTITY_CONFIG,
};
