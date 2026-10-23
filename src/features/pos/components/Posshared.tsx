import React from "react";
import icons from "../../../constants/icon";

export const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString()}`;

// Tailwind needs full class names, so each business carries its own set
export interface Accent {
  button: string; // main action button
  soft: string; // soft badge / icon background
  text: string; // accent text colour
  chipActive: string; // selected filter chip
  tab: string; // selected business button
  bar: string; // solid colour (receipt header, progress)
}

const STATUS_STYLES: Record<string, string> = {
  Available: "bg-green-100 text-green-700 border-green-200",
  Scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  "On Reservation": "bg-blue-100 text-blue-700 border-blue-200",
  "On Delivery": "bg-amber-100 text-amber-700 border-amber-200",
  "On Service": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "On Maintenance": "bg-red-100 text-red-700 border-red-200",
  // Expired: "bg-red-100 text-red-700 border-red-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export const StatusPill = ({ status }: { status?: string | null }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
      STATUS_STYLES[status ?? ""] ?? "bg-slate-100 text-slate-600 border-slate-200"
    }`}
  >
    {status || "—"}
  </span>
);

export const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="mb-3">
    <h2 className="text-base font-black text-slate-800 tracking-tight">{title}</h2>
    {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
  </div>
);

export const EmptyState = ({ text }: { text: string }) => (
  <div className="py-14 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
    <icons.search className="text-3xl text-slate-300 mb-3" />
    <p className="text-slate-400 font-medium text-sm">{text}</p>
  </div>
);

export const FilterChips = ({
  options,
  value,
  onChange,
  accent,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  accent: Accent;
}) => (
  <div className="flex flex-wrap gap-2">
    {["All", ...options].map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
          value === opt
            ? accent.chipActive
            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

/* ---------------- Register layout ---------------- */

// Items on the left, receipt on the right (stacked on small screens)
export const PosLayout = ({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) => (
  <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
    <div className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6">{left}</div>
    <aside className="lg:w-[390px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col min-h-0 max-h-[65vh] lg:max-h-none">
      {right}
    </aside>
  </div>
);

export const TileGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
    {children}
  </div>
);

// One big touch target: tap it to start a sale
export const Tile = ({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative text-left bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-150 ${
      disabled
        ? "opacity-50 cursor-not-allowed"
        : "hover:border-slate-300 hover:shadow-lg active:scale-[0.97] cursor-pointer"
    }`}
  >
    {children}
  </button>
);

export const AddBadge = ({ accent }: { accent: Accent }) => (
  <span
    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${accent.button}`}
  >
    <icons.add size={16} />
  </span>
);

/* ---------------- Receipt panel ---------------- */

export interface RecentItem {
  id: string | number;
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  when: string | null; // ISO date
}

const formatWhen = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

export const ReceiptPanel = ({
  title,
  accent,
  items,
  emptyText,
  businessToday,
  allSales,
  actionLabel,
  onAction,
}: {
  title: string;
  accent: Accent;
  items: RecentItem[];
  emptyText: string;
  businessToday: { count: number; sales: number };
  allSales: number;
  actionLabel: string;
  onAction: () => void;
}) => (
  <>
    {/* Header */}
    <div className={`${accent.bar} text-white px-5 py-4 shrink-0`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
        Receipt
      </p>
      <p className="text-lg font-black leading-tight">{title}</p>
      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            Sales today
          </p>
          <p className="text-3xl font-black tabular-nums">{peso(businessToday.sales)}</p>
        </div>
        <p className="text-xs font-bold text-white/80">
          {businessToday.count} transaction{businessToday.count === 1 ? "" : "s"}
        </p>
      </div>
    </div>

    {/* Latest transactions */}
    <div className="flex-1 min-h-0 overflow-y-auto px-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-4 pb-1">
        Latest transactions
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">{emptyText}</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="py-3 border-b border-dashed border-slate-200">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
              </div>
              <p className="text-sm font-black text-slate-800 shrink-0 tabular-nums">
                {peso(item.amount)}
              </p>
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-[10px] text-slate-400">{formatWhen(item.when)}</span>
              <StatusPill status={item.status} />
            </div>
          </div>
        ))
      )}
    </div>

    {/* Totals + main action */}
    <div className="border-t-2 border-dashed border-slate-300 px-5 py-4 bg-slate-50 shrink-0">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{title} today</span>
        <span className="font-black text-slate-800 tabular-nums">
          {peso(businessToday.sales)}
        </span>
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1.5">
        <span>All businesses today</span>
        <span className="font-black text-slate-800 tabular-nums">{peso(allSales)}</span>
      </div>

      <button
        onClick={onAction}
        className={`mt-4 w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${accent.button}`}
      >
        <icons.add size={16} /> {actionLabel}
      </button>
    </div>
  </>
);