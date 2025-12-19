import Fullcalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRef, useEffect } from "react";
import type { EventInput } from "@fullcalendar/core/index.js";
import tippy from "tippy.js";
import to12Hour from "../utils/timeFormatter";

interface CalendarProps {
  contentHeight?: string;
  height?: number;
  end?: string;
  events: EventInput[];
}

const Calendar: React.FC<CalendarProps> = ({
  contentHeight,
  height,
  end,
  events,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<Fullcalendar | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      setTimeout(() => {
        const api = calendarRef.current?.getApi();
        api?.updateSize();
      }, 100);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full myCalendar">
      <Fullcalendar
        events={events}
        displayEventTime={false}
        eventDisplay="block"
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={"dayGridMonth"}
        headerToolbar={{
          start: "title",
          center: "",
          end: end,
        }}
        height={height}
        contentHeight={contentHeight}
       
        eventDidMount={(info) => {
          const props = info.event.extendedProps;

          const tooltipContent = `
            ${props.full_name}<br>
            Car Rented "${props.car_plate_number} - ${props.car_model} ${props.car_type}"<br>
            Location: ${props.location}<br>
            Pick up Time: ${to12Hour(props.start_time)}<br>
            Drop off Time: ${to12Hour(props.end_time)}<br>
            Status: ${props.status}
          `;

          tippy(info.el, {
            content: tooltipContent,
            allowHTML: true,
            placement: "top-start",
            theme: "white",
          });
        }}
      />
    </div>
  );
};

export default Calendar;
