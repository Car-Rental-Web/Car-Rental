import { Link } from "react-router-dom";
import icons from "../constants/icon";
import ReactChartLine from "../components/ReactChartLine";
import Calendar from "../components/Calendar";

const Dashboard = () => {
  return (
    <div className=" w-full">
      <div className="flex flex-col pl-6 pt-6 items-start">
        <p className="text-5xl font-semibold text-gray-600 tracking-wide ">
          Overview
        </p>
        <p className="text-gray-400">Monitor Monthly Status</p>
      </div>
      <div className="w-full flex">
        <div className="flex flex-col w-8/12 p-2">
          <div className=" w-full flex gap-3 pl-5 pt-5">
            <div className=" flex flex-col justify-around menu-bg rounded w-full h-42 py-4 px-4">
              <div className="flex justify-between px-4 ">
                <div className="flex flex-col items-center">
                  <p className="text-white text-2xl">Renters</p>
                  <icons.person className="w-12 h-12 mt-2 -mb-12 text-white" />
                </div>
                <div>
                  <Link
                    className="flex items-center text-white text-xl"
                    to="/admin/renterhistory"
                  >
                    view
                    <icons.rightArrow className="text-2xl text-start mt-1" />
                  </Link>
                </div>
              </div>
              <p className="text-center text-6xl text-white pb-2 font-extrabold">
                200
              </p>
              <p className="text-center text-white">Monthly Renters</p>
            </div>
            <div className="secondary-box-bg flex flex-col justify-around rounded w-full h-42 py-4 px-4">
              <div className="flex justify-between px-4 ">
                <div className="flex flex-col items-center">
                  <p className="text-white text-2xl">Bookings</p>
                  <icons.book className="w-12 h-12 mt-2 -mb-12 text-white" />
                </div>
                <div>
                  <Link
                    className="flex items-center text-white text-xl"
                    to="/admin/bookings"
                  >
                    view
                    <icons.rightArrow className="text-2xl text-start mt-1" />
                  </Link>
                </div>
              </div>
              <p className="text-center text-6xl text-white pb-2 font-extrabold">
               
                200
              </p>
              <p className="text-center text-white">Monthly Renters</p>
            </div>
          </div>
          <div className="pl-5 pt-2">
              <div className=" border border-gray-400 rounded p-4  w-full">
                <p className="text-gray-400">Monthly Renters</p>
                <p></p>
                <ReactChartLine />
              </div>
          </div>
        </div>
        <div className="flex flex-col justify-between w-2/6 pt-7 py-2 gap-2 pr-5">
            <div className=" rounded border border-gray-300 px-2 py-2">
              <Calendar height={510}/>
            </div>
            <div className="menu-bg rounded w-full h-full  flex flex-col justify-around items-center tertiray-box-bg py-4 px-4">
              <div className="flex justify-between px-4 w-full ">
                <div className="flex flex-col items-center">
                  <p className="text-white text-2xl">Revenue</p>
                </div>
                <icons.money className="text-4xl text-white text-start mt-1"/>
              </div>
               <p className="flex text-center items-center text-6xl text-white pb-2 font-extrabold ">
                 <icons.peso className="text-6xl text-center"/>
                20,000
              </p>
              <p className="text-center text-white">Monthly Revenue</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
