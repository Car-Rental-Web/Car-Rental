// import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SearchBar from "../components/SearchBar";
import icons from "../constants/icon";
// import path from "path";

const Header = () => {
  const [query, setQuery] = useState("");
  // const [open, setOpen] = useState(false);
  // const navigate = useNavigate();

  // const pages = [
  //   { name: "Dashboard", path: "/admin/dashboard" },
  //   { name: "Availability", path: "/admin/availability" },
  //   { name: "Bookings", path: "/admin/bookings" },
  //   { name: "Renter History", path: "/admin/renterhistory" },
  //   { name: "Vehicles", path: "/admin/vehicle/availablevehicles" },
  //   { name: "Maintenance", path: "/admin/vehicle/maintenance" },
  // ];

  // const filtered = pages.filter((page) =>
  //   page.name.toLowerCase().includes(query.toLowerCase())
  // );

  return (
    <div className="border border-gray-400 p-6  flex justify-between items-center ">
      <p className="text-3xl font-bold pl-12 text-center jakarta">Car-Rental</p>
        <SearchBar onClear={() => setQuery("")} value={query} onChange={(e) => setQuery(e.target.value)} className="-top-2 border border-gray-400 pr-2 py-2 w-2xl rounded " placeholder="search"/>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-pointer menu-bg rounded-full p-4"
        >
          <icons.notification className="w-7 h-7 text-white " />
        </button>
        <div className="">
          <icons.profile className="w-18 h-18 text-gray-600" />
        </div>
      </div>
    </div>
  );
};

export default Header;
