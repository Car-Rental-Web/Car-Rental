/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from "react-hook-form";
import icons from "../constants/icon";
import { MaintenanceFormSchema, type MaintenanceFormData } from "../schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../utils/supabase";
import React from "react";
import { useLoadingStore } from "../store/useLoading";
import type { MaintenanceFormValues } from "../types/types";

interface MaintenanceFormProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  initialData?: MaintenanceFormValues & { id?: number };
}

const MAINTENANCE_OPTIONS = [
  "Change oil",
  "Gear oil",
  "Oil Filter",
  "Air Filter",
  "Break Pods",
];

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  open,
  onClose,
  mode,
  initialData,
}) => {
  const [vehicles, setVehicles] = useState<{ id: string; plate_number: string }[]>([]);
  const { loading, setLoading } = useLoadingStore();
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [otherText, setOtherText] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(MaintenanceFormSchema),
    defaultValues: {
      date: "",
      car: "",
      cost_of_maintenance: "",
      type_of_maintenance: "",
      location: "",
      maintained_by: "",
      status: "On Maintenance",
    },
  });

  const selectedTypes = watch("type_of_maintenance")?.split(", ").filter(Boolean) || [];

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      const types = initialData.type_of_maintenance?.split(", ").filter(Boolean) || [];
      const customValues = types.filter(t => !MAINTENANCE_OPTIONS.includes(t));
      if (customValues.length > 0) {
        setIsOtherSelected(true);
        setOtherText(customValues.join(", "));
      }
    }
  }, [initialData, reset]);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const handleCheckboxChange = (item: string) => {
    let newValues;
    if (selectedTypes.includes(item)) {
      newValues = selectedTypes.filter((t) => t !== item);
    } else {
      newValues = [...selectedTypes, item];
    }
    setValue("type_of_maintenance", newValues.join(", "), { shouldValidate: true });
  };

  const onSubmit = useCallback(
  async (data: MaintenanceFormData) => {
    setLoading(true);
    try {
      const finalType = data.type_of_maintenance;
      // ... (your existing type_of_maintenance string logic)

      const payload = { ...data, type_of_maintenance: finalType };

      if (isCreate) {
        // 1. Insert Maintenance Record
        const { error: mError } = await supabase.from("maintenance").insert(payload);
        if (mError) throw mError;

        // 2. Set vehicle to Maintenance
        const { error: vError } = await supabase
          .from("vehicle")
          .update({ status: "On Maintenance" })
          .eq("plate_number", data.car);
        if (vError) throw vError;

        toast.success("Maintenance started; vehicle status updated.");
      } 
      
      else if (isEdit && initialData?.id) {
        // 1. Update Maintenance Record
        const { error: mError } = await supabase
          .from("maintenance")
          .update(payload)
          .eq("id", initialData.id);
        if (mError) throw mError;

        // 2. Logic to set vehicle back to Available
        // Check if the status in the form is now "Done" or "Completed"
        if (data.status === "Maintained") {
          const { error: vError } = await supabase
            .from("vehicle")
            .update({ status: "Available" })
            .eq("plate_number", data.car);
          if (vError) throw vError;
          toast.success("Maintenance completed; vehicle is now Available.");
        } else {
          toast.success("Maintenance record updated.");
        }
      }

      onClose();
      reset();
    } catch (error: any) {
      toast.error(error.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  },
  [isCreate, isEdit, initialData, onClose, reset, setLoading]
);

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase.from("vehicle").select("id, plate_number");
      if (!error && data) setVehicles(data);
    };
    fetchVehicles();
  }, []);

  if (!open) return null;

  const inputClass = (error?: any) => `w-full mt-1.5 px-4 py-3 bg-gray-50 border ${error ? "border-red-500" : "border-gray-200"} rounded-lg text-gray-800 outline-none transition-all focus:bg-white focus:ring-2 ${error ? "focus:ring-red-500/20" : "focus:ring-blue-500/20 focus:border-blue-500"} disabled:bg-gray-100 disabled:text-gray-500`;
  const labelClass = `text-sm font-semibold text-gray-700 ml-1`;
  const errorMsg = (msg?: string) => msg ? <span className="text-red-500 text-[10px] mt-1 ml-1 font-bold uppercase">{msg}</span> : null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-999 flex justify-center items-center p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{isView ? "Maintenance Details" : isEdit ? "Edit Maintenance" : "New Maintenance Record"}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><icons.closeModal className="text-xl" /></button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col">
            <label className={labelClass}>Maintenance Date</label>
            <input {...register("date")} disabled={isView} className={inputClass(errors.date)} type="date" />
            {errorMsg(errors.date?.message)}
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Registered Vehicle</label>
            <select {...register("car")} disabled={isView} className={inputClass(errors.car)}>
              <option value="">Select Plate Number</option>
              {vehicles.map((v) => <option key={v.id} value={v.plate_number}>{v.plate_number}</option>)}
            </select>
            {errorMsg(errors.car?.message)}
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className={`${labelClass} mb-3`}>Type of Maintenance (Select multiple)</label>
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border ${errors.type_of_maintenance ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
              {MAINTENANCE_OPTIONS.map((item) => (
                <label key={item} className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" disabled={isView} checked={selectedTypes.includes(item)} onChange={() => handleCheckboxChange(item)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-600">{item}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" disabled={isView} checked={isOtherSelected} onChange={(e) => setIsOtherSelected(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm font-bold text-gray-600">Others</span>
              </label>
            </div>
            {isOtherSelected && (
              <input value={otherText} onChange={(e) => setOtherText(e.target.value)} disabled={isView} placeholder="Specify other maintenance..." className={`${inputClass()} mt-3 animate-in fade-in slide-in-from-top-1`} />
            )}
            {errorMsg(errors.type_of_maintenance?.message)}
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Maintenance Cost (₱)</label>
            <input {...register("cost_of_maintenance")} disabled={isView} className={inputClass(errors.cost_of_maintenance)} placeholder="e.g. 5000" />
            {errorMsg(errors.cost_of_maintenance?.message)}
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Service Location</label>
            <input {...register("location")} disabled={isView} className={inputClass(errors.location)} placeholder="Workshop name" />
            {errorMsg(errors.location?.message)}
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className={labelClass}>Technician / Mechanic</label>
            <input {...register("maintained_by")} disabled={isView} className={inputClass(errors.maintained_by)} placeholder="Full Name" />
            {errorMsg(errors.maintained_by?.message)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          {!isView && <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-white">Cancel</button>}
          <button type={isView ? "button" : "submit"} onClick={isView ? onClose : undefined} disabled={loading} className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${isView ? "bg-slate-800" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"}`}>
            {loading ? "Processing..." : isEdit ? "Update Record" : isCreate ? "Submit Record" : "Close Details"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(MaintenanceForm);