/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseWater as supabase } from "../../../utils/supabase";
import { Field, FormModal, inputStyles, labelStyles } from "../../../components/FormParts";
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerValues>({
    resolver: zodResolver(CustomerSchema),
  });

  // Live initials for the left panel
  const fullName = watch("full_name") || "";
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

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

  return (
    <FormModal
      open={open}
      title={
        isView
          ? "Customer Profile"
          : isEdit
            ? "Edit Customer Info"
            : "Register New Customer"
      }
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      isView={isView}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? "Update Customer" : "Register Customer"}
      submittingLabel={isEdit ? "Updating..." : "Processing..."}
    >
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: no photo for water customers, so show who this is */}
        <div className="w-full md:w-1/3 flex flex-col items-center">
          <label className={labelStyles}>Customer</label>
          <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center gap-3 p-4">
            {initials ? (
              <>
                <div className="w-24 h-24 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-3xl font-black">
                  {initials}
                </div>
                <p className="text-sm font-bold text-gray-700 text-center max-w-full truncate">
                  {fullName}
                </p>
              </>
            ) : (
              <div className="text-center">
                <icons.person className="text-3xl text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Type a name to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: details */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
          <Field label="Full Name" className="sm:col-span-2" error={errors.full_name?.message}>
            <input
              disabled={isView}
              {...register("full_name")}
              type="text"
              placeholder="e.g. Juan Dela Cruz"
              className={inputStyles}
            />
          </Field>

          <Field label="Delivery Address" className="sm:col-span-2">
            <input
              disabled={isView}
              {...register("address")}
              type="text"
              placeholder="e.g. Blk 5 Lot 3, Mabalacat"
              className={inputStyles}
            />
          </Field>

          <Field label="Phone Number" className="sm:col-span-2">
            <input
              disabled={isView}
              {...register("phone_number")}
              type="text"
              placeholder="e.g. 09212400232"
              className={inputStyles}
            />
          </Field>

          <Field label="Notes" className="sm:col-span-2">
            <textarea
              rows={3}
              disabled={isView}
              {...register("notes")}
              placeholder="e.g. Landmark, preferred delivery time"
              className={inputStyles}
            />
          </Field>
        </div>
      </div>
    </FormModal>
  );
};

export default WaterCustomerForm;