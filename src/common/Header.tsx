// import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAuthStore } from "../store/useAuthStore.ts";
import { useNavigate } from "react-router-dom";
import { Icons, toast } from "react-toastify";
import icons from "../constants/icon.ts";

const Header = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false)

  const signOut = useAuthStore((state) => state.signOut);
  const getDisplayName = useAuthStore((state) => state.getDisplayName)
  const navigate = useNavigate();
  const userEmail = getDisplayName();

  const handleLogout = async () => {
    const { error } = await signOut();
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
        <div onClick={() => setOpen(!open)} className="text-white relative cursor-pointer flex items-center gap-3">
            {userEmail}
            {open ? (<icons.up/>) : (<icons.down/>) }
        </div>
        {open && 
        <div className="absolute right-5 top-15 z-1000 border border-gray-600 bg-sub rounded">
          <button onClick={handleLogout} className=" py-2 px-4  text-white rounded cursor-pointer   ">Logout</button>
        </div>
   }
       </div> 
  );
};

export default Header;
