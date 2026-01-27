import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import useSidebarStore from "../store/useSidebarStore";
import icons from "../constants/icon";

const SideBarData = [
  { label: "Overview", path: "/dashboard", icon: <icons.dashboard /> },
  { label: "Availability", path: "/availability", icon: <icons.availability /> },
  { label: "Renter Profile", path: "/renterprofile", icon: <icons.person /> },
  { label: "Rent History", path: "/historyofrent", icon: <icons.history /> },
  { label: "Vehicle", path: "/vehiclehistory", icon: <icons.vehicle /> },
  { label: "Maintenance", path: "/maintenance", icon: <icons.onMaintenance /> },
  { label: "Recycle Bin", path: "/trashfile", icon: <icons.trash /> },
];

const Sidebar = () => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevIsDesktop = useRef<boolean | null>(null);

  const { isSidebarOpen, setSidebarOpen, toggleSidebar } = useSidebarStore();

  /* =============================
      Resize behavior
  ============================== */
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth > 768;
      if (prevIsDesktop.current === isDesktop) return;
      prevIsDesktop.current = isDesktop;
      setSidebarOpen(isDesktop);
    };

    handleResize();
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
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity" />
      )}

      <aside
        ref={sidebarRef}
        className={`
          bg-white
          h-screen
          z-50
          transform transition-transform duration-300 ease-in-out
          fixed md:relative
          top-0 left-0
          border-r border-slate-200
          shadow-xl md:shadow-none
          ${isSidebarOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"}
        `}
      >
        {/* Toggle button - Redesigned to match the theme */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-24 bg-white border border-slate-200 text-slate-500 rounded-full p-1.5 z-60 shadow-sm hover:text-blue-600 transition-colors hidden md:block"
        >
          <div className="text-lg">
            {isSidebarOpen ? <icons.toggleLeft /> : <icons.toggleRight />}
          </div>
        </button>

        {/* Logo Section */}
        <div className="h-20 flex items-center justify-center px-6 gap-3">
            <div className="min-w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-100">
                <icons.car className="text-white text-lg" />
            </div>
        </div>

        {/* Menu List */}
        <nav className="mt-4 px-3">
          <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3 ${!isSidebarOpen && 'text-center'}`}>
            {isSidebarOpen ? "Main Menu" : "•••"}
          </p>
          
          <ul className="flex flex-col gap-1.5">
            {SideBarData.map((item) => {
              const active = location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth <= 768) setSidebarOpen(false);
                    }}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                      ${active 
                        ? "bg-blue-50 text-blue-600" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
                      ${!isSidebarOpen && "justify-center"}
                    `}
                  >
                    <span className={`text-xl ${active ? "text-blue-600" : "group-hover:scale-110 transition-transform"}`}>
                        {item.icon}
                    </span>
                    
                    {isSidebarOpen && (
                      <span className="text-sm font-bold tracking-wide">
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip for collapsed mode (Optional CSS-only logic) */}
                    {!isSidebarOpen && (
                        <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-70">
                            {item.label}
                        </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Helper (Optional) */}
        {/* {isSidebarOpen && (
            <div className="absolute bottom-8 left-6 right-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Support</p>
                <p className="text-[11px] text-slate-600 font-medium">Need help with MBOSS?</p>
                <button className="text-[11px] text-blue-600 font-bold mt-2 hover:underline">View Docs</button>
            </div>
        )} */}
      </aside>
    </>
  );
};

export default Sidebar;