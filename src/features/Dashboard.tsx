import { Suspense, useEffect, useState } from "react";
import icons from "../constants/icon";
import { supabase } from "../utils/supabase";
import React from "react";
import { Card } from "../components";

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
      .from("booking")
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
    <div className=" w-full bg-body  min-h-screen  pb-2 pt-12 px-2 2xl:px-3">
      <p className="text-5xl font-semibold text-gray-300 tracking-wide mb-5">
        Overview
      </p>
      <div className="flex flex-col gap-2 ">
        <div className="flex flex-col md:flex-row lg:flex w-full gap-3 ">
          <Card
            className="bg-border w-full"
            title="Renters"
            linkText="view"
            linkIcon={<icons.rightArrow className="text-2xl" />}
            url="/renterhistory"
            amount={<span className="text-6xl">{renter}</span>}
            description={<span className="text-3xl">Total Renters</span>}
          />
          <Card
            className="bg-border w-full"
            title="Bookings"
            linkText="view"
            linkIcon={<icons.rightArrow className="text-2xl" />}
            url="/bookings"
            amount={<span className="text-6xl">{booking}</span>}
            description={<span className="text-3xl">Total Bookings</span>}
          />
          <div className="border border-gray-400 w-full  rounded">
            <Suspense>
              <BookingVisual />
            </Suspense>
          </div>
        </div>
        <div className="flex flex-col md:flex-row  gap-3  w-full">
          <div className="border border-gray-400 w-full  rounded">
            <Suspense>
              <RenterVisual />
            </Suspense>
          </div>
          <div className="flex flex-col w-full gap-2 ">
            <Card
              className="bg-border w-full h-full"
              title="Revenue"
              url={""}
              amount={
                <span className="text-6xl">{value.toLocaleString()}</span>
              }
              description={"Monthly Revenue"}
              linkIcon={<icons.money />}
            />
            <Card
              className="bg-border w-full h-full "
              title="On Service"
              url={""}
              amount={<span className="text-6xl">{status}</span>}
              description={"Currently On Service"}
              linkIcon={<icons.onService />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
