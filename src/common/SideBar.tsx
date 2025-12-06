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
        className={` min-h-screen relative ${
          toggleMenu ? "w-36 xl:min-w-96 " : " w-24"
        }`}
      >
        <ul
          className={`border-r-2 border-gray-300 h-full flex flex-col gap-2 pt-8 w-full  ${
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
                    ? "menu-bg text-white rounded-md "
                    : "text-gray-400"
                }`}
              >
                {item.iconChildren}
                {toggleMenu ? <span>{item.label}</span> : ""}
              </Link>
            </li>
          ))}
        </ul>
        <button
          className={`cursor-pointer absolute  text-violet-500 text-3xl ${
            toggleMenu ? "-right-3 top-2" : "-right-3 top-2"
          }`}
          onClick={() => setIsToggleMenu((prev) => !prev)}
        >
          {toggleMenu ? <icons.toggleLeft /> : <icons.toggleRight />}
        </button>
      </div>
  );
};

export default SideBar;
