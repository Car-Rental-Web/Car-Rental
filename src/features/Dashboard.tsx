import { useEffect, useState } from "react";
import { ReactChartLine } from "../components";
import Card from "../components/Card";
import icons from "../constants/icon";
import { supabase } from "../utils/supabase";


const Dashboard = () => {
const [value, setValue] = useState<number>(0)
const [status, setStatus] = useState<number>(0)


// fetch total revenue based on the total_price_rent of the booking 
const fetchRevenue = async () => {
    const { data, error} = await supabase.from('booking').select("id, total_price_rent, status") 
      
    if(error){
      console.log('Error Fetching Price')
      return
    }
    const completedBooking = data.filter(item => item.status === "Completed");
    const totalRevenue = completedBooking.reduce((acc, curr) => acc + Number(curr.total_price_rent), 0)


    console.log('Successfully Fetched Price',data)
    setValue(totalRevenue)
}

useEffect(() => {
    fetchRevenue()
},[])


//fetch On Service or On going  Status in the bookings
const fetchOnService = async () => {
  const {data, error} = await supabase.from('booking').select("id, status")

  if(error) {
    console.log('Error Fetching On Service Vehicles')
    return
  }

  const onService = data.filter(item => item.status === "On Service");
  const totalOnService = onService.length 

  console.log('Successfully Fetched On Service Vehicle')
  setStatus(totalOnService)
}

useEffect(() => {
  fetchOnService()
},[])


  return (
    <div className=" w-full bg-body  min-h-screen  pb-2 pt-12 px-2 2xl:px-3">
      <p className="text-5xl font-semibold text-gray-300 tracking-wide mb-5">
        Overview
      </p>
      <div className="flex flex-col gap-2 ">
        <div className="flex flex-col sm:flex-row w-full gap-3 ">
          <Card
            className="bg-border w-full"
            title="Renters"
            linkText="view"
            linkIcon={<icons.rightArrow className="text-2xl" />}
            url="/renterhistory"
            amount={<span className="text-6xl">20</span>}
            description={<span className="text-3xl">Monthly Renters</span>}
          />
          <Card
            className="bg-border w-full"
            title="Bookings"
            linkText="view"
            linkIcon={<icons.rightArrow className="text-2xl" />}
            url="/bookings"
            amount={<span className="text-6xl">20</span>}
            description={<span className="text-3xl">Monthly Bookings</span>}
          />
          <div className="w-full border border-gray-400 rounded">
            <p className="pl-2 pt-2 text-gray-200">Monthly Bookings</p>
            <ReactChartLine height={150} width={300} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row  gap-3  w-full">
          <div className="w-full border border-gray-400 rounded px-3">
            <p className="pl-2 pt-2 text-gray-200">Monthly Renters</p>
            <ReactChartLine height={250} width={400} />
          </div>
          <div className="flex flex-col w-full gap-2 ">
            <Card
              className="bg-border w-full h-full"
              title="Revenue"
              url={""}
              amount={<span className="text-6xl">{value.toLocaleString()}</span>}
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

export default Dashboard;
