import Calendar from "../components/Calendar"
import icons from "../constants/icon"

const Availability = () => {
  return (
    <div className="p-12  w-full bg-body">
      <div className="text-white pb-6">
        <p>Status</p>
        <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2">On Service <icons.onService className="text-green-500"/></p>
        <p className="flex items-center gap-2">Reservation <icons.onReserve className="text-blue-700"/></p>
        <p className="flex items-center gap-2">Completed <icons.completed className="text-red-600"/></p>
        </div>
      
      </div>
      
      <Calendar height={700} end="today prevYear nextYear prev next"/>
    </div>
  )
}

export default Availability