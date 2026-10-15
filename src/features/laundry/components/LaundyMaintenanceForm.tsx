/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../../utils/supabase";
import { syncMachineMaintenance } from "../../../utils/laundry/syncServiceStatus";
import icons from "../../../constants/icon";

// Edit this list to match the work you do on your machines
const MAINTENANCE_OPTIONS = [
  "Cleaning",
  "Lubrication",
  "Belt replacement",
  "Hose replacement",
  "Filter cleaning",
  "Motor repair",
];

// Matches the columns of the `laundry_maintenance` table
export interface LaundryMaintenanceData {
  id: string;
  created_at: string;
  date: string | null;
  machine_name: string | null;
  type_of_maintenance: string | null;
  cost_of_maintenance: string | null;
  location: string | null;
  maintained_by: string | null;
  status: string | null;
  deleted_at: string | null;
}

const MaintenanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  machine_name: z.string().min(1, "Select a machine"),
  type_of_maintenance: z.string().min(1, "Select at least one type"),
  cost_of_maintenance: z
    .string()
    .trim()
    .min(1, "Cost is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Enter a valid amount"),
  location: z.string().trim().min(1, "Location is required"),
  maintained_by: z.string().trim().min(1, "Technician is required"),
});
type MaintenanceValues = z.infer<typeof MaintenanceSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  initialData?: LaundryMaintenanceData | null;
  onSuccess?: () => void;
}

const todayLocal = () => new Date().toLocaleDateString("en-CA");

