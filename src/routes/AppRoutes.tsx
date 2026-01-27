import { Route, Routes } from "react-router-dom";
import RootLayout from "../layout/RootLayout";
import {
  Aavailability,
  Dashboard,
  Maintenance,
  VehicleHistory,
  RenterProfile,
  RenterTable,
  TrashFiles,
  QrFiles,
} from "../features/index";
import {
  ForgotPassword,
  LoginForm,
  RegisterForm,
  ResetPassword,
} from "../auth";
import PrivateRoutes from "./PrivateRoutes";
import { useRestoreSession } from "../hooks/useRestoreSession";
import { ToastContainer } from "react-toastify";
import { NotFound} from "../components";
import PublicRoutes from "./PublicRoutes";

const AppRoutes = () => {
  useRestoreSession();
  return (
    <>
      <ToastContainer position="top-right" />
      <Routes>
        <Route path="*" element={<NotFound />} />

        <Route element={<PublicRoutes/>}>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register32132132131" element={<RegisterForm />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<RootLayout />}>
            <Route path="dashboard" element={<Dashboard />}></Route>
            <Route path="availability" element={<Aavailability />}></Route>
            <Route path="renterprofile" element={<RenterProfile />}></Route>
            <Route path="historyofrent" element={<RenterTable />}></Route>
            <Route path="vehiclehistory" element={<VehicleHistory />}></Route>
            <Route path="maintenance" element={<Maintenance />}></Route>
            <Route path="trashfile" element={<TrashFiles />}></Route>
            <Route path="qrcode" element={<QrFiles />}></Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default AppRoutes;
