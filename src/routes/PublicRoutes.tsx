import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const PublicRoutes = () => {
  const {isAuthenticated, isRecoveringPassword} = useAuthStore()
  const loading = useAuthStore((state) => state.loading);

  if (loading)
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-body text-white">
        Loading....
      </div>
    );

  return isAuthenticated && !isRecoveringPassword ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoutes;
