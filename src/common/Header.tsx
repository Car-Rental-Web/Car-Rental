import icons from "../constants/icon";

const Header = () => {
  return (
    <div className="border border-gray-400 p-6  flex justify-between items-center ">
      <p className="text-3xl font-bold pl-12 text-center jakarta">Car-Rental</p>
      <div className="border border-gray-400 rounded-md px-3 py-4 w-2xl relative">
        <input
          type="search"
          className="pl-8 w-full text-xl "
          placeholder="search"
        />
        <icons.search className="absolute top-4 text-3xl text-gray-400" />
      </div>
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
