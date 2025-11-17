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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/admin" element={<RootLayout />}>
        <Route path="dashboard" element={<Dashboard />}></Route>
        <Route path="availability" element={<Aavailability />}></Route>
        <Route path="bookings" element={<Bookings />}></Route>
        <Route path="renterhistory" element={<RenterHistory />}></Route>
        <Route path="availablevehicles" element={<AvailableVehicles />}></Route>
        <Route path="maintenance" element={<Maintenance />}></Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
