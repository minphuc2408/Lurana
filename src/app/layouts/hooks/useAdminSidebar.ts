import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/features/auth";
export function useAdminSidebar({
  onClose
}: {
  onClose?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout
  } = useAuth();
  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose?.();
  };
  return {
    location,
    navigate,
    user,
    logout,
    handleLogout
  };
}
