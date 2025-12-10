import { ReactChartLine } from "../components";
import Card from "../components/Card";
import icons from "../constants/icon";
const Dashboard = () => {
  return (
    <div className=" w-full bg-body  min-h-screen  py-2 pt-12 px-2 2xl:px-3">
      <p className="text-5xl font-semibold text-gray-300 tracking-wide mb-5">Overview</p>
      <div className="flex flex-col gap-2 ">
        <div className="flex flex-col 2xl:flex-row w-full gap-3 ">
          <Card
            className="bg-border w-full"
            title="Renters"
            linkText="view"
            linkIcon={<icons.rightArrow className="text-2xl"/>}
            url="/renterhistory"
            amount={<span className="text-6xl">20</span>}
            description={<span className="text-3xl">Monthly Renters</span>}
          />
          <Card
            className="bg-border w-full"
            title="Bookings"
            linkText="view"
            linkIcon={<icons.rightArrow className="text-2xl"/> }
            url="/bookings"
            amount={<span className="text-6xl">20</span>}
            description={<span className="text-3xl">Monthly Bookings</span>}
          />
          <div className="w-full border border-gray-400 rounded">
              <p className="pl-2 pt-2 text-gray-200" >Monthly Bookings</p>
              < ReactChartLine height={150} width={300}/>
          </div>
      </div>
        <div className="flex flex-col 2xl:flex-row  gap-3  w-full">
          <div className="w-full border border-gray-400 rounded px-3">
              <p className="pl-2 pt-2 text-gray-200" >Monthly Renters</p>
              <ReactChartLine height={250} width={400}/>
          </div>
          <div className="flex flex-col w-full gap-2 ">
            <Card className="bg-border w-full h-full" title="Revenue" url={""} amount={<span className="text-6xl">20,000</span>} description={"Monthly Revenue"} linkIcon={<icons.money/>}/>
            <Card className="bg-border w-full h-full " title="On Service" url={""} amount={<span className="text-6xl">12</span>} description={"Currently On Service"} linkIcon={<icons.onService/>}/>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
