import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SearchBar from "../components/SearchBar";
import { useAuthStore } from "../store/useAuthStore.ts";
import { supabase } from "../utils/supabase";
import icons from "../constants/icon.ts";

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
}

const Header = () => {
  const [query, setQuery] = useState("");
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "reminders">("messages");
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookingReminders, setBookingReminders] = useState<BookingReminder[]>([]);

  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);
  const userEmail = useAuthStore((state) => state.getDisplayName());

  // --- 1. Data Fetching ---
  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notification")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  const fetchReminders = async () => {
  // 1. Get Tomorrow's Date
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isoToday = today.toISOString().split('T')[0];
  const isoTomorrow = tomorrow.toISOString().split('T')[0];

  // 2. Query only for bookings starting EXACTLY tomorrow
  const { data } = await supabase
    .from("renter_booking")
    .select("id, full_name, car_plate_number, start_date")
    .or(`start_date.eq.${isoToday},start_date.eq.${isoTomorrow}`)
    .eq("status", "on reservation")
    .order("start_date", { ascending: true });
  if (data) setBookingReminders(data);
};
  // FIXED: Improved Mark As Read Logic
  const markAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    // Update local state immediately for a fast UI feel
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    // Update database
    const { error } = await supabase
      .from("notification")
      .update({ is_read: true })
      .in("id", unreadIds);
    
    if (error) console.error("Error marking read:", error);
  };

 const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (notifications.length === 0) return;

    // 1. Get all IDs currently in the state to ensure we target them
    const idsToDelete = notifications.map(n => n.id);

    // 2. Perform the delete in Supabase
    const { error } = await supabase
      .from("notification")
      .delete()
      .in("id", idsToDelete);

    if (!error) {
      setNotifications([]);
      toast.success("All messages cleared");
    } else {
      console.error("Delete Error:", error);
      toast.error("Failed to clear messages. Check database permissions.");
    }
  };

  const handleNotificationClick = (n: Notification) => {
    setOpenNotif(false); 
    if (n.type_text === 'new_booking') {
      navigate("/historyofrent");
    } else {
      navigate("/renterprofile");
    }
  };

  // --- 2. Realtime & Initialization ---
  useEffect(() => {
    fetchNotifications();
    fetchReminders();

    const channel = supabase
      .channel("header-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notification" }, 
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
          toast.info((payload.new as Notification).message_text);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const close = () => { setOpenNotif(false); setOpenUserMenu(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // Badge count calculation
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-20 px-6 lg:px-12 flex justify-between items-center w-full bg-white border-b border-slate-200 ">
      
      {/* Left: Brand */}
      <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigate("/dashboard")}>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
          <icons.car className="text-white text-xl" />
        </div>
        <p className="text-2xl font-black text-slate-800 tracking-tight hidden sm:block">Mboss</p>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <SearchBar 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Search system..." 
          className="bg-slate-50 border-slate-200"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => { 
              if (!openNotif) markAsRead(); // Mark read exactly when opening
              setOpenNotif(!openNotif); 
              setOpenUserMenu(false); 
            }}
            className={`p-2.5 rounded-xl relative transition-all cursor-pointer ${openNotif ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
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
              {/* Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
                <button 
                  onClick={() => setActiveTab("messages")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'messages' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Messages
                </button>
                <button 
                  onClick={() => setActiveTab("reminders")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'reminders' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Reminders ({bookingReminders.length})
                </button>
              </div>

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                {activeTab === "messages" ? (
                  <>
                    <div className="p-3 flex justify-between items-center border-b border-slate-50">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">System Logs</span>
                      <button onClick={handleClearAll} className="text-[9px] font-bold text-red-500 uppercase hover:underline cursor-pointer">Clear All</button>
                    </div>
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} onClick={() => handleNotificationClick(n)} className="p-4 border-b border-slate-50 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                         <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${n.type_text === 'new_booking' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                            {n.type_text === 'new_booking' ? <icons.rent size={16}/> : <icons.person size={16}/>}
                         </div>
                         <div className="flex-1 text-left">
                            <p className={`text-sm leading-tight ${!n.is_read ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>{n.message_text}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.created_at).toLocaleTimeString()}</span>
                         </div>
                      </div>
                    )) : <div className="p-10 text-center text-slate-300 text-xs font-bold uppercase">No Messages</div>}
                  </>
                ) : (
                  <>
                    <div className="p-3 border-b border-slate-50 bg-amber-50/30">
                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Upcoming Reservations</span>
                    </div>
                    {bookingReminders.length > 0 ? bookingReminders.map((r) => (
                      <div key={r.id} onClick={() => { navigate("/historyofrent"); setOpenNotif(false); }} className="p-4 border-b border-slate-50 flex gap-3 cursor-pointer hover:bg-amber-50/30 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <icons.calendar size={16}/>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm leading-tight text-slate-700 font-bold">{r.full_name}</p>
                          <p className="text-[11px] text-slate-500">Plate: {r.car_plate_number}</p>
                          <span className="text-[10px] text-amber-600 font-bold mt-1 block uppercase tracking-tighter">Starts: {r.start_date}</span>
                        </div>
                      </div>
                    )) : <div className="p-10 text-center text-slate-300 text-xs font-bold uppercase">No Upcoming Bookings</div>}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <div onClick={() => { setOpenUserMenu(!openUserMenu); setOpenNotif(false); }} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold cursor-pointer border-2 border-white shadow-sm">
            {userEmail?.charAt(0).toUpperCase()}
          </div>
          {openUserMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-1001">
              <button onClick={async () => { await signOut(); navigate("/login"); }} className="w-full text-left py-3 px-4 text-red-500 hover:bg-red-50 font-bold text-sm flex items-center gap-3 transition-colors">
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