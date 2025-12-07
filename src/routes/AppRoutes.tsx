import { Route, Routes } from "react-router-dom";
import RootLayout from "../layout/RootLayout";
import {
  Aavailability,
  AvailableVehicles,
  Bookings,
  Dashboard,
  Maintenance,
  RenterHistory,
} from "../features/index";
import { ForgotPassword, LoginForm, ResetPassword } from "../auth";
import PrivateRoutes from "./PrivateRoutes";
import { useRestoreSession } from "../hooks/useRestoreSession";
import { ToastContainer } from "react-toastify";

const AppRoutes = () => {
  useRestoreSession();
  return (
    <>
      <ToastContainer position="top-right" />
      <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/resetpassword" element={<ResetPassword />} />
            <Route element={<PrivateRoutes />}>
            <Route path="/" element={<RootLayout />}>
                  <Route path="dashboard" element={<Dashboard />}></Route>
                  <Route path="availability" element={<Aavailability />}></Route>
                  <Route path="bookings" element={<Bookings />}></Route>
                  <Route path="renterhistory" element={<RenterHistory />}></Route>
                  <Route path="vehicle" element={<AvailableVehicles />}></Route>
                  <Route path="maintenance" element={<Maintenance />}></Route>
            </Route>
        </Route>
      </Routes>
    </>
  );
};

export default AppRoutes;
