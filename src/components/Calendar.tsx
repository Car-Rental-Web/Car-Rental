import Fullcalendar  from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {useRef, useEffect, useState} from 'react'


interface CalendarTypes {
  contentHeight?:string;
  height?:number
  end?:string
}

const Calendar:React.FC<CalendarTypes> = ({
  contentHeight,
  height,
  end
}) => {

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      // delay to wait for sidebar animation to finish
      setTimeout(() => {
        setCalendarKey(Math.random()); // force remount
      }, 100);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className='h-full  w-full'>
  <Fullcalendar
    key={calendarKey}
    plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
    initialView={'dayGridMonth'}
    headerToolbar ={{
        start:"title",
        center:"",
        end: end
    }} 
    height={height}
    contentHeight={contentHeight}
    />
    </div>
   
  )
}

export default Calendar