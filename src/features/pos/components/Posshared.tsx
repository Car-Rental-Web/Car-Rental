import React from "react";
import icons from "../../../constants/icon";

export const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString()}`;

// Tailwind needs full class names, so each business carries its own set
export interface Accent {
  button: string; // main action button
  soft: string; // soft badge / icon background
  text: string; // accent text colour
  chipActive: string; // selected filter chip
  tab: string; // selected tab
  bar: string; // chart / progress colour
}

const STATUS_STYLES: Record<string, string> = {
  Available: "bg-green-100 text-green-700 border-green-200",
  Scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  "On Reservation": "bg-blue-100 text-blue-700 border-blue-200",
  "On Delivery": "bg-amber-100 text-amber-700 border-amber-200",
  "On Service": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "On Maintenance": "bg-red-100 text-red-700 border-red-200",
  Expired: "bg-red-100 text-red-700 border-red-200",
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
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) => (
  <div className="flex items-end justify-between gap-4 mb-4">
    <div>
      <h2 className="text-lg font-black text-slate-800 tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
    </div>
    {right}
  </div>
);

export const EmptyState = ({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) => (
  <div className="py-14 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
    <icons.search className="text-3xl text-slate-300 mb-3" />
    <p className="text-slate-400 font-medium text-sm">{text}</p>
    {children}
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
        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
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

/* ---------------- Recent activity ---------------- */

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

export const RecentList = ({
  items,
  accent,
  emptyText,
}: {
  items: RecentItem[];
  accent: Accent;
  emptyText: string;
}) => {
  if (items.length === 0) return <EmptyState text={emptyText} />;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 p-4 hover:bg-slate-50/60 transition-colors"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${accent.soft}`}
          >
            {(item.title || "?").trim().charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{item.title}</p>
            <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
          </div>

          <div className="text-right shrink-0">
            <p className="font-black text-slate-800 text-sm">{peso(item.amount)}</p>
            <p className="text-[10px] text-slate-400">{formatWhen(item.when)}</p>
          </div>

          <div className="hidden sm:block shrink-0 w-28 text-right">
            <StatusPill status={item.status} />
          </div>
        </div>
      ))}
    </div>
  );
};