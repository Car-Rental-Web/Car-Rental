import Fullcalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRef, useEffect} from "react";

interface CalendarProps {
  contentHeight?: string;
  height?: number;
  end?: string;
}

const Calendar: React.FC<CalendarProps> = ({ contentHeight, height, end }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef= useRef<Fullcalendar | null>(null)

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      setTimeout(() => {
       const api = calendarRef.current?.getApi();
        api?.updateSize()
      },100)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <Fullcalendar
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
      />
    </div>
  );
};

export default Calendar;
