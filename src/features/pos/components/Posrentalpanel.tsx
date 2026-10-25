/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { DataVehicleTypes } from "../../../types/types";
import { supabase } from "../../../utils/supabase";
import {
  AddBadge,
  EmptyState,
  FilterChips,
  PosLayout,
  ReceiptPanel,
  SectionTitle,
  StatusPill,
  Tile,
  TileGrid,
  type Accent,
  type RecentItem,
} from "./Posshared";
import icons from "../../../constants/icon";
import VehicleRenterForm from "../../rental/components/VehicleRenterForm";
import ProfileForm from "../../rental/components/ProfileForm";

interface Props {
  search: string;
  accent: Accent;
  onBooked: () => void;
  today: { count: number; sales: number };
  allSales: number;
}

const PosRentalPanel = ({ search, accent, onBooked, today, allSales }: Props) => {
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
        .limit(12),
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
    <>
      <PosLayout
        left={
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <SectionTitle
                title="Vehicles"
                subtitle={`${availableCount} of ${vehicles.length} available · tap a vehicle to rent it`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <FilterChips
                  options={typeOptions}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  accent={accent}
                />
                <button
                  onClick={() => setAvailableOnly((v) => !v)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                    availableOnly
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  Available only
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                text={vehicles.length === 0 ? "No vehicles registered yet" : "No vehicles match"}
              />
            ) : (
              <TileGrid>
                {filtered.map((vehicle) => {
                  const blocked = vehicle.status === "On Maintenance";

                  return (
                    <Tile
                      key={vehicle.id}
                      disabled={blocked}
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowBooking(true);
                      }}
                    >
                      <div className="relative h-28 bg-slate-50 flex items-center justify-center">
                        {vehicle.car_image ? (
                          <img
                            src={vehicle.car_image}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <icons.car className="text-5xl text-slate-300" />
                        )}
                        <div className="absolute bottom-2 left-2">
                          <StatusPill status={vehicle.status} />
                        </div>
                      </div>

                      <div className="p-3.5">
                        <p className="font-black text-slate-900 text-sm leading-tight truncate">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider truncate">
                          {vehicle.type} • {vehicle.color}
                        </p>
                        <span className="inline-block mt-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-mono font-bold rounded">
                          {vehicle.plate_number}
                        </span>
                      </div>

                      {!blocked && <AddBadge accent={accent} />}
                    </Tile>
                  );
                })}
              </TileGrid>
            )}
          </section>
        }
        right={
          <ReceiptPanel
            title="Car Rental"
            accent={accent}
            items={recentItems}
            emptyText="No bookings yet"
            businessToday={today}
            allSales={allSales}
            actionLabel="New Customer"
            onAction={() => setShowCustomerForm(true)}
          />
        }
      />

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
    </>
  );
};

export default PosRentalPanel;