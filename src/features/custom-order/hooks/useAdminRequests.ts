import { useState } from "react";
import { getAdminRequestsDemoData } from "../admin-requests.service";
export function useAdminRequests() {
  const {
    requests,
    statusConfig
  } = getAdminRequestsDemoData();
  const [reqs, setReqs] = useState(requests);
  const [expanded, setExpanded] = useState<string | null>(null);
  const updateStatus = (id: string, status: string) => setReqs(prev => prev.map(r => r.id === id ? {
    ...r,
    status
  } : r));
  return {
    reqs,
    expanded,
    setExpanded,
    updateStatus,
    statusConfig
  };
}
export type AdminRequestsModel = ReturnType<typeof useAdminRequests>;
