/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../../utils/supabase";
import { syncMachineStatus } from "../../../utils/laundry/syncMachineStatus";
import icons from "../../../constants/icon";

// Matches the columns of the `laundry_machines` table
export interface LaundryMachineData {
  id: string;
  created_at: string;
  machine_name: string | null;
  status: string | null; // Available / On Reservation / On Service / On Maintenance
}

const MachineSchema = z.object({
  machine_name: z.string().trim().min(1, "Machine name is required"),
});
type MachineValues = z.infer<typeof MachineSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  selectedData?: LaundryMachineData | null;
  machines: LaundryMachineData[]; // used to block duplicate names
  onSuccess: () => void;
}

const MachineForm: React.FC<Props> = ({
  open,
  onClose,
  mode,
  selectedData,
  machines,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MachineValues>({
    resolver: zodResolver(MachineSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      machine_name: mode === "edit" ? (selectedData?.machine_name ?? "") : "",
    });
  }, [open, mode, selectedData, reset]);

  const onSubmit = async (data: MachineValues) => {
    const name = data.machine_name.trim();

    // Block duplicates (case-insensitive), ignoring the machine being edited
    const duplicate = machines.some(
      (m) =>
        m.id !== selectedData?.id &&
        m.machine_name?.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setError("machine_name", { message: "This machine already exists" });
      return;
    }

    try {
      if (mode === "edit" && selectedData) {
        const oldName = selectedData.machine_name;

        const { error } = await supabase
          .from("laundry_machines")
          .update({ machine_name: name })
          .eq("id", selectedData.id);
        if (error) throw error;

        // Bookings and maintenance store the machine NAME too, so keep them in sync
        if (oldName && oldName !== name) {
          const { error: bookingSync } = await supabase
            .from("laundry_booking")
            .update({ machine_name: name })
            .eq("machine_id", selectedData.id);
          if (bookingSync) throw bookingSync;

          const { error: maintenanceSync } = await supabase
            .from("laundry_maintenance")
            .update({ machine_name: name })
            .eq("machine_name", oldName);
          if (maintenanceSync) throw maintenanceSync;

          await syncMachineStatus(selectedData.id);
        }

        toast.success("Machine updated!");
      } else {
        const { error } = await supabase
          .from("laundry_machines")
          .insert([{ machine_name: name }]);
        if (error) throw error;

        toast.success("Machine added!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Machine submit error:", error);
      toast.error(error.message || "Something went wrong");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1300 flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            {mode === "edit" ? "Edit Machine" : "Add New Machine"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <icons.closeModal size={22} />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Machine Name
          </label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Washer 1"
            {...register("machine_name")}
            className={`w-full border rounded-lg px-4 py-2.5 text-gray-700 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
              errors.machine_name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.machine_name && (
            <p className="text-red-500 text-[10px] mt-1 font-bold">
              {errors.machine_name.message}
            </p>
          )}
          {mode === "edit" && (
            <p className="text-[11px] text-gray-400 mt-2">
              Renaming also updates its bookings and maintenance records.
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white font-bold hover:bg-black transition-all disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : mode === "edit"
                ? "Update Machine"
                : "Add Machine"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MachineForm;