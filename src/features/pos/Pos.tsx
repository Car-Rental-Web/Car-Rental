/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import icons from "../../constants/icon";
import { supabase, supabaseLaundry, supabaseWater } from "../../utils/supabase";
import { peso, type Accent } from "./components/Posshared";
import PosRentalPanel from "./components/Posrentalpanel";
import PosLaundryPanel from "./components/Poslaundrypanel";
import PosWaterPanel from "./components/Poswaterpanel";
import { prefetchLaundryLookups, prefetchWaterLookups } from "../../utils/lookupCache";
import { useFillViewport } from "../../utils/useFillViewPort";





type TabKey = "rental" | "laundry" | "water";

const TABS: {
  key: TabKey;
  label: string;
  searchHint: string;
  icon: any;
  accent: Accent;
}[] = [
  {
    key: "rental",
    label: "Car Rental",
    searchHint: "Search vehicles, plate number...",
    icon: icons.car,
    accent: {
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      soft: "bg-blue-50 text-blue-700 border-blue-100",
      text: "text-blue-600",
      chipActive: "bg-blue-600 text-white border-blue-600",
      tab: "bg-blue-600 text-white shadow-lg shadow-blue-900/40",
      bar: "bg-blue-600",
    },
  },
  {
    key: "laundry",
    label: "Laundry",
    searchHint: "Search machines or services...",
    icon: icons.laundry,
    accent: {
      button: "bg-violet-600 hover:bg-violet-700 text-white",
      soft: "bg-violet-50 text-violet-700 border-violet-100",
      text: "text-violet-600",
      chipActive: "bg-violet-600 text-white border-violet-600",
      tab: "bg-violet-600 text-white shadow-lg shadow-violet-900/40",
      bar: "bg-violet-600",
    },
  },
  {
    key: "water",
    label: "Water Station",
    searchHint: "Search products...",
    icon: icons.water,
    accent: {
      button: "bg-sky-600 hover:bg-sky-700 text-white",
      soft: "bg-sky-50 text-sky-700 border-sky-100",
      text: "text-sky-600",
      chipActive: "bg-sky-600 text-white border-sky-600",
      tab: "bg-sky-600 text-white shadow-lg shadow-sky-900/40",
      bar: "bg-sky-600",
    },
  },
];

interface Today {
  count: number;
  sales: number;
}

const emptyToday: Today = { count: 0, sales: 0 };

const sum = (rows: any[] | null | undefined, field: string) =>
  (rows || []).reduce((acc, r) => acc + (Number(r[field]) || 0), 0);

const POS = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("rental");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(new Date());
  const [today, setToday] = useState<Record<TabKey, Today>>({
    rental: emptyToday,
    laundry: emptyToday,
    water: emptyToday,
  });
const rootRef = useRef<HTMLDivElement>(null);
const height = useFillViewport(rootRef);

  // Load the customer, product and service lists once, so every form opens ready
  useEffect(() => {
    prefetchWaterLookups();
    prefetchLaundryLookups();
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  /* ---------------- Today's sales across the three businesses ---------------- */
  const fetchStats = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const s = start.toISOString();
    const e = end.toISOString();

    const [rental, laundry, water] = await Promise.all([
      supabase
        .from("renter_booking")
        .select("total_price_rent")
        .is("deleted_at", null)
        .gte("created_at", s)
        .lt("created_at", e),
      supabaseLaundry
        .from("laundry_booking")
        .select("price")
        .gte("created_at", s)
        .lt("created_at", e),
      supabaseWater
        .from("water_order")
        .select("total_price")
        .is("deleted_at", null)
        .neq("status", "Cancelled")
        .gte("created_at", s)
        .lt("created_at", e),
    ]);

    const failed = [rental, laundry, water].find((r) => r.error);
    if (failed?.error) {
      console.error("POS stats error:", failed.error);
      return;
    }

    setToday({
      rental: { count: rental.data?.length || 0, sales: sum(rental.data, "total_price_rent") },
      laundry: { count: laundry.data?.length || 0, sales: sum(laundry.data, "price") },
      water: { count: water.data?.length || 0, sales: sum(water.data, "total_price") },
    });
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 60000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  const allSales = today.rental.sales + today.laundry.sales + today.water.sales;
  const tab = TABS.find((t) => t.key === activeTab)!;

  const switchTab = (key: TabKey) => {
    setActiveTab(key);
    setSearch("");
  };

  const panelProps = {
    search,
    accent: tab.accent,
    onBooked: fetchStats,
    today: today[activeTab],
    allSales,
  };

  return (
    <div
    ref={rootRef}
  style={{ height: height ?? "100vh" }}
    className="w-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Register bar */}
      <header className="bg-slate-900 text-white px-4 lg:px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10">
            <icons.money className="text-2xl" />
          </div>
          <div className="leading-tight">
            <p className="font-black text-lg tracking-tight">POS</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
              Point of Sale
            </p>
          </div>
        </div>

        {/* Business switcher */}
        <div className="flex items-center gap-2 ">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            const Icon = t.icon;

            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isActive ? t.accent.tab : "bg-white/10 hover:bg-white/20 text-white/80"
                }`}
              >
                <Icon className="text-xl shrink-0" />
                <span className="leading-tight">
                  <span className="block text-sm font-black">{t.label}</span>
                  <span
                    className={`block text-[10px] font-semibold ${
                      isActive ? "text-white/80" : "text-white/50"
                    }`}
                  >
                    {today[t.key].count} today
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-xl">
          <icons.search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab.searchHint}
            className="w-full pl-11 pr-4 py-3 bg-white/10 text-white placeholder-white/40 rounded-xl outline-none focus:bg-white/20 transition-all text-sm"
          />
        </div>

        {/* Clock + all-business total */}
        <div className="ml-auto flex items-center gap-6">
          <div className="text-right leading-tight hidden md:block">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
              All sales today
            </p>
            <p className="text-xl font-black tabular-nums">{peso(allSales)}</p>
          </div>
          <div className="text-right leading-tight">
            <p className="text-2xl font-black tabular-nums">
              {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
              {now.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </header>

      {/* Selected business: items on the left, receipt on the right */}
      {activeTab === "rental" && <PosRentalPanel {...panelProps} />}
      {activeTab === "laundry" && <PosLaundryPanel {...panelProps} />}
      {activeTab === "water" && <PosWaterPanel {...panelProps} />}
    </div>
  );
};

export default POS;