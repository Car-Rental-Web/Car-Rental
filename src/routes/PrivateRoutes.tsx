// routes/PrivateRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/AuthStore";

const PrivateRoutes = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);

  // Prevent flicker & unwanted logout redirect
  if (loading) return <div className="w-full min-h-screen flex justify-center items-center">Loading....</div>; 

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoutes;
