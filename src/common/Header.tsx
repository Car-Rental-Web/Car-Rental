// import { useNavigate } from "react-router-dom";
import {  useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAuthStore } from "../store/useAuthStore.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
    <header id="app-header " className="p-6 gap-3  flex justify-between items-center w-full bg-header border-b  border-[#023a58]  ">
      <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold pl-1 lg:pl-6 xl:pl-12 text-center jakarta txt-color">
        Emboss
      </p>
      <SearchBar
        onClear={() => setQuery("")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className=" border border-[#253745] pr-2 py-2 w-2xl rounded  text-gray-400"
        placeholder="search"
      />
        <div onClick={(e) =>{ 
          e.stopPropagation();
          setOpen((prev) => !prev)}} className="text-white relative cursor-pointer  items-center gap-3 hidden lg:flex">
            {userEmail}
            {open ? (<icons.up/>) : (<icons.down/>) }
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setOpen((p) => !p)}}
          className="md:hidden flex items-center cursor-pointer text-white text-2xl"
        >
          {open ? (<icons.up/>) : (<icons.down/>) }
        </div>
        {open && 
        <div className="absolute right-0  md:-right-15 lg:-right-15 xl:right-6 top-16 md:top-18 lg:top-16 z-1000 border border-gray-600 bg-sub rounded">
        <button onClick={handleLogout} className=" py-2 px-4  text-white rounded cursor-pointer lg:text-md xl:text-base flex items-center gap-3"><icons.logOut/> Logout</button>
        </div>
   }
       </header> 
  );
};

export default Header;
