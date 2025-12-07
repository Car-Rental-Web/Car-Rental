import icons from "../constants/icon";
import ReactChartLine from "../components/ReactChartLine";
import Calendar from "../components/Calendar";
import Card from "../components/Card";
import { Link } from "react-router-dom";


const Dashboard = () => {
  return (
    <div className=" w-full py-12 px-2 xl:px-4  ">
        <div className="flex flex-col items-start">
          <p className="text-2xl xl:text-5xl font-semibold text-gray-600 tracking-wide ">
            Overview
          </p>
          <p className="text-gray-400 text-sm xl:text-xl">Monitor Monthly Status</p>
        </div>
          <div className="w-full  gap-2 flex flex-col xl:flex-row pt-3 ">
            <div className="flex flex-col xl:w-8/12  ">
              <div className=" w-full  gap-2 flex flex-col xl:flex-row  ">
                <Card
                  className="w-full h-42 menu-bg"
                  title={<span className="text-md xl:text-3xl">Renters</span>}
                  linkText={<span className="text-md xl:text-xl">view</span>}
                  icon={
                    <icons.person className="w-6 xl:w-12 h-6 xl:h-12 mt-2 -mb-12 text-white" />
                  }
                  linkIcon={
                    <icons.rightArrow className="text-2xl text-start mt-1" />
                  }
                  url="/renterhistory"
                  amount={<span className="text-6xl">200</span>}
                  description={<span>Monthly Renters</span>}
                />
                <Card
                  className="secondary-box-bg w-full h-42"
                  title={<span className="text-md xl:text-3xl">Bookings</span>}
                  linkText={<span className="text-md xl:text-xl">view</span>}
                  linkIcon={
                    <icons.rightArrow className="text-2xl text-start mt-1" />
                  }
                  icon={
                    <icons.book className="w-12 h-12 mt-2 -mb-12 text-white" />
                  }
                  url="/bookings"
                  amount={<span className="text-base xl:text-6xl">200</span>}
                  description={<span>Monthly Bookings</span>}
                />
              </div>
              <div className="pt-2">
                <div className=" border border-gray-400 rounded p-4">
                  <p className="text-gray-400">Monthly Renters</p>
                  <ReactChartLine />
                </div>
              </div>
            </div>
            <div className="flex flex-col  justify-center  xl:w-2/6  gap-2 ">
              <div className=" rounded border border-gray-400 px-2 py-2 flex flex-col ">
                <Link to="/admin/availability" className=" pr-4 flex items-center justify-end"> View <icons.rightArrow className="text-2xl"/></Link>
                <Calendar />
              </div>
              {/* w-full h-full  flex flex-col justify-around items-center tertiray-box-bg py-4 px-4 */}
                 <Card
                className="w-full h-full  flex flex-col justify-around  tertiray-box-bg py-4 px-4"
                title={<span className="text-md xl:text-3xl">Revenue</span>}
                url={""}
                topIcon={<icons.money className="text-4xl text-white text-start mt-1"/>}
                amount={<span className="text-6xl">200</span>}
                amountIcon ={<icons.peso className="text-6xl text-center"/>}
                description="Monthly Revenue"
              />
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
