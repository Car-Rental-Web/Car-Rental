import { Link } from "react-router-dom";
import icons from "../constants/icon";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { SideBarProps } from "../types/types";


const SideBarData: SideBarProps[] = [
  {
    label: "Overview",
    url: "/dashboard",
    path: "/dashboard",
    iconChildren: <icons.dashboard />,
  },
  {
    label: "Availability",
    url: "/availability",
    path: "/availability",
    iconChildren: <icons.availability />,
  },
  {
    label: "Bookings",
    url: "/bookings",
    path: "/bookings",
    iconChildren: <icons.booking />,
  },
  {
    label: "Renter History",
    url: "/renterhistory",
    path: "/renterhistory",
    iconChildren: <icons.person />,
  },
    {
    label: "Vehicles",
    url: "/vehicle",
    path: "/vehicle",
    iconChildren: <icons.vehicle/>,
  },
  {
    label: "Maintenance",
    url: "/maintenance",
    path: "/maintenance",
    iconChildren: <icons.onMaintenance />,
  },

];

const SideBar = () => {
  const location = useLocation();
  const [toggleMenu, setIsToggleMenu] = useState(false);

  return (
      <div
        className={`bg-sidebar min-h-screen relative flex flex-col   border-r border-[#032d44]  ${
          toggleMenu ? "w-36 xl:min-w-96 " : " w-22"
        }`}
      >
        <div className="w-full  text-center pt-8">
            <button
          className="cursor-pointer    text-[#4E8EA2] text-3xl z-1000"
            onClick={() => setIsToggleMenu((prev) => !prev)}
          >
            {toggleMenu ? <icons.car /> : <icons.car />}
          </button>
        </div>
        <ul
          className={` h-full flex flex-col gap-2 pt-8 w-full  ${
            toggleMenu ? "px-4 " : "px-8"
          }`}
        >
          {SideBarData.map((item, index) => (
            <li key={index}>
              <Link
                to={item.url}
                className={`transition-all duration-300 delay-100 flex items-center  text-xs xl:text-2xl ${
                  toggleMenu ? "p-2 gap-3 w-full" : "justify-center p-1 mt-1 "
                } ${
                  location.pathname.includes(`${item.path}`)
                    ? "bg-body text-white rounded-md "
                    : "text-gray-400"
                }`}
              >
                {item.iconChildren}
                {toggleMenu ? <span>{item.label}</span> : ""}
              </Link>
            </li>
          ))}
        </ul>
        {/* <button
          className={`cursor-pointer absolute  text-[#4E8EA2] text-3xl z-1000 ${
            toggleMenu ? "-right-3 top-20" : "-right-3 top-20"
          }`}
          onClick={() => setIsToggleMenu((prev) => !prev)}
        >
          {toggleMenu ? <icons.toggleLeft /> : <icons.toggleRight />}
        </button> */}
      </div>
  );
};

export default SideBar;
