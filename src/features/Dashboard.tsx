import { Suspense, useEffect, useState } from "react";
import icons from "../constants/icon";
import { supabase } from "../utils/supabase";
import React from "react";
import Card from "../components/Card";

const BookingVisual = React.lazy(() => import("../components/BookingVisual"));
const RenterVisual = React.lazy(() => import("../components/RenterVisual"));

const Dashboard = () => {
  const [value, setValue] = useState<number>(0);
  const [status, setStatus] = useState<number>(0);
  const [renter, setRenter] = useState<number>(0);
  const [booking, setBooking] = useState<number>(0);

  // fetch total revenue , on service, total bookings
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("renter_booking")
      .select("status, total_price_rent");

    if (error) {
      console.log("Error Fetching On Service Vehicles");
      return;
    }

    let revenue = 0;
    let onService = 0;
    const totalBookings = data.length;
    data.forEach((item) => {
      if (item.status === "Completed") {
        revenue += Number(item.total_price_rent);
      }
      if (item.status === "On Service") {
        onService += 1;
      }
    });

    console.log("Successfully Fetched On Service Vehicle");
    setValue(revenue);
    setStatus(onService);
    setBooking(totalBookings);
  };

  const fetchRenters = async () => {
    const { data, error } = await supabase.from("renter").select("id");

    if (error) {
      console.log("Error Fetching renmter");
      return;
    }

    console.log("Fetched Renter", data);
    setRenter(data.length);
  };
  useEffect(() => {
    Promise.all([fetchBookings(), fetchRenters()]);
  }, []);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-10 pt-8 px-4 lg:px-10">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 font-medium">Monitoring your rental performance and fleet status.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top Row: Stats & Booking Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-2"
            title={<span className="text-slate-800">Total Renters</span>}
            linkText="View All"
            linkIcon={<icons.rightArrow className="text-blue-500" />}
            url="/renterprofile"
            amount={<span className="text-5xl font-black text-slate-800">{renter}</span>}
            description={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Customers</span>}
          />
          <Card
            className="bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-2"
            title={<span className="text-slate-800">Total Bookings</span>}
            linkText="View All"
            linkIcon={<icons.rightArrow className="text-blue-500" />}
            url="/bookings"
            amount={<span className="text-5xl font-black text-slate-800">{booking}</span>}
            description={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lifetime Bookings</span>}
          />
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
            <Suspense fallback={<div className="h-40 w-full animate-pulse bg-slate-100" />}>
              <BookingVisual />
            </Suspense>
          </div>
        </div>

        {/* Bottom Row: Renter Chart & Sub-Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <Suspense fallback={<div className="h-60 w-full animate-pulse bg-slate-100" />}>
              <RenterVisual />
            </Suspense>
          </div>
          
          <div className="flex flex-col gap-4">
            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="Revenue"
              url={""}
              amount={<span className="text-4xl font-black text-emerald-600">₱{value.toLocaleString()}</span>}
              description={"Total Completed Earnings"}
              linkIcon={<icons.money className="text-emerald-500" />}
            />
            <Card
              className="bg-white border-none shadow-sm h-full rounded-2xl"
              title="On Service"
              url={""}
              amount={<span className="text-4xl font-black text-blue-600">{status}</span>}
              description={"Vehicles currently with renters"}
              linkIcon={<icons.onService className="text-blue-500" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
