/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../utils/supabase";
import icons from "../../constants/icon";
import { DeleteModal } from "../../modals";
import ServiceForm, { type LaundryServiceData } from "../laundry/components/ServiceForm";
import MachineForm, { type LaundryMachineData } from "../laundry/components/MachineForm";
import ServiceBookingForm from "../laundry/components/ServiceBookingForm";
import { ACTIVE_BOOKING_STATUSES } from "../../utils/laundry/syncMachineStatus";

export const MACHINE_STATUSES = [
  "Available",
  "On Reservation",
  "On Service",
  "On Maintenance",
];

type DeleteTarget =
  | { type: "service"; data: LaundryServiceData }
  | { type: "machine"; data: LaundryMachineData };

const badgeClass = (status: string | null) =>
  status === "Available"
    ? "bg-green-500 text-white border-green-600"
    : status === "On Reservation"
      ? "bg-blue-50 text-blue-600 border-blue-100"
      : status === "On Service"
        ? "bg-amber-500 text-white border-amber-600"
        : status === "On Maintenance"
          ? "bg-red-500 text-white border-red-600"
          : "bg-gray-50 text-gray-600 border-gray-200";

const borderClass = (status: string | null) =>
  status === "Available"
    ? "border-green-500"
    : status === "On Reservation"
      ? "border-blue-500"
      : status === "On Service"
        ? "border-amber-500"
        : status === "On Maintenance"
          ? "border-red-500"
          : "border-gray-100";

