import { Link } from "react-router-dom";
import icons from "../constants/icon";
import { useState } from "react";

const SideBar = () =>  {
  const [isActive, setIsActive] = useState<string>("dashboard");
  const [vehicleMenu, setVehicleMenu] = useState<string | null>(null);
  const [isSubMenu, setIsSubMenu] = useState(false)

  const toggleVehicleMenu = (menu: string) => {
    setVehicleMenu(vehicleMenu === menu ? null : menu);
  };

  const isActiveMenu = (key: string) => {
    setIsActive(key);
    setIsSubMenu(false)
    
  };

  return (
    <div className=" min-w-96 h-svh ">
      <ul className="border-r-2 border-gray-300 h-full flex flex-col px-8 gap-2 pt-8 w-full">
        <li className="w-full">
          <Link
            onClick={() => {
              isActiveMenu("dashboard");
            }}
            className={`jakarta flex items-center  text-2xl gap-3 p-2 w-full ${
              isActive === "dashboard"
                ? "menu-bg text-white border border-white rounded-md"
                : "text-gray-400"
            }`}
            to="dashboard"
          >
              <icons.dashboard />
            Overview
          </Link>
        </li>
        <label className="text-gray-400">Manage</label>
        <li className="w-full">
          <Link
            onClick={() => {
              isActiveMenu("availability");
            }}
            className={`jakarta flex items-center text-2xl gap-3 p-2 ${
              isActive === "availability"
                ? "menu-bg text-white border border-white rounded-md"
                : "text-gray-400"
            }`}
            to="availability"
          >
              <icons.availability />
            Availability
          </Link>
        </li>
        <li className="">
          <Link
            onClick={() => {
              isActiveMenu("bookings");
            }}
            className={`jakarta flex items-center text-2xl gap-3 p-2 ${
              isActive === "bookings"
                ? "menu-bg text-white border border-white rounded-md"
                : "text-gray-400"
            }`}
            to="bookings"
          >
              <icons.booking />
            Bookings
          </Link>
        </li>
        <li className="">
          <Link
            onClick={() => {
              isActiveMenu("renterhistory");
            }}
            className={`jakarta flex items-center text-2xl gap-3 p-2 ${
              isActive === "renterhistory"
                ? "menu-bg text-white border border-white rounded-md"
                : "text-gray-400"
            }`}
            to="renterhistory"
          >
              <icons.booking />
            Renter History
          </Link>
        </li>
        <li className="">
          <button
            onClick={() => {
              isActiveMenu("vehicle");
              toggleVehicleMenu("vehicle");
              setIsSubMenu(true)
            }}
            className={`jakarta flex items-center text-2xl gap-3 p-2 w-full ${
              isActive === "vehicle"
                ? "menu-bg text-white border border-white rounded-md"
                : "text-gray-400"
            }`}
          >
              <icons.vehicle />
            Vehicles
          </button>
          {isSubMenu &&
          <ul className="pt-2">
            <li className="pl-5">
              <Link to="availablevehicles" className="text-gray-400">Available Vehicles</Link>
            </li>
            <li className="pl-5">
              <Link to="maintenance" className="text-gray-400">Maintenance</Link>
            </li>
          </ul>
          }
        </li>

      </ul>
    </div>
  );
};

export default SideBar;
