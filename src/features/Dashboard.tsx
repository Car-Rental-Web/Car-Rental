import { Link } from "react-router-dom";
import icons from "../constants/icon";

const Dashboard = () => {
  return (
    <div className=" w-full">
      <div className="flex flex-col pl-6 pt-6 items-start">
        <p className="text-5xl font-semibold text-gray-600 tracking-wide ">
          Overview
        </p>
        <p className="text-gray-400">Monitor Monthly Status</p>
      </div>
      <div className="w-full">
        <div className="flex flex-col">
          <div className="w-8/12 flex gap-3 pl-5 pt-5">
            <div className="menu-bg rounded w-full h-42 py-4 px-4">
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
              <p className="text-center text-6xl text-white pb-2 font-extrabold">200</p>
              <p className="text-center text-white">Monthly Renters</p>
            </div>
             <div className="secondary-box-bg rounded w-full h-42 py-4 px-4">
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
              <p className="text-center text-6xl text-white pb-2 font-extrabold">200</p>
              <p className="text-center text-white">Monthly Renters</p>
            </div>
          </div>
          <div>
          </div>
        </div>
        <div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