const LaundryServices = () => {
  const [machines, setMachines] = useState<LaundryMachineData[]>([]);
  const [services, setServices] = useState<LaundryServiceData[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Service form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceMode, setServiceMode] = useState<"create" | "edit" | "view">("create");
  const [selectedService, setSelectedService] = useState<LaundryServiceData | null>(null);

  // Machine form
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [machineMode, setMachineMode] = useState<"create" | "edit">("create");
  const [selectedMachine, setSelectedMachine] = useState<LaundryMachineData | null>(null);

  // Booking form (always for a machine)
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingMachine, setBookingMachine] = useState<LaundryMachineData | null>(null);

  const [openAction, setOpenAction] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  /* ---------------- Fetching ---------------- */
  const fetchMachines = useCallback(async () => {
    const { data, error } = await supabase
      .from("laundry_machines")
      .select("*")
      .order("machine_name", { ascending: true });

    if (error) {
      console.error("laundry_machines error:", error);
      toast.error(`Error fetching machines: ${error.message}`);
      return;
    }
    setMachines(data || []);
  }, []);

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase
      .from("laundry_service")
      .select("id, created_at, service_name, service_image, price")
      .order("service_name", { ascending: true });

    if (error) {
      console.error("laundry_service error:", error);
      toast.error(`Error fetching services: ${error.message}`);
      return;
    }
    setServices(data || []);
  }, []);

  const refreshAll = useCallback(() => {
    fetchMachines();
    fetchServices();
  }, [fetchMachines, fetchServices]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  /* ---------------- Filtering ---------------- */
  const term = searchTerm.toLowerCase();

  const filteredMachines = useMemo(
    () =>
      machines.filter(
        (m) =>
          (m.machine_name || "").toLowerCase().includes(term) &&
          (statusFilter === "All" || m.status === statusFilter),
      ),
    [machines, term, statusFilter],
  );

  const filteredServices = useMemo(
    () => services.filter((s) => (s.service_name || "").toLowerCase().includes(term)),
    [services, term],
  );

  /* ---------------- Delete ---------------- */
  const askDeleteMachine = async (machine: LaundryMachineData) => {
    setOpenAction(null);

    const { count, error } = await supabase
      .from("laundry_booking")
      .select("id", { count: "exact", head: true })
      .eq("machine_id", machine.id)
      .in("status", ACTIVE_BOOKING_STATUSES);

    if (error) {
      toast.error(`Could not check bookings: ${error.message}`);
      return;
    }
    if ((count ?? 0) > 0) {
      toast.error(
        `"${machine.machine_name}" still has ${count} active booking(s). Complete or delete them first.`,
      );
      return;
    }
    setDeleteTarget({ type: "machine", data: machine });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "service") {
        const service = deleteTarget.data;

        const { error } = await supabase
          .from("laundry_service")
          .delete()
          .eq("id", service.id);
        if (error) throw error;

        if (service.service_image) {
          const path = service.service_image.split("service_image/")[1];
          if (path) await supabase.storage.from("service_image").remove([path]);
        }
        toast.success("Service deleted");
      } else {
        const { error } = await supabase
          .from("laundry_machines")
          .delete()
          .eq("id", deleteTarget.data.id);
        if (error) throw error;
        toast.success("Machine deleted");
      }

      setDeleteTarget(null);
      refreshAll();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="overflow-y-auto h-full bg-gray-50/50 p-4 md:p-8 h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machines & Services</h1>
          <p className="text-gray-500 text-sm">
            Book a machine, and pick the service when you book.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setServiceMode("create");
              setSelectedService(null);
              setShowServiceForm(true);
            }}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 px-5 py-2.5 rounded-xl shadow-sm transition-all text-sm font-semibold cursor-pointer"
          >
            <icons.add className="text-lg" />
            <span>Add Service</span>
          </button>
          <button
            onClick={() => {
              setMachineMode("create");
              setSelectedMachine(null);
              setShowMachineForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all text-sm font-semibold cursor-pointer"
          >
            <icons.add className="text-lg" />
            <span>Add Machine</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <icons.search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search machine or service..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1">
          <icons.filter className="text-gray-400" />
          <select
            className="bg-transparent py-2 outline-none text-sm font-medium text-gray-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Machine Status</option>
            {MACHINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Machines */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
            Machines
          </h2>
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs font-bold text-gray-400">
            {filteredMachines.length} Machine/s
          </span>
        </div>

        {filteredMachines.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <icons.laundry className="text-4xl text-gray-300 mb-4" />
            <p className="text-gray-400 font-medium">
              {machines.length === 0 ? "Add your first machine" : "No machines found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMachines.map((machine) => {
              const underMaintenance = machine.status === "On Maintenance";

              return (
                <div
                  key={machine.id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative ${borderClass(machine.status)}`}
                >
                  {/* Status badge */}
                  <div className="absolute top-5 left-5 z-10">
                    <div
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass(machine.status)}`}
                    >
                      {machine.status || "Available"}
                    </div>
                  </div>

                  {/* Action menu */}
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={() =>
                        setOpenAction(openAction === machine.id ? null : machine.id)
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <icons.action className="text-gray-400 text-xl" />
                    </button>
                    {openAction === machine.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-50">
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setMachineMode("edit");
                            setSelectedMachine(machine);
                            setShowMachineForm(true);
                            setOpenAction(null);
                          }}
                        >
                          <icons.edit className="text-blue-500" /> Rename
                        </button>
                        <button
                          className="w-full flex items-center gap-3 pl-3 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-50 transition-colors cursor-pointer"
                          onClick={() => askDeleteMachine(machine)}
                        >
                          <icons.trash /> Delete Machine
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card content */}
                  <div className="flex items-center gap-4 mt-10">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                      <icons.laundry size={600} className="text-3xl text-gray-300" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">
                        Machine
                      </p>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">
                        {machine.machine_name}
                      </h3>
                    </div>
                  </div>

                  {/* Book button */}
                  <div className="flex gap-2 mt-4">
                    <button
                      disabled={underMaintenance}
                      onClick={() => {
                        setBookingMachine(machine);
                        setShowBookingForm(true);
                      }}
                      title={
                        underMaintenance
                          ? "This machine is under maintenance"
                          : "Book this machine"
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg text-xs font-semibold transition-all ${
                        underMaintenance
                          ? "bg-red-400 cursor-not-allowed"
                          : machine.status === "On Reservation"
                            ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                            : machine.status === "On Service"
                              ? "bg-amber-500 hover:bg-amber-600 cursor-pointer"
                              : "bg-gray-900 hover:bg-black cursor-pointer"
                      }`}
                    >
                      {underMaintenance ? "Under Maintenance" : "Book"}{" "}
                      <icons.rightArrow />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Services (catalog) */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">
            Services
          </h2>
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs font-bold text-gray-400">
            {filteredServices.length} Service/s
          </span>
        </div>

        {filteredServices.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">
              {services.length === 0 ? "Add your first service" : "No services found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative"
              >
                {/* Action menu */}
                <div className="absolute top-4 right-4 z-20">
                  <button
                    onClick={() =>
                      setOpenAction(openAction === service.id ? null : service.id)
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <icons.action className="text-gray-400 text-xl" />
                  </button>
                  {openAction === service.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-50">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setServiceMode("view");
                          setSelectedService(service);
                          setShowServiceForm(true);
                          setOpenAction(null);
                        }}
                      >
                        <icons.openEye className="text-emerald-500" /> View
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setServiceMode("edit");
                          setSelectedService(service);
                          setShowServiceForm(true);
                          setOpenAction(null);
                        }}
                      >
                        <icons.edit className="text-blue-500" /> Edit Service
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setDeleteTarget({ type: "service", data: service });
                          setOpenAction(null);
                        }}
                      >
                        <icons.trash /> Delete Service
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    {service.service_image ? (
                      <img
                        src={service.service_image}
                        alt={service.service_name || "service"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <icons.laundry className="text-3xl text-gray-300" />
                    )}
                  </div>
                  <div className="pr-8">
                    <h3 className="font-bold text-gray-900 leading-tight">
                      {service.service_name}
                    </h3>
                    <p className="text-sm font-black text-emerald-600 mt-1">
                      ₱{(Number(service.price) || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <ServiceForm
        open={showServiceForm}
        mode={serviceMode}
        selectedData={selectedService}
        onClose={() => {
          setShowServiceForm(false);
          setSelectedService(null);
        }}
        onSuccess={refreshAll}
      />
      <MachineForm
        open={showMachineForm}
        mode={machineMode}
        selectedData={selectedMachine}
        machines={machines}
        onClose={() => {
          setShowMachineForm(false);
          setSelectedMachine(null);
        }}
        onSuccess={refreshAll}
      />
      <ServiceBookingForm
        open={showBookingForm}
        machine={bookingMachine}
        onClose={() => {
          setShowBookingForm(false);
          setBookingMachine(null);
        }}
        onSuccess={refreshAll}
      />
      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onClick={handleDelete}
      />
    </div>
  );
};

export default LaundryServices;