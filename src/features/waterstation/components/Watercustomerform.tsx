/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseWater as supabase } from "../../../utils/supabase";
import icons from "../../../constants/icon";

// Matches the columns of the `water_customer` table
export interface WaterCustomerData {
  id: string;
  created_at: string;
  full_name: string | null;
  address: string | null;
  phone_number: string | null;
  notes: string | null;
  deleted_at: string | null;
}

const CustomerSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required"),
  address: z.string().optional(),
  phone_number: z.string().optional(),
  notes: z.string().optional(),
});
type CustomerValues = z.infer<typeof CustomerSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  selectedData?: WaterCustomerData | null;
  onSuccess: () => void;
}

const labelClass =
  "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1";
const inputClass =
  "w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50";

const WaterCustomerForm: React.FC<Props> = ({
  open,
  onClose,
  mode,
  selectedData,
  onSuccess,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerValues>({
    resolver: zodResolver(CustomerSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      full_name: selectedData?.full_name ?? "",
      address: selectedData?.address ?? "",
      phone_number: selectedData?.phone_number ?? "",
      notes: selectedData?.notes ?? "",
    });
  }, [open, selectedData, reset]);

  const onSubmit = async (data: CustomerValues) => {
    if (isView) return;

    try {
      const payload = {
        full_name: data.full_name.trim(),
        address: data.address || null,
        phone_number: data.phone_number || null,
        notes: data.notes || null,
      };

      if (isEdit && selectedData) {
        const { error } = await supabase
          .from("water_customer")
          .update(payload)
          .eq("id", selectedData.id);
        if (error) throw error;

        // Orders keep a copy of the customer's details, so keep them in sync
        await supabase
          .from("water_order")
          .update({
            full_name: payload.full_name,
            address: payload.address,
            phone_number: payload.phone_number,
          })
          .eq("customer_id", selectedData.id);

        toast.success("Customer updated!");
      } else {
        const { error } = await supabase.from("water_customer").insert([payload]);
        if (error) throw error;
        toast.success("Customer registered!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Customer submit error:", error);
      toast.error(error.message || "Something went wrong");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-1000 flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-slate-800 uppercase">
            {isView
              ? "Customer Details"
              : isEdit
                ? "Edit Customer"
                : "Register New Customer"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <icons.closeModal size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto grid grid-cols-1 gap-5">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              placeholder="ex: Juan Dela Cruz"
              {...register("full_name")}
              disabled={isView}
              className={`${inputClass} ${errors.full_name ? "border-red-500" : ""}`}
            />
            {errors.full_name && (
              <p className="text-red-500 text-[10px] mt-1 font-bold">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Delivery Address</label>
            <input
              placeholder="ex: Blk 5 Lot 3, Mabalacat"
              {...register("address")}
              disabled={isView}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              placeholder="ex: 09212400232"
              {...register("phone_number")}
              disabled={isView}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              rows={3}
              placeholder="ex: Landmark, preferred delivery time"
              {...register("notes")}
              disabled={isView}
              className={inputClass}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
          >
            Close
          </button>
          {!isView && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update Customer"
                  : "Register Customer"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default WaterCustomerForm;