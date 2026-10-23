/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../../utils/supabase";
import icons from "../../../constants/icon";
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
  peso,
  type Accent,
  type RecentItem,
} from "./Posshared";
import type { LaundryMachineData } from "../../laundry/components/MachineForm";
import type { LaundryServiceData } from "../../laundry/components/ServiceForm";
import ServiceBookingForm from "../../laundry/components/ServiceBookingForm";
import CustomerForm from "../../laundry/components/CustomerForm";
import { prefetchLaundryLookups } from "../../../utils/lookupCache";

const MACHINE_STATUSES = ["Available", "On Reservation", "On Service", "On Maintenance"];

interface Props {
  search: string;
  accent: Accent;
  onBooked: () => void;
  today: { count: number; sales: number };
  allSales: number;
}

const PosLaundryPanel = ({ search, accent, onBooked, today, allSales }: Props) => {
  const [machines, setMachines] = useState<LaundryMachineData[]>([]);
  const [services, setServices] = useState<LaundryServiceData[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");

  const [bookingMachine, setBookingMachine] = useState<LaundryMachineData | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const fetchAll = useCallback(async () => {
    const [mach, svc, rec] = await Promise.all([
      supabase
        .from("laundry_machines")
        .select("*")
        .order("machine_name", { ascending: true }),
      supabase
        .from("laundry_service")
        .select("id, created_at, service_name, service_image, price")
        .order("service_name", { ascending: true }),
      supabase
        .from("laundry_booking")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    const failed = [mach, svc, rec].find((r) => r.error);
    if (failed?.error) {
      console.error("POS laundry error:", failed.error);
      toast.error(`Error loading laundry: ${failed.error.message}`);
      return;
    }
    setMachines(mach.data || []);
    setServices(svc.data || []);
    setRecent(rec.data || []);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const q = search.toLowerCase();

  const filteredMachines = useMemo(
    () =>
      machines.filter(
        (m) =>
          (m.machine_name || "").toLowerCase().includes(q) &&
          (statusFilter === "All" || (m.status || "Available") === statusFilter),
      ),
    [machines, q, statusFilter],
  );

  const filteredServices = useMemo(
    () => services.filter((s) => (s.service_name || "").toLowerCase().includes(q)),
    [services, q],
  );

  const availableCount = machines.filter((m) => (m.status || "Available") === "Available").length;

  const recentItems: RecentItem[] = recent.map((b) => ({
    id: b.id,
    title: b.full_name || "Customer",
    subtitle: [b.laundry_service, b.machine_name].filter(Boolean).join(" • "),
    amount: Number(b.price) || 0,
    status: b.status,
    when: b.created_at,
  }));

  return (
    <>
      <PosLayout
        left={
          <div className="flex flex-col gap-8">
            {/* Machines: tap one to book it */}
            <section>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                <SectionTitle
                  title="Machines"
                  subtitle={`${availableCount} of ${machines.length} free right now · tap a machine to book it`}
                />
                <FilterChips
                  options={MACHINE_STATUSES}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  accent={accent}
                />
              </div>

              {filteredMachines.length === 0 ? (
                <EmptyState
                  text={machines.length === 0 ? "No machines yet" : "No machines match"}
                />
              ) : (
                <TileGrid>
                  {filteredMachines.map((machine) => {
                    const down = machine.status === "On Maintenance";

                    return (
                      <Tile
                        key={machine.id}
                        disabled={down}
                        onClick={() => {
                          setBookingMachine(machine);
                          setShowBooking(true);
                        }}
                      >
                        <div className="h-28 bg-slate-50 flex items-center justify-center">
                          <icons.laundry className={`text-5xl ${accent.text} opacity-60`} />
                        </div>
                        <div className="p-3.5">
                          <p className="font-black text-slate-900 leading-tight truncate">
                            {machine.machine_name}
                          </p>
                          <div className="mt-2">
                            <StatusPill status={machine.status || "Available"} />
                          </div>
                        </div>
                        {!down && <AddBadge accent={accent} />}
                      </Tile>
                    );
                  })}
                </TileGrid>
              )}
            </section>

            {/* Price list for reference */}
            <section>
              <SectionTitle
                title="Price list"
                subtitle="Pick the service inside the booking"
              />
              {filteredServices.length === 0 ? (
                <p className="text-sm text-slate-400">No services found.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredServices.map((s) => (
                    <span
                      key={s.id}
                      className="flex items-center gap-2 bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700"
                    >
                      {s.service_name}
                      <span className={accent.text}>{peso(Number(s.price) || 0)}</span>
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        }
        right={
          <ReceiptPanel
            title="Laundry"
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

      {/* Booking form: the machine is already picked, choose the service inside */}
      <ServiceBookingForm
        open={showBooking}
        mode="create"
        machine={bookingMachine}
        onClose={() => {
          setShowBooking(false);
          setBookingMachine(null);
        }}
        onSuccess={() => {
          fetchAll();
          onBooked();
        }}
      />

      <CustomerForm
        open={showCustomerForm}
        mode="create"
        selectedData={null}
        onClose={() => setShowCustomerForm(false)}
        onSuccess={() => {
          toast.success("Customer registered");
          prefetchLaundryLookups();
        }}
      />
    </>
  );
};

export default PosLaundryPanel;