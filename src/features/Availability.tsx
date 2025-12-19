import { useEffect, useState } from "react";
import Calendar from "../components/Calendar";
import icons from "../constants/icon";
import { supabase } from "../utils/supabase";
import type { EventInput } from "@fullcalendar/core/index.js";
import to12Hour from "../utils/timeFormatter";

const Availability = () => {
  const [events, setEvents] = useState<EventInput[]>([]);

  useEffect(() => {
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
          return {
            id: String(item.id),
            title: `${item.full_name}
             `,
            start: new Date(item.start_date).toISOString(),
            end: adjustedEndDate.toISOString(),
            color,
            extendedProps: {
              full_name: item.full_name,
              car_plate_number: item.car_plate_number,
              car_model: item.car_model,
              car_type: item.car_type,
              location: item.location,
              start_time: item.start_time,
              end_time: item.end_time,
              status: item.status,
            },
          };
        });
        setEvents(rowData);
      } catch (error) {
        console.log("Error", error);
      }
    };
    fetchBookings();
  },);

  return (
    <div className="p-12  w-full bg-body">
      <div className="text-white pb-6">
        <p>Status</p>
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2">
            On Service <icons.onService className="text-green-500" />
          </p>
          <p className="flex items-center gap-2">
            Reservation <icons.onReserve className="text-blue-700" />
          </p>
          <p className="flex items-center gap-2">
            Completed <icons.completed className="text-red-600" />
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
