/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { DataVehicleTypes } from "../../../types/types";
import { supabase } from "../../../utils/supabase";
import icons from "../../../constants/icon";
import { VehicleRenterForm } from "../../../components";
import ProfileForm from "../../../components/ProfileForm";
import {
  EmptyState,
  FilterChips,
  RecentList,
  SectionTitle,
  StatusPill,
  type Accent,
  type RecentItem,
} from "./Posshared";

// Same rule as the vehicle page: registration is valid for one year
const registrationOk = (lastDate: string | null) => {
  if (!lastDate) return { valid: false, text: "Unregistered" };
  const expiry = new Date(lastDate);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return new Date() > expiry
    ? { valid: false, text: "Expired" }
    : { valid: true, text: "Registered" };
};

interface Props {
  search: string;
  accent: Accent;
  onBooked: () => void;
}

const PosRentalPanel = ({ search, accent, onBooked }: Props) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);

  const [showBooking, setShowBooking] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const fetchAll = useCallback(async () => {
    const [veh, rec] = await Promise.all([
      supabase
        .from("vehicle")
        .select("*")
        .is("deleted_at", null)
        .order("brand", { ascending: true }),
      supabase
        .from("renter_booking")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (veh.error || rec.error) {
      const message = (veh.error || rec.error)?.message;
      console.error("POS rental error:", veh.error || rec.error);
      toast.error(`Error loading car rental: ${message}`);
      return;
    }
    setVehicles(veh.data || []);
    setRecent(rec.data || []);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(vehicles.map((v) => v.type).filter((t: string) => Boolean(t))),
      ).sort() as string[],
    [vehicles],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicles.filter((v) => {
      const text = `${v.brand} ${v.model} ${v.plate_number} ${v.type} ${v.color}`.toLowerCase();
      return (
        text.includes(q) &&
        (typeFilter === "All" || v.type === typeFilter) &&
        (!availableOnly || v.status === "Available")
      );
    });
  }, [vehicles, search, typeFilter, availableOnly]);

  const availableCount = vehicles.filter((v) => v.status === "Available").length;

  const recentItems: RecentItem[] = recent.map((b) => ({
    id: b.id,
    title: b.full_name || "Customer",
    subtitle: [b.car_model, b.car_plate_number].filter(Boolean).join(" • "),
    amount: Number(b.total_price_rent) || 0,
    status: b.status,
    when: b.created_at,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Catalog */}
      <section>
        <SectionTitle
          title="Vehicles"
          subtitle={`${availableCount} of ${vehicles.length} available to rent`}
          right={
            <button
              onClick={() => setShowCustomerForm(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${accent.button}`}
            >
              <icons.add size={14} /> New Customer
            </button>
          }
        />

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <FilterChips
            options={typeOptions}
            value={typeFilter}
            onChange={setTypeFilter}
            accent={accent}
          />
          <button
            onClick={() => setAvailableOnly((v) => !v)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              availableOnly
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            Available only
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            text={vehicles.length === 0 ? "No vehicles registered yet" : "No vehicles match your search"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {filtered.map((vehicle) => {
              const reg = registrationOk(vehicle.last_registration_date);
              const blocked = vehicle.status === "On Maintenance" || !reg.valid;

              return (
                <div
                  key={vehicle.id}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-36 bg-slate-50 flex items-center justify-center">
                    {vehicle.car_image ? (
                      <img
                        src={vehicle.car_image}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <icons.car className="text-5xl text-slate-300" />
                    )}
                    <div className="absolute top-3 left-3">
                      <StatusPill status={reg.valid ? vehicle.status : "Expired"} />
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 leading-tight truncate">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-1 uppercase tracking-wider">
                      {vehicle.type} • {vehicle.color}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-mono font-bold rounded">
                      {vehicle.plate_number}
                    </span>
                    {!reg.valid && (
                      <p className="text-[10px] font-bold text-red-600 mt-2">
                        Registration {reg.text.toLowerCase()}
                      </p>
                    )}

                    <button
                      disabled={blocked}
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowBooking(true);
                      }}
                      className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        blocked
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : `${accent.button} cursor-pointer`
                      }`}
                    >
                      <icons.add size={14} />
                      {blocked ? "Unavailable" : "Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <SectionTitle title="Recent Bookings" subtitle="Latest car rentals" />
        <RecentList items={recentItems} accent={accent} emptyText="No bookings yet" />
      </section>

      {/* Modals */}
      {showBooking && (
        <VehicleRenterForm
          selectedData={(selectedVehicle as DataVehicleTypes) || null}
          open={showBooking}
          onClose={() => {
            setShowBooking(false);
            setSelectedVehicle(null);
            fetchAll();
            onBooked();
          }}
        />
      )}

      <ProfileForm
        open={showCustomerForm}
        mode="create"
        selectedData={null}
        onClose={() => setShowCustomerForm(false)}
        onSuccess={() => toast.success("Customer registered")}
      />
    </div>
  );
};

export default PosRentalPanel;