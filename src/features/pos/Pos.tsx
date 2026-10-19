/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import icons from "../../constants/icon";
import { supabase, supabaseLaundry, supabaseWater } from "../../utils/supabase";
import { peso, type Accent } from "../pos/components/Posshared";
import PosRentalPanel from "../pos/components/Posrentalpanel";
import PosLaundryPanel from "../pos/components/Poslaundrypanel";
import PosWaterPanel from "../pos/components/Poswaterpanel";

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
      tab: "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200",
      bar: "bg-blue-500",
    },
  },
  {
    key: "laundry",
    label: "Laundry",
    searchHint: "Search services...",
    icon: icons.laundry,
    accent: {
      button: "bg-violet-600 hover:bg-violet-700 text-white",
      soft: "bg-violet-50 text-violet-700 border-violet-100",
      text: "text-violet-600",
      chipActive: "bg-violet-600 text-white border-violet-600",
      tab: "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200",
      bar: "bg-violet-500",
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
      tab: "bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-200",
      bar: "bg-sky-500",
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
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState(0);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  /* ---------------- Today's numbers across the three businesses ---------------- */
  const fetchStats = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const s = start.toISOString();
    const e = end.toISOString();
    const head = { count: "exact", head: true } as const;

    const results = await Promise.all([
      // Created today
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

      // Active right now
      supabase.from("renter_booking").select("id", head).eq("status", "On Service").is("deleted_at", null),
      supabaseLaundry.from("laundry_booking").select("id", head).eq("status", "On Service"),
      supabaseWater.from("water_order").select("id", head).eq("status", "On Delivery").is("deleted_at", null),

      // Waiting
      supabase.from("renter_booking").select("id", head).eq("status", "On Reservation").is("deleted_at", null),
      supabaseLaundry.from("laundry_booking").select("id", head).eq("status", "On Reservation"),
      supabaseWater.from("water_order").select("id", head).eq("status", "Scheduled").is("deleted_at", null),
    ]);

    const failed = results.find((r) => r.error);
    if (failed?.error) {
      console.error("POS stats error:", failed.error);
      return;
    }

    const [rT, lT, wT, rA, lA, wA, rP, lP, wP] = results;

    setToday({
      rental: { count: rT.data?.length || 0, sales: sum(rT.data, "total_price_rent") },
      laundry: { count: lT.data?.length || 0, sales: sum(lT.data, "price") },
      water: { count: wT.data?.length || 0, sales: sum(wT.data, "total_price") },
    });
    setActive((rA.count || 0) + (lA.count || 0) + (wA.count || 0));
    setPending((rP.count || 0) + (lP.count || 0) + (wP.count || 0));
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 60000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  const totalSales = today.rental.sales + today.laundry.sales + today.water.sales;
  const totalCount = today.rental.count + today.laundry.count + today.water.count;

  const tab = TABS.find((t) => t.key === activeTab)!;

  const switchTab = (key: TabKey) => {
    setActiveTab(key);
    setSearch("");
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 pb-12">
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-4 lg:px-10 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/10">
              <icons.money className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Point of Sale</h1>
              <p className="text-xs text-white/60 font-medium">
                Rentals, laundry and water, all in one place
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-3xl font-black tabular-nums">
              {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
            <p className="text-xs text-white/60 font-medium">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Today's numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="lg:col-span-2 bg-white/10 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
              Today's Sales
            </p>
            <p className="text-4xl font-black mt-1">{peso(totalSales)}</p>

            {/* Split between the three businesses */}
            <div className="flex h-2 rounded-full overflow-hidden bg-white/10 mt-4">
              {TABS.map((t) => (
                <div
                  key={t.key}
                  className={`${t.accent.bar} transition-all duration-500`}
                  style={{
                    width: `${totalSales > 0 ? (today[t.key].sales / totalSales) * 100 : 0}%`,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
              {TABS.map((t) => (
                <div key={t.key} className="flex items-center gap-2 text-[11px] text-white/70">
                  <span className={`w-2 h-2 rounded-full ${t.accent.bar}`} />
                  {t.label}{" "}
                  <span className="font-bold text-white">{peso(today[t.key].sales)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
              Bookings Today
            </p>
            <p className="text-4xl font-black mt-1">{totalCount}</p>
            <p className="text-[11px] text-white/60 mt-3">Across all businesses</p>
          </div>

          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
              Right Now
            </p>
            <div className="flex items-end gap-6 mt-1">
              <div>
                <p className="text-4xl font-black text-amber-300">{active}</p>
                <p className="text-[11px] text-white/60">In progress</p>
              </div>
              <div>
                <p className="text-4xl font-black text-sky-300">{pending}</p>
                <p className="text-[11px] text-white/60">Waiting</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-10 -mt-0 pt-6">
        {/* Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            const Icon = t.icon;

            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex-1 rounded-2xl p-4 text-left border transition-all cursor-pointer ${
                  isActive
                    ? t.accent.tab
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`p-3 rounded-xl ${isActive ? "bg-white/20" : t.accent.soft}`}
                  >
                    <Icon className="text-2xl" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-base leading-tight">{t.label}</p>
                    <p
                      className={`text-xs font-medium mt-0.5 ${
                        isActive ? "text-white/80" : "text-slate-400"
                      }`}
                    >
                      {today[t.key].count} today · {peso(today[t.key].sales)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <icons.search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab.searchHint}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all text-sm shadow-sm"
          />
        </div>

        {/* Selected business */}
        {activeTab === "rental" && (
          <PosRentalPanel search={search} accent={tab.accent} onBooked={fetchStats} />
        )}
        {activeTab === "laundry" && (
          <PosLaundryPanel search={search} accent={tab.accent} onBooked={fetchStats} />
        )}
        {activeTab === "water" && (
          <PosWaterPanel search={search} accent={tab.accent} onBooked={fetchStats} />
        )}
      </div>
    </div>
  );
};

export default POS;