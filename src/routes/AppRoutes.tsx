import { Navigate, Route, Routes } from "react-router-dom";
import RootLayout from "../layout/RootLayout";
import {
  Aavailability,
  Dashboard,
  Maintenance,
  VehicleHistory,
  RenterProfile,
  TrashFiles,
  QrFiles,
} from "../features/rental/index";
import {
  ForgotPassword,
  LoginForm,
  RegisterForm,
  ResetPassword,
} from "../features/auth";
import PrivateRoutes from "./PrivateRoutes";
import { useRestoreSession } from "../hooks/useRestoreSession";
import { ToastContainer } from "react-toastify";
import { NotFound} from "../components";
import PublicRoutes from "./PublicRoutes";
import OnService from "../features/rental/components/OnService";
import OnReservation from "../features/rental/components/OnReservation";
import Completed from "../features/rental/components/Completed";
import {
  LaundryDashboard, 
  LaundryCalender,
  LaundryCustomerProfile,
  LaundryHistory,
  LaundryMaintenance,
  LaundryServices
}from "../features/laundry/index";

import {
  WaterDashboard, 
  WaterCalendar,
  WaterCustomerProfile,
  WaterHistory,
  WaterMaintenance,
  WaterProduct
}from "../features/waterstation/index";
import Overview from "../features/Overview";
import LaundryOnService from "../features/laundry/components/LaundryOnService";
import LaundryOnCompleted from "../features/laundry/components/LaundryOnCompleted";
import LaundryOnReservation from "../features/laundry/components/LaundryOnReservation";
import WaterOnDelivery from "../features/waterstation/components/WaterOnDelivery";
import POS from "../features/pos/Pos";

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
          <Route path="overview" element={<Overview/>} />
          <Route path="pos" element={<POS/>} />
          <Route index element={<Navigate to="/overview" replace />} />
            <Route path="car-rental/">
              <Route path="dashboard" element={<Dashboard />}></Route>
              <Route path="availability" element={<Aavailability />}></Route>
              <Route path="renterprofile" element={<RenterProfile />}></Route>
              <Route path="bookings/on-service" element={<OnService />}></Route>
              <Route path="bookings/on-reservation" element={<OnReservation />}></Route>
              <Route path="bookings/on-completed" element={<Completed />}></Route>
              <Route path="vehiclehistory" element={<VehicleHistory />}></Route>
              <Route path="maintenance" element={<Maintenance />}></Route>
              <Route path="trashfile" element={<TrashFiles />}></Route>
              <Route path="qrcode" element={<QrFiles />}></Route>
            </Route>

            <Route path="laundry/">
              <Route path="dashboard" element={<LaundryDashboard />} />
              <Route path="calendar" element={<LaundryCalender />} />
              <Route path="customers" element={<LaundryCustomerProfile />} />
              <Route path="bookings/on-service" element={<LaundryOnService/>} />
              <Route path="bookings/on-reservation" element={<LaundryOnReservation/>} />
              <Route path="bookings/on-completed" element={<LaundryOnCompleted/>} />
              <Route path="services" element={<LaundryServices />} />
              <Route path="maintenance" element={<LaundryMaintenance />} />
            </Route>
            
            <Route path="water/">
              <Route path="dashboard" element={<WaterDashboard />} />
              <Route path="calendar" element={<WaterCalendar />} />
              <Route path="customers" element={<WaterCustomerProfile />} />
              <Route path="bookings/on-completed" element={<WaterHistory />} />
               <Route path="bookings/on-reservation" element={<WaterOnDelivery />} />
              <Route path="products" element={<WaterProduct />} />
              <Route path="maintenance" element={<WaterMaintenance />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default AppRoutes;