const LaundryMaintenanceForm: React.FC<Props> = ({
  open,
  onClose,
  mode,
  initialData,
  onSuccess,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [machines, setMachines] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherText, setOtherText] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<MaintenanceValues>({
    resolver: zodResolver(MaintenanceSchema),
  });

  // Checkboxes + "Others" text become one comma-separated value
  const combinedType = useMemo(() => {
    const parts = [...selectedTypes];
    if (otherSelected && otherText.trim()) parts.push(otherText.trim());
    return parts.join(", ");
  }, [selectedTypes, otherSelected, otherText]);

  useEffect(() => {
    setValue("type_of_maintenance", combinedType, {
      shouldValidate: isSubmitted,
      shouldDirty: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedType, setValue]);

  // Reset everything each time the form opens
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        date: initialData.date ?? todayLocal(),
        machine_name: initialData.machine_name ?? "",
        type_of_maintenance: initialData.type_of_maintenance ?? "",
        cost_of_maintenance: initialData.cost_of_maintenance ?? "",
        location: initialData.location ?? "",
        maintained_by: initialData.maintained_by ?? "",
      });

      const parts = (initialData.type_of_maintenance ?? "")
        .split(", ")
        .filter(Boolean);
      const custom = parts.filter((p) => !MAINTENANCE_OPTIONS.includes(p));
      setSelectedTypes(parts.filter((p) => MAINTENANCE_OPTIONS.includes(p)));
      setOtherSelected(custom.length > 0);
      setOtherText(custom.join(", "));
    } else {
      reset({
        date: todayLocal(),
        machine_name: "",
        type_of_maintenance: "",
        cost_of_maintenance: "",
        location: "",
        maintained_by: "",
      });
      setSelectedTypes([]);
      setOtherSelected(false);
      setOtherText("");
    }
  }, [open, initialData, reset]);

  // Machines for the dropdown
  useEffect(() => {
    if (!open) return;

    const fetchMachines = async () => {
      const { data, error } = await supabase
        .from("laundry_machines")
        .select("machine_name")
        .order("machine_name", { ascending: true });

      if (error) {
        console.error("laundry_machines error:", error);
        toast.error(`Error fetching machines: ${error.message}`);
        return;
      }
      setMachines(
        (data || [])
          .map((m) => m.machine_name)
          .filter((n): n is string => Boolean(n)),
      );
    };
    fetchMachines();
  }, [open]);

  // Keep the saved machine selectable even if it was renamed or deleted
  const machineOptions =
    initialData?.machine_name && !machines.includes(initialData.machine_name)
      ? [initialData.machine_name, ...machines]
      : machines;

  const toggleType = (item: string) =>
    setSelectedTypes((prev) =>
      prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item],
    );

  const onSubmit = async (data: MaintenanceValues) => {
    if (isView) return;

    try {
      if (isEdit && initialData) {
        const { error } = await supabase
          .from("laundry_maintenance")
          .update(data)
          .eq("id", initialData.id);
        if (error) throw error;

        // If the machine was changed, free the old one too
        if (
          initialData.machine_name &&
          initialData.machine_name !== data.machine_name
        ) {
          await syncMachineMaintenance(initialData.machine_name);
        }
        await syncMachineMaintenance(data.machine_name);

        toast.success("Maintenance updated!");
      } else {
        const { error } = await supabase
          .from("laundry_maintenance")
          .insert([{ ...data, status: "On Maintenance" }]);
        if (error) throw error;

        // Services on this machine become "On Maintenance"
        await syncMachineMaintenance(data.machine_name);

        toast.success("Maintenance started; services on this machine are now On Maintenance.");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Maintenance submit error:", error);
      toast.error(error.message ?? "Something went wrong");
    }
  };

  if (!open) return null;

  const inputClass = (error?: any) =>
    `w-full mt-1.5 px-4 py-3 bg-gray-50 border ${
      error ? "border-red-500" : "border-gray-200"
    } rounded-lg text-gray-800 outline-none transition-all focus:bg-white focus:ring-2 ${
      error
        ? "focus:ring-red-500/20"
        : "focus:ring-blue-500/20 focus:border-blue-500"
    } disabled:bg-gray-100 disabled:text-gray-500`;
  const labelClass = "text-sm font-semibold text-gray-700 ml-1";
  const errorMsg = (msg?: string) =>
    msg ? (
      <span className="text-red-500 text-[10px] mt-1 ml-1 font-bold uppercase">
        {msg}
      </span>
    ) : null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-999 flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {isView
              ? "Maintenance Details"
              : isEdit
                ? "Edit Maintenance"
                : "New Maintenance Record"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <icons.closeModal className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col">
            <label className={labelClass}>Maintenance Date</label>
            <input
              {...register("date")}
              disabled={isView}
              className={inputClass(errors.date)}
              type="date"
            />
            {errorMsg(errors.date?.message)}
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Machine</label>
            <select
              {...register("machine_name")}
              disabled={isView}
              className={inputClass(errors.machine_name)}
            >
              <option value="">
                {machineOptions.length === 0
                  ? "No machines yet"
                  : "Select a machine"}
              </option>
              {machineOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errorMsg(errors.machine_name?.message)}
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className={`${labelClass} mb-3`}>
              Type of Maintenance (Select multiple)
            </label>
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border ${
                errors.type_of_maintenance
                  ? "bg-red-50 border-red-200"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              {MAINTENANCE_OPTIONS.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    disabled={isView}
                    checked={selectedTypes.includes(item)}
                    onChange={() => toggleType(item)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-600">{item}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isView}
                  checked={otherSelected}
                  onChange={(e) => setOtherSelected(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-bold text-gray-600">Others</span>
              </label>
            </div>
            {otherSelected && (
              <input
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                disabled={isView}
                placeholder="Specify other maintenance..."
                className={`${inputClass(errors.type_of_maintenance)} mt-3`}
              />
            )}
            {errorMsg(errors.type_of_maintenance?.message)}
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Maintenance Cost (₱)</label>
            <input
              {...register("cost_of_maintenance")}
              disabled={isView}
              className={inputClass(errors.cost_of_maintenance)}
              placeholder="e.g. 5000"
            />
            {errorMsg(errors.cost_of_maintenance?.message)}
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Service Location</label>
            <input
              {...register("location")}
              disabled={isView}
              className={inputClass(errors.location)}
              placeholder="Workshop name"
            />
            {errorMsg(errors.location?.message)}
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className={labelClass}>Technician / Mechanic</label>
            <input
              {...register("maintained_by")}
              disabled={isView}
              className={inputClass(errors.maintained_by)}
              placeholder="Full Name"
            />
            {errorMsg(errors.maintained_by?.message)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          {!isView && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-white"
            >
              Cancel
            </button>
          )}
          <button
            type={isView ? "button" : "submit"}
            onClick={isView ? onClose : undefined}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg disabled:opacity-50 ${
              isView
                ? "bg-slate-800"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
            }`}
          >
            {isSubmitting
              ? "Processing..."
              : isView
                ? "Close Details"
                : isEdit
                  ? "Update Record"
                  : "Submit Record"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LaundryMaintenanceForm;