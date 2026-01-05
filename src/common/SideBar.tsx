import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import useSidebarStore from "../store/useSidebarStore";
import icons from "../constants/icon";

const SideBarData = [
  { label: "Overview", path: "/dashboard", icon: <icons.dashboard /> },
  {
    label: "Availability",
    path: "/availability",
    icon: <icons.availability />,
  },
  { label: "Bookings", path: "/bookings", icon: <icons.booking /> },
  { label: "Renter", path: "/renterhistory", icon: <icons.person /> },
  // { label: "Vehicles", path: "/vehicle", icon: <icons.vehicle /> },
  { label: "Vehicles", path: "/vehiclehistory", icon: <icons.vehicle /> },
  { label: "Maintenance", path: "/maintenance", icon: <icons.onMaintenance /> },
];

const Sidebar = () => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevIsDesktop = useRef<boolean | null>(null);

  const { isSidebarOpen, setSidebarOpen, toggleSidebar } = useSidebarStore();

  /* =============================
     Resize behavior (EXACT match)
  ============================== */

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth > 768;

      // ⛔ Do nothing if breakpoint didn't change
      if (prevIsDesktop.current === isDesktop) return;

      prevIsDesktop.current = isDesktop;
      setSidebarOpen(isDesktop);
    };

    handleResize(); // initial
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  /* =============================
     Click outside (mobile only)
  ============================== */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (window.innerWidth > 768) return;

      const sidebar = sidebarRef.current;
      const header = document.getElementById("app-header");

      if (
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        header &&
        !header.contains(e.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setSidebarOpen]);

  return (
    <>
      {/* Overlay (mobile only) */}
      {isSidebarOpen && <div className="fixed  bg-black/40 z-40 md:hidden" />}

      <aside
        ref={sidebarRef}
        className={`
          bg-sidebar
          min-h-screen
          z-50
          transform transition-transform duration-300 ease-in-out
          fixed md:relative
          top-0 left-0
          border-r border-[#032d44]

          ${
            isSidebarOpen
              ? "-translate-x-[105%] md:translate-x-0 md:w-20"
              : "translate-x-0 w-40 md:w-[300px]"
          }
        `}
      >
        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className={`absolute top-1/2 cursor-pointer ${
            isSidebarOpen ? "-right-9 md:-right-3" : "-right-2 md:-right-2"
          }    bg-[#4E8EA2] text-white rounded-full p-1 z-50`}
        >
          <div className="text-2xl">
            {isSidebarOpen ? <icons.toggleRight /> : <icons.toggleLeft />}
          </div>
        </button>

        {/* Logo */}
        <div className=" h-20 flex items-center justify-center text-white text-3xl">
          {isSidebarOpen ? <icons.car /> : <icons.car />}
        </div>

        {/* Menu */}
        <ul className="flex flex-col gap-2 px-4">
          {SideBarData.map((item) => {
            const active = location.pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth <= 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`
                    flex items-center justify-center gap-3 p-2 rounded-md text-xl
                    transition-all duration-200
                    ${active ? "text-gray-400 bg-body" : " text-white"}
                    ${!isSidebarOpen && "justify-start"}
                  `}
                >
                  {isSidebarOpen ? (
                    <span>{item.icon}</span>
                  ) : (
                    <span className="text-sm md:text-lg">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
