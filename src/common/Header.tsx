// import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAuthStore } from "../store/useAuthStore.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import icons from "../constants/icon.ts";

interface PageTypes {
  name: string;
  path: string;
}

const Header = () => {
  const [query, setQuery] = useState("");
  const [filterPage, setFilterPage] = useState<PageTypes[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [open, setOpen] = useState(false);
  const signOut = useAuthStore((state) => state.signOut);
  const getDisplayName = useAuthStore((state) => state.getDisplayName);
  const navigate = useNavigate();
  const userEmail = getDisplayName();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    }
    toast.success("Logout Successfully");
    navigate("/login");
  };

  const navigation_pages = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Maintenance", path: "/maintenance" },
    { name: "Vehicles", path: "/vehiclehistory" },
    { name: "Renter", path: "/renterprofile" },
    { name: "Bookings", path: "/bookings" },
    { name: "Availability", path: "/availability" },
  ];

  useEffect(() => {
    if (query.trim() === "") {
      setFilterPage([]);
      setShowResult(false);
      return;
    }
    const results = navigation_pages.filter((item) =>
      item.name.toLocaleLowerCase().includes(query.toLowerCase())
    );
    setFilterPage(results);
    setShowResult(true);
  }, [query]);

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery("");
    setShowResult(false);
  };

  return (
    <header
      id="app-header "
      className="p-6 gap-3  flex justify-between items-center w-full bg-header border-b  border-[#023a58]  "
    >
      <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold pl-1 lg:pl-6 xl:pl-12 text-center jakarta txt-color">
        Mboss
      </p>
      <div className="relative w-2xl">
        <SearchBar
          onClear={() => setQuery("")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className=" border border-[#253745] pr-2 py-2  rounded  text-gray-400"
          placeholder="search"
        />
        {showResult && filterPage.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-[#0a192f] border border-gray-600 rounded shadow-xl z-50">
            {filterPage.map((result) => (
              <div
                key={result.path}
                onClick={() => handleSelect(result.path)}
                className="p-3 hover:bg-[#112240] cursor-pointer text-gray-200 border-b border-gray-800 last:border-0"
              >
                {result.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="text-white relative cursor-pointer  items-center gap-3 hidden lg:flex"
      >
        {userEmail}
        {open ? <icons.up /> : <icons.down />}
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className="md:hidden flex items-center cursor-pointer text-white text-2xl"
      >
        {open ? <icons.up /> : <icons.down />}
      </div>
      {open && (
        <div className="absolute right-0  md:-right-15 lg:-right-15 xl:right-6 top-16 md:top-18 lg:top-16 z-1000 border border-gray-600 bg-sub rounded">
          <button
            onClick={handleLogout}
            className=" py-2 px-4  text-white rounded cursor-pointer lg:text-md xl:text-base flex items-center gap-3"
          >
            <icons.logOut /> Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
