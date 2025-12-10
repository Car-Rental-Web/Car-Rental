import Calendar from "../components/Calendar"

const Availability = () => {
  return (
    <div className="p-12  w-full bg-body">
      <Calendar height={1200} end="today prevYear nextYear prev next"/>
    </div>
  )
}

export default Availability