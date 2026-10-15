/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../utils/supabase";
import icons from "../../constants/icon";
import { DeleteModal } from "../../modals";
import ServiceForm, {
  SERVICE_STATUSES,
  type LaundryServiceData,
} from "../laundry/components/ServiceForm";
import ServiceBookingForm from "../laundry/components/ServiceBookingForm";
import MachineForm, {
  type LaundryMachineData,
} from "../laundry/components/MachineForm";

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
  const [machineFilter, setMachineFilter] = useState("All");

  // Service form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceMode, setServiceMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [selectedService, setSelectedService] =
    useState<LaundryServiceData | null>(null);

  // Machine form
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [machineMode, setMachineMode] = useState<"create" | "edit">("create");
  const [selectedMachine, setSelectedMachine] =
    useState<LaundryMachineData | null>(null);

  // Booking form
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingService, setBookingService] =
    useState<LaundryServiceData | null>(null);

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
      .select("*")
      .order("created_at", { ascending: false });

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

  /* ---------------- Filtering / grouping ---------------- */
  const filteredServices = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return services.filter((s) => {
      const matchesSearch =
        (s.service_name || "").toLowerCase().includes(term) ||
        (s.machine_name || "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      const matchesMachine =
        machineFilter === "All" || s.machine_name === machineFilter;
      return matchesSearch && matchesStatus && matchesMachine;
    });
  }, [services, searchTerm, statusFilter, machineFilter]);

  const groupedServices = useMemo(() => {
    return filteredServices.reduce(
      (groups, service) => {
        const key = service.machine_name || "No machine";
        if (!groups[key]) groups[key] = [];
        groups[key].push(service);
        return groups;
      },
      {} as Record<string, LaundryServiceData[]>,
    );
  }, [filteredServices]);

  const groupNames = Object.keys(groupedServices).sort();

  const servicesUsingMachine = (name: string | null) =>
    services.filter((s) => s.machine_name === name).length;

  /* ---------------- Delete ---------------- */
  const askDeleteMachine = (machine: LaundryMachineData) => {
    const used = servicesUsingMachine(machine.machine_name);
    if (used > 0) {
      toast.error(
        `"${machine.machine_name}" is used by ${used} service(s). Delete or reassign them first.`,
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
      setOpenAction(null);
      refreshAll();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="overflow-y-auto h-full bg-gray-50/50 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laundry Services</h1>
          <p className="text-gray-500 text-sm">
            Manage your machines and the services that run on them.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setMachineMode("create");
              setSelectedMachine(null);
              setShowMachineForm(true);
            }}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 px-5 py-2.5 rounded-xl shadow-sm transition-all text-sm font-semibold cursor-pointer"
          >
            <icons.add className="text-lg" />
            <span>Add Machine</span>
          </button>
          <button
            onClick={() => {
              setServiceMode("create");
              setSelectedService(null);
              setShowServiceForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all text-sm font-semibold cursor-pointer"
          >
            <icons.add className="text-lg" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Machines panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">
            Machines
          </h2>
          <span className="text-xs font-bold text-gray-400">
            {machines.length} Total
          </span>
        </div>

        {machines.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No machines yet. Add one first, then pick it when creating a
            service.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {machines.map((machine) => (
              <div
                key={machine.id}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-4 pr-2 py-1.5"
              >
                <span className="text-sm font-semibold text-gray-800">
                  {machine.machine_name}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  {servicesUsingMachine(machine.machine_name)} service/s
                </span>
                <button
                  onClick={() => {
                    setMachineMode("edit");
                    setSelectedMachine(machine);
                    setShowMachineForm(true);
                  }}
                  className="p-1.5 rounded-full text-blue-500 hover:bg-blue-50 cursor-pointer"
                  title="Edit machine"
                >
                  <icons.edit size={14} />
                </button>
                <button
                  onClick={() => askDeleteMachine(machine)}
                  className="p-1.5 rounded-full text-red-500 hover:bg-red-50 cursor-pointer"
                  title="Delete machine"
                >
                  <icons.trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <icons.search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search service or machine..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1">
          <icons.filter className="text-gray-400" />
          <select
            className="bg-transparent py-2 outline-none text-sm font-medium text-gray-700"
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
          >
            <option value="All">All Machines</option>
            {machines.map((m) => (
              <option key={m.id} value={m.machine_name ?? ""}>
                {m.machine_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1">
          <icons.filter className="text-gray-400" />
          <select
            className="bg-transparent py-2 outline-none text-sm font-medium text-gray-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            {SERVICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Service cards grouped by machine */}
      <div className="space-y-12">
        {groupNames.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <icons.laundry className="text-4xl text-gray-300 mb-4" />
            <p className="text-gray-400 font-medium">No services found</p>
          </div>
        ) : (
          groupNames.map((group) => (
            <div key={group} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                  {group}
                </h2>
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400">
                  {groupedServices[group].length} Service/s
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {groupedServices[group].map((service) => (
                  <div
                    key={service.id}
                    className={`group bg-white border rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative ${borderClass(service.status)}`}
                  >
                    {/* Status badge */}
                    <div className="absolute top-5 left-5 z-10">
                      <div
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass(service.status)}`}
                      >
                        {service.status || "No status"}
                      </div>
                    </div>

                    {/* Action menu */}
                    <div className="absolute top-4 right-4 z-20">
                      <button
                        onClick={() =>
                          setOpenAction(
                            openAction === service.id ? null : service.id,
                          )
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
                            Details
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
                            <icons.edit className="text-blue-500" /> Edit
                            Service
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

                    {/* Card content */}
                    <div className="flex gap-5 mt-10">
                      <div className="w-28 h-28 bg-gray-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                        {service.service_image ? (
                          <img
                            src={service.service_image}
                            alt={service.service_name || "service"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <icons.laundry className="text-3xl text-gray-300" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center py-1 w-full">
                        <h3 className="font-bold text-gray-900 leading-tight">
                          {service.service_name}
                        </h3>
                        <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">
                          Machine
                        </p>
                        <span className="inline-block mt-1 w-fit px-2 py-1 bg-gray-900 text-white text-[10px] font-mono font-bold rounded">
                          {service.machine_name || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Book button */}
                    <div className="flex gap-2 mt-4">
                      <button
                        disabled={service.status === "On Maintenance"}
                        onClick={() => {
                          setBookingService(service);
                          setShowBookingForm(true);
                        }}
                        title={
                          service.status === "On Maintenance"
                            ? "This service is under maintenance"
                            : "Book this service"
                        }
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg text-xs font-semibold transition-all ${
                          service.status === "On Maintenance"
                            ? "bg-red-400 cursor-not-allowed"
                            : service.status === "On Reservation"
                              ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                              : service.status === "On Service"
                                ? "bg-amber-500 hover:bg-amber-600 cursor-pointer"
                                : "bg-gray-900 hover:bg-black cursor-pointer"
                        }`}
                      >
                        {service.status === "On Maintenance"
                          ? "Under Maintenance"
                          : "Book"}{" "}
                        <icons.rightArrow />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <ServiceForm
        open={showServiceForm}
        mode={serviceMode}
        selectedData={selectedService}
        machines={machines}
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
        service={bookingService}
        onClose={() => {
          setShowBookingForm(false);
          setBookingService(null);
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