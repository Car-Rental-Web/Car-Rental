import { Link } from "react-router-dom";
import icons from "../constants/icon";
import { useState } from "react";
import { useLocation } from "react-router-dom";
const SideBar = () => {
  const location = useLocation();
  const [toggleMenu, setIsToggleMenu] = useState(false);

  return (
    <div className={` min-h-screen relative ${toggleMenu ? "w-36 xl:min-w-96 " : " w-24"}`}>
      <ul
        className={`border-r-2 border-gray-300 h-full flex flex-col gap-2 pt-8 w-full  ${
          toggleMenu ? "px-4 " : "px-8"
        }`}
      >
        <li className="w-full">
          <Link
            className={`transition-all duration-300 delay-100 flex items-center  text-xs xl:text-2xl    ${
              toggleMenu ?  "p-2 gap-3 w-full" :"justify-center p-1 mt-1 " 
            } ${
              location.pathname.includes("/admin/dashboard")
                ? "menu-bg text-white rounded-md "
                : "text-gray-400"
            }`}
            to="dashboard"
          >
            <icons.dashboard />
            {toggleMenu ? "OverView" : ""}
          </Link>
        </li>
        <label className="text-gray-400">{toggleMenu ? "Manage" : ""}</label>
        <li className="w-full">
          <Link
            className={`transition-all duration-300 delay-100 flex items-center text-xs xl:text-2xl gap-3 ${
              toggleMenu ? "p-2 gap-3 w-full" :"justify-center p-1 mt-1 " 
            } ${
              location.pathname.includes("/admin/availability")
                ? "menu-bg text-white  rounded-md"
                : "text-gray-400"
            }`}
            to="availability"
          >
            <icons.availability />
            {toggleMenu ? "Availability" : ""}
          </Link>
        </li>
        <li className="">
          <Link
            className={`transition-all duration-300 delay-100 flex items-center text-xs xl:text-2xl gap-3 ${
              toggleMenu ? "p-2 gap-3 w-full" :"justify-center p-1 mt-1 " 
            } ${
              location.pathname.includes("/admin/bookings")
                ? "menu-bg text-white  rounded-md"
                : "text-gray-400"
            }`}
            to="bookings"
          >
            <icons.booking />
            {toggleMenu ? "Bookings" : ""}
          </Link>
        </li>
        <li className="">
          <Link
            className={`transition-all duration-300 delay-100 flex items-center text-xs xl:text-2xl gap-3 ${
              toggleMenu ? "p-2 gap-3 w-full" :"justify-center p-1 mt-1 " 
            } ${
              location.pathname.includes("/admin/renterhistory")
                ? "menu-bg text-white  rounded-md"
                : "text-gray-400"
            }`}
            to="/admin/renterhistory"
          >
            <icons.person />
            {toggleMenu ? "Renter History" : ""}
          </Link>
        </li>
        <li className="">
          <Link
            to="/admin/vehicles/"
            className={`transition-all duration-300 delay-100  flex items-center text-xs xl:text-2xl gap-3 w-full ${
              toggleMenu ? "p-2 gap-3 w-full" :"justify-center p-1 mt-1 " 
            } ${
              location.pathname.includes("/admin/vehicles")
                ? "menu-bg text-white  rounded-md"
                : "text-gray-400"
            }`}
          >
            <icons.vehicle />
            {toggleMenu ? "Vehicles" : ""}
          </Link>
        </li>
        <li className="">
          <Link
            to="/admin/maintenance"
            className={`transition-all duration-300 delay-100 cursor-pointer flex items-center text-xs xl:text-2xl gap-3 w-full ${
              toggleMenu ? "p-2 gap-3 w-full" :"justify-center p-1 mt-1 " 
            } ${
              location.pathname.includes("/admin/maintenance")
                ? "menu-bg text-white  rounded-md"
                : "text-gray-400"
            }`}
          >
            <icons.onMaintenance />
            {toggleMenu ? "Maintenance" : ""}
          </Link>
        </li>
        <button
          className={`cursor-pointer absolute  text-violet-500 text-3xl ${toggleMenu ? "-right-4" : "-right-2"}`}
          onClick={() => setIsToggleMenu((prev) => !prev)}
        >
          {toggleMenu ? <icons.toggleLeft /> : <icons.toggleRight />}
        </button>
      </ul>
    </div>
  );
};

export default SideBar;
