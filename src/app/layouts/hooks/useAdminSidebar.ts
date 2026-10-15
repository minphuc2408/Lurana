import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/features/auth";
import { useRef, useState } from 'react';
export function useAdminSidebar({
  onClose
}: {
  onClose?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout, error
  } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const busy = useRef(false);
  const handleLogout = async () => {
    if (busy.current) return;
    busy.current = true; setSigningOut(true);
    try {
      if (await logout()) { navigate('/admin/login', { replace: true }); onClose?.(); }
    } finally { busy.current = false; setSigningOut(false); }
  };
  return {
    location,
    navigate,
    user,
    logout,
    handleLogout, signingOut, error
  };
}
