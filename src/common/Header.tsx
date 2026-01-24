import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SearchBar from "../components/SearchBar";
import { useAuthStore } from "../store/useAuthStore.ts";
import { supabase } from "../utils/supabase";
import icons from "../constants/icon.ts";
import useSidebarStore from "../store/useSidebarStore.ts";
import { formatDate } from "../utils/timeFormatter.ts";

interface PageTypes {
  name: string;
  path: string;
}
interface Notification {
  id: string;
  message_text: string;
  type_text: string;
  created_at: string;
  is_read: boolean;
}
interface BookingReminder {
  id: string;
  full_name: string;
  car_plate_number: string;
  start_date: string;
  status: string;
}

const navigation_pages = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Maintenance", path: "/maintenance" },
  { name: "Vehicles", path: "/vehiclehistory" },
  { name: "Renter", path: "/renterprofile" },
  { name: "Bookings", path: "/bookings" },
  { name: "Availability", path: "/availability" },
];

const Header = () => {
  const [query, setQuery] = useState("");
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "reminders">(
    "messages",
  );
  const [showResult, setShowResult] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookingReminders, setBookingReminders] = useState<BookingReminder[]>(
    [],
  );
  // State to track locally cleared reminders
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  const [filterPage, setFilterPage] = useState<PageTypes[]>([]);

  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);
  const userEmail = useAuthStore((state) => state.getDisplayName());
  const { isSidebarOpen, toggleSidebar } = useSidebarStore();

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notification")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  const fetchReminders = async () => {
    const date = new Date();
    // Add 1 day
    date.setDate(date.getDate() + 1);

    // Safely format to YYYY-MM-DD using local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const localTomorrow = `${year}-${month}-${day}`;

    console.log("Checking reminders for local date:", localTomorrow);

    const { data } = await supabase
      .from("renter_booking")
      .select("id, full_name, car_plate_number, start_date, status")
      .eq("start_date", localTomorrow)
      .eq("status", "On Reservation") // Disappears automatically when status changes
      .order("start_date", { ascending: true });

    if (data) setBookingReminders(data);
  };

  const markAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notification")
      .update({ is_read: true })
      .in("id", unreadIds);
  };

  const handleClearAllMessages = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notifications.length === 0) return;
    const idsToDelete = notifications.map((n) => n.id);
    const { error } = await supabase
      .from("notification")
      .delete()
      .in("id", idsToDelete);
    if (!error) {
      setNotifications([]);
      toast.success("Messages cleared");
    }
  };

  // Local Clear for Reminders
  const handleClearReminders = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = bookingReminders.map((r) => r.id);
    setDismissedReminders((prev) => [...prev, ...ids]);
    toast.success("Reminders cleared");
  };

  useEffect(() => {
    fetchNotifications();
    fetchReminders();

    // Helper to play notification sound
    const playSound = () => {
      new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
      )
        .play()
        .catch((err) => console.log("Audio play blocked by browser:", err));
    };

    const channel = supabase
      .channel("header-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          playSound(); // Play sound for new message
          toast.info((payload.new as Notification).message_text);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "renter_booking" },
        (payload) => {
          const booking = payload.new as BookingReminder;
          const isReserved = booking.status === "On Reservation";

          // Get Local Tomorrow string (YYYY-MM-DD)
          const date = new Date();
          date.setDate(date.getDate() + 1);
          const localTomorrow = date.toLocaleDateString("en-CA"); // "en-CA" gives YYYY-MM-DD

          if (isReserved && booking.start_date === localTomorrow) {
            // If it's for tomorrow, refresh the list and notify
            fetchReminders();
            playSound();
            toast.warning(
              `New Reminder: ${booking.full_name}'s reservation is tomorrow!`,
              {
                toastId: booking.id,
              },
            );
          } else if (booking.status === "On Service") {
            // If it's now On Service, remove it from the list
            setBookingReminders((prev) =>
              prev.filter((r) => r.id !== booking.id),
            );
          } else if (booking.status === "Completed") {
            fetchNotifications();
            fetchReminders()
          } else {
            fetchNotifications();
            fetchReminders();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const close = () => {
      setOpenNotif(false);
      setOpenUserMenu(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (query.trim() === "") {
      setFilterPage([]);
      setShowResult(false);
      return;
    }
    const results = navigation_pages.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase()),
    );
    setFilterPage(results);
    setShowResult(true);
  }, [query]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  // Filter out reminders that were locally dismissed
  const visibleReminders = bookingReminders.filter(
    (r) => !dismissedReminders.includes(r.id),
  );

  return (
    <header className="h-20 px-6 lg:px-12 flex justify-between items-center w-full bg-white border-b border-slate-200">
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          className="p-2 mr-1 text-slate-600 hover:bg-slate-50 rounded-lg md:hidden z-1200"
        >
          {isSidebarOpen ? (
            <icons.closeModal size={24} className="text-blue-600" />
          ) : (
            <icons.menu size={24} />
          )}
        </button>
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <p className="text-2xl font-black text-slate-800 tracking-tight hidden sm:block">
            Mboss
          </p>
        </div>
      </div>

      <div
        className="flex-1 max-w-md mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <SearchBar
          onClear={() => setQuery("")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all py-2.5"
          placeholder="Search pages..."
        />
        {showResult && filterPage.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {filterPage.map((result) => (
              <div
                key={result.path}
                onClick={() => {
                  navigate(result.path);
                  setQuery("");
                  setShowResult(false);
                }}
                className="p-4 hover:bg-blue-50 cursor-pointer text-slate-600 font-bold text-sm flex justify-between items-center group"
              >
                {result.name}{" "}
                <icons.rightArrow
                  size={14}
                  className="opacity-0 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              if (!openNotif) markAsRead();
              setOpenNotif(!openNotif);
              setOpenUserMenu(false);
            }}
            className={`p-2.5 rounded-xl relative ${openNotif ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <icons.bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {openNotif && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-1001 overflow-hidden flex flex-col">
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
                <button
                  onClick={() => setActiveTab("messages")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl ${activeTab === "messages" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
                >
                  Messages
                </button>
                <button
                  onClick={() => setActiveTab("reminders")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl ${activeTab === "reminders" ? "bg-white text-amber-600 shadow-sm" : "text-slate-400"}`}
                >
                  Reminders ({visibleReminders.length})
                </button>
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {activeTab === "messages" ? (
                  <>
                    <div className="p-3 flex justify-between items-center border-b">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        System Logs
                      </span>
                      <button
                        onClick={handleClearAllMessages}
                        className="text-[9px] font-bold text-red-500 uppercase hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setOpenNotif(false);
                            navigate(
                              n.type_text === "new_booking"
                                ? "/historyofrent"
                                : n.type_text === "status_update"
                                  ? "/historyofrent"
                                  : "renterprofile",
                            );
                          }}
                          className="p-4 border-b flex gap-3 hover:bg-slate-50 cursor-pointer"
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${n.type_text === "new_booking" ? "bg-blue-200 text-blue-500" : "bg-green-500 text-amber-50"}`}
                          >
                            {n.type_text === "new_booking" ? (
                              <icons.rent size={16} />
                            ) : (
                              <icons.person size={16} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-sm leading-tight ${!n.is_read ? "text-slate-900 font-bold" : "text-slate-600"}`}
                            >
                              {n.message_text}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center text-slate-300 text-xs font-bold">
                        No Messages
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-3 flex justify-between items-center border-b bg-amber-50/30">
                      <span className="text-[9px] font-bold text-amber-600 uppercase">
                        Upcoming Reservations
                      </span>
                      <button
                        onClick={handleClearReminders}
                        className="text-[9px] font-bold text-red-500 uppercase hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    {visibleReminders.length > 0 ? (
                      visibleReminders.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            navigate("/historyofrent");
                            setOpenNotif(false);
                          }}
                          className="p-4 border-b flex gap-3 hover:bg-amber-50/30 cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <icons.calendar size={16} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-slate-700">
                              {r.full_name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Plate: {r.car_plate_number}
                            </p>
                            <span className="text-[10px] text-amber-600 font-bold mt-1 block uppercase">
                              Starts: {formatDate(r.start_date)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center text-slate-300 text-xs font-bold">
                        No Upcoming Bookings
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <div
            onClick={() => {
              setOpenUserMenu(!openUserMenu);
              setOpenNotif(false);
            }}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold cursor-pointer border-2 border-white"
          >
            {userEmail?.charAt(0).toUpperCase()}
          </div>
          {openUserMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white border rounded-2xl shadow-2xl py-2 z-1001">
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/login");
                }}
                className="w-full text-left py-3 px-4 text-red-500 hover:bg-red-50 font-bold text-sm flex items-center gap-3"
              >
                <icons.logOut size={18} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
