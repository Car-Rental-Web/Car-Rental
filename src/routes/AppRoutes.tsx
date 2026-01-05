import { Route, Routes } from "react-router-dom";
import RootLayout from "../layout/RootLayout";
import {
  Aavailability,
  Vehicles,
  Bookings,
  Dashboard,
  Maintenance,
  RenterHistory,
  VehicleHistory,
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
import { NotFound } from "../components";
import PublicRoutes from "./PublicRoutes";
import TestForm from "../modals/testForm";

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
          <Route path="test" element={<TestForm/>}></Route>
            <Route path="dashboard" element={<Dashboard />}></Route>
            <Route path="availability" element={<Aavailability />}></Route>
            <Route path="bookings" element={<Bookings />}></Route>
            <Route path="renterhistory" element={<RenterHistory />}></Route>
            <Route path="vehiclehistory" element={<VehicleHistory />}></Route>
            <Route path="vehicle" element={<Vehicles />}></Route>
            <Route path="maintenance" element={<Maintenance />}></Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default AppRoutes;
