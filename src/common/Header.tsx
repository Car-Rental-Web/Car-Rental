// import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAuthStore } from "../store/useAuthStore.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
// import path from "path";

const Header = () => {
  const [query, setQuery] = useState("");

  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await logout();
    if(error) {
      toast.error(error.message)
    }
    toast.success('Logout Successfully')
    navigate('/login')
  };

  return (
    <div className=" p-6  flex justify-between items-center w-full bg-header border-b  border-[#023a58]  ">
      <p className="text-xl md:text-4xl font-bold pl-12 text-center jakarta txt-color">
        Emboss
      </p>
      <SearchBar
        onClear={() => setQuery("")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="-top-2 border border-[#253745] pr-2 py-2 w-2xl rounded  text-gray-400"
        placeholder="search"
      />
      <button onClick={handleLogout} className="py-2 px-4 button-color text-white rounded cursor-pointer">Logout</button>
    </div>
  );
};

export default Header;
