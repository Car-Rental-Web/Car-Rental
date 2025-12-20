import {useState } from "react";
import Calendar from "../components/Calendar";
import { supabase } from "../utils/supabase";
import type { EventInput } from "@fullcalendar/core/index.js";

const Availability = () => {
  const [events, setEvents] = useState<EventInput[]>([]);

    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from("booking")
          .select(
            "id, full_name, car_plate_number, car_model,car_type, start_date, end_date, start_time, end_time, location, status"
          );

        if (error) {
          console.log("Error Fetching Bookings");
          return;
        }
        const rowData: EventInput[] = (data ?? []).map((item) => {
          let color = "";
          switch (item.status) {
            case "On Service":
              color = "green";
              break;
            case "On Reservation":
              color = "blue";
              break;
            case "Completed":
              color = "red";
              break;
            default:
              color = "gray";
          }
          const adjustedEndDate = new Date(item.end_date);
          adjustedEndDate.setDate(adjustedEndDate.getDate());
          const startDate = new Date(item.start_date).toLocaleDateString("en-US",{
            year:"numeric",
            month: "long",
            day:"2-digit"
          })

          const endDate = new Date(adjustedEndDate).toLocaleDateString("en-US", {
            year:"numeric",
            month: "long",
            day: "2-digit"
          })

          return {
            id: String(item.id),
            title: `${item.full_name} Car Rented: ${item.car_plate_number} ${item.car_model} ${item.car_type} /  Location: ${item.location} Start Date: ${item.start_date} End Date: ${item.end_date} Pick up time: ${item.start_time} Drop off time: ${item.end_time}`,
            start: new Date(item.start_date).toISOString(),
            end: adjustedEndDate.toISOString(),
            color,
            extendedProps: {
              id:item.id,
              full_name: item.full_name,
              car_plate_number: item.car_plate_number,
              car_model: item.car_model,
              car_type: item.car_type,
              location: item.location,
              start_date:startDate,
              end_date:endDate,
              start_time: item.start_time,
              end_time: item.end_time,
              status: item.status,
            },
          };
        });
        setEvents((prev) => [...prev, ...rowData]);
      } catch (error) {
        console.log("Error", error);
      }
    };
    fetchBookings();

  return (
    <div className="p-12  w-full bg-body">
      <div className="text-white pb-6">
        <p>Status</p>
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-3">
          <span className="w-4 h-4 bg-green-500 rounded-full "></span>  On Service  
          </p>
          <p className="flex items-center gap-3">
           <span className="w-4 h-4 bg-blue-500 rounded-full"></span> Reservation 
          </p>
          <p className="flex items-center gap-3">
           <span className="w-4 h-4 bg-red-500 rounded-full"></span> Completed 
          </p>
        </div>
      </div>
      <Calendar
        events={events}
        height={700}
        end="today prevYear nextYear prev next"
      />
    </div>
  );
};

export default Availability;
