/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  EmptyState,
  RecentList,
  SectionTitle,
  StatusPill,
  peso,
  type Accent,
  type RecentItem,
} from "./Posshared";
import type { LaundryServiceData } from "../../laundry/components/ServiceForm";
import type { LaundryMachineData } from "../../laundry/components/MachineForm";
import { supabaseLaundry as supabase } from "../../../utils/supabase";
import icons from "../../../constants/icon";
import ServiceBookingForm from "../../laundry/components/ServiceBookingForm";
import CustomerForm from "../../laundry/components/CustomerForm";

interface Props {
  search: string;
  accent: Accent;
  onBooked: () => void;
}

const PosLaundryPanel = ({ search, accent, onBooked }: Props) => {
  const [services, setServices] = useState<LaundryServiceData[]>([]);
  const [machines, setMachines] = useState<LaundryMachineData[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  // Add flow: pick a service, then a machine, then the booking form
  const [pickService, setPickService] = useState<LaundryServiceData | null>(null);
  const [bookingService, setBookingService] = useState<LaundryServiceData | null>(null);
  const [bookingMachine, setBookingMachine] = useState<LaundryMachineData | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const fetchAll = useCallback(async () => {
    const [svc, mach, rec] = await Promise.all([
      supabase
        .from("laundry_service")
        .select("id, created_at, service_name, service_image, price")
        .order("service_name", { ascending: true }),
      supabase
        .from("laundry_machines")
        .select("*")
        .order("machine_name", { ascending: true }),
      supabase
        .from("laundry_booking")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const failed = [svc, mach, rec].find((r) => r.error);
    if (failed?.error) {
      console.error("POS laundry error:", failed.error);
      toast.error(`Error loading laundry: ${failed.error.message}`);
      return;
    }
    setServices(svc.data || []);
    setMachines(mach.data || []);
    setRecent(rec.data || []);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return services.filter((s) => (s.service_name || "").toLowerCase().includes(q));
  }, [services, search]);

  const availableMachines = machines.filter((m) => m.status === "Available").length;

  const recentItems: RecentItem[] = recent.map((b) => ({
    id: b.id,
    title: b.full_name || "Customer",
    subtitle: [b.laundry_service, b.machine_name].filter(Boolean).join(" • "),
    amount: Number(b.price) || 0,
    status: b.status,
    when: b.created_at,
  }));

  const chooseMachine = (machine: LaundryMachineData) => {
    setBookingService(pickService);
    setBookingMachine(machine);
    setPickService(null);
    setShowBooking(true);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Catalog */}
      <section>
        <SectionTitle
          title="Services"
          subtitle={`${availableMachines} of ${machines.length} machines available right now`}
          right={
            <button
              onClick={() => setShowCustomerForm(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${accent.button}`}
            >
              <icons.add size={14} /> New Customer
            </button>
          }
        />

        {filtered.length === 0 ? (
          <EmptyState
            text={services.length === 0 ? "No services yet" : "No services match your search"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {filtered.map((service) => (
              <div
                key={service.id}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="h-36 bg-slate-50 flex items-center justify-center">
                  {service.service_image ? (
                    <img
                      src={service.service_image}
                      alt={service.service_name || "service"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <icons.laundry className="text-5xl text-slate-300" />
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-slate-900 leading-tight truncate">
                    {service.service_name}
                  </h3>
                  <p className={`text-xl font-black mt-1 ${accent.text}`}>
                    {peso(Number(service.price) || 0)}
                  </p>

                  <button
                    onClick={() => setPickService(service)}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${accent.button}`}
                  >
                    <icons.add size={14} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <SectionTitle title="Recent Bookings" subtitle="Latest laundry bookings" />
        <RecentList items={recentItems} accent={accent} emptyText="No bookings yet" />
      </section>

      {/* Machine picker */}
      {pickService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1300 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Choose a machine</h3>
                <p className="text-xs text-slate-400">
                  For {pickService.service_name} · {peso(Number(pickService.price) || 0)}
                </p>
              </div>
              <button
                onClick={() => setPickService(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <icons.closeModal size={22} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-2">
              {machines.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Add a machine first on the Machines & Services page.
                </p>
              ) : (
                machines.map((machine) => {
                  const down = machine.status === "On Maintenance";
                  return (
                    <button
                      key={machine.id}
                      disabled={down}
                      onClick={() => chooseMachine(machine)}
                      className={`flex items-center justify-between gap-3 p-4 rounded-xl border text-left transition-all ${
                        down
                          ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                          : "bg-white border-slate-200 hover:border-slate-400 hover:shadow-md cursor-pointer"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`p-2.5 rounded-lg ${accent.soft}`}>
                          <icons.laundry className="text-lg" />
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {machine.machine_name}
                        </span>
                      </span>
                      <StatusPill status={machine.status || "Available"} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking form: machine and service are already picked */}
      <ServiceBookingForm
        open={showBooking}
        mode="create"
        machine={bookingMachine}
        presetServiceId={bookingService?.id ?? null}
        onClose={() => {
          setShowBooking(false);
          setBookingMachine(null);
          setBookingService(null);
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
        onSuccess={() => toast.success("Customer registered")}
      />
    </div>
  );
};

export default PosLaundryPanel;