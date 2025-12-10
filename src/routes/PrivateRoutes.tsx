// routes/PrivateRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.ts";

const PrivateRoutes = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);

  if (loading)
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-body text-white">
        Loading....
      </div>
    );

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
export default PrivateRoutes;
