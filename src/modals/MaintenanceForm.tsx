/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from "react-hook-form";
import icons from "../constants/icon";
import {
  MaintenanceFormSchema,
  type MaintenanceFormData,
} from "../schema/schema";
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

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  open,
  onClose,
  mode,
  initialData,
}) => {
  const [vehicles, setVehicles] = useState<{ id: string; plate_number: string }[]>([]);
  const [selectToggle, setSelectToggle] = useState(false);
  const { loading, setLoading } = useLoadingStore();
  const [vehicleLoaded, setVehicleLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(MaintenanceFormSchema),
    shouldUnregister: false,
    mode: "onSubmit",
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

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, vehicleLoaded, reset]);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const onSubmit = useCallback(
    async (data: MaintenanceFormData) => {
      setLoading(true);
      try {
        if (isCreate) {
          const { error } = await supabase.from("maintenance").insert(data);
          if (error) throw error;
          toast.success("Maintenance added successfully");
        }

        if (isEdit && initialData?.id) {
          const hasChanges = Object.keys(data).some(
            (key) =>
              data[key as keyof typeof data] !==
              initialData[key as keyof typeof initialData]
          );
          if (!hasChanges) {
            toast.info("No changes to update");
            setLoading(false);
            return;
          }
          const { error } = await supabase
            .from("maintenance")
            .update(data)
            .eq("id", initialData.id);

          if (error) throw error;
          toast.success("Maintenance updated successfully");
        }
        onClose();
        reset();
      } catch (error: Error | any) {
        toast.error(error.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [isCreate, isEdit, initialData, onClose, reset, setLoading]
  );

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_number");

      if (error) {
        console.log("Error fetching vehicles:", error.message);
        return;
      }
      setVehicleLoaded(true);
      setVehicles(data);
    };
    fetchVehicles();
  }, []);

  if (!open) return null;

  const inputClass = `w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500`;
  const labelClass = `text-sm font-semibold text-gray-700 ml-1`;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-999 flex justify-center items-center p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isView ? "Maintenance Details" : isEdit ? "Edit Maintenance" : "New Maintenance Record"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Please fill in the maintenance information below.</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <icons.closeModal className="text-xl" /> {/* Adjust to your close icon if ModalButton isn't used */}
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Date */}
          <div className="flex flex-col">
            <label className={labelClass}>Maintenance Date</label>
            <input
              {...register("date")}
              disabled={isView}
              className={inputClass}
              type="date"
            />
            {errors?.date && <span className="text-red-500 text-xs mt-1 ml-1 font-medium">Date is required</span>}
          </div>

          {/* Vehicle Select */}
          <div className="flex flex-col relative">
            <label className={labelClass}>Registered Vehicle</label>
            <div className="relative">
              <select
                {...register("car")}
                disabled={isView}
                onFocus={() => setSelectToggle(true)}
                onBlur={() => setSelectToggle(false)}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="">Select Plate Number</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.plate_number}>{v.plate_number}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                {selectToggle ? <icons.up /> : <icons.down />}
              </div>
            </div>
            {errors?.car && <span className="text-red-500 text-xs mt-1 ml-1 font-medium">Please select a vehicle</span>}
          </div>

          {/* Cost */}
          <div className="flex flex-col">
            <label className={labelClass}>Maintenance Cost (₱)</label>
            <input
              {...register("cost_of_maintenance")}
              disabled={isView}
              className={inputClass}
              type="text"
              placeholder="e.g. 5000"
            />
            {errors?.cost_of_maintenance && <span className="text-red-500 text-xs mt-1 ml-1 font-medium">Input valid cost</span>}
          </div>

          {/* Type */}
          <div className="flex flex-col">
            <label className={labelClass}>Type of Maintenance</label>
            <input
              {...register("type_of_maintenance")}
              disabled={isView}
              className={inputClass}
              type="text"
              placeholder="e.g. Oil Change"
            />
            {errors?.type_of_maintenance && <span className="text-red-500 text-xs mt-1 ml-1 font-medium">Type is required</span>}
          </div>

          {/* Location */}
          <div className="flex flex-col">
            <label className={labelClass}>Service Location</label>
            <input
              {...register("location")}
              disabled={isView}
              className={inputClass}
              type="text"
              placeholder="e.g. Workshop Center"
            />
            {errors?.location && <span className="text-red-500 text-xs mt-1 ml-1 font-medium">Location is required</span>}
          </div>

          {/* Maintained By */}
          <div className="flex flex-col">
            <label className={labelClass}>Technician / Mechanic</label>
            <input
              {...register("maintained_by")}
              disabled={isView}
              className={inputClass}
              type="text"
              placeholder="e.g. John Doe"
            />
            {errors?.maintained_by && <span className="text-red-500 text-xs mt-1 ml-1 font-medium">Name is required</span>}
          </div>

          {/* Status - Fixed */}
          <div className="flex flex-col md:col-span-2">
            <label className={labelClass}>Record Status</label>
            <input
              {...register("status")}
              disabled
              className={`${inputClass} font-bold text-blue-600 bg-blue-50 border-blue-100`}
              type="text"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          {!isView && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-white hover:border-gray-400 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          )}

          <button
            type={isView ? "button" : "submit"}
            onClick={isView ? onClose : undefined}
            disabled={loading}
            className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] ${
              isView 
                ? "bg-slate-800 hover:bg-slate-900" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
              </span>
            ) : (
              <>
                {isEdit && "Update Record"}
                {isCreate && "Submit Record"}
                {isView && "Close Details"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(MaintenanceForm);