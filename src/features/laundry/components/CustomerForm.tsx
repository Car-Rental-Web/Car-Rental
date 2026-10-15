/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseLaundry } from "../../../utils/supabase";
import icons from "../../../constants/icon";
import getFilePreviewLaundry from "../../../utils/laundry/getFilePreviewLaundry";
import { uploadFileLaundry } from "../../../utils/laundry/UploadFIleLaundry";
import getPublicUrlLaundry from "../../../utils/laundry/getPublicUrlLaundry";

// Schema for the `customer_profile` table.
// (You can move this into ../schema/schema.ts to match your other schemas.)
export const CustomerProfileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  address: z.string().optional(),
  phone_number: z.string().optional(),
  notes: z.string().optional(),
  valid_id: z.any().optional(),
  e_signature: z.any().optional(),
});

export type CustomerValues = z.infer<typeof CustomerProfileSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  selectedData?: any;
  mode: "create" | "edit" | "view";
  onSuccess: () => void;
}

const labelClass =
  "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1";
const inputClass =
  "w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50";
const fileInputClass =
  "w-full text-xs text-gray-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer";

const CustomerForm: React.FC<Props> = ({
  open,
  onClose,
  selectedData,
  mode,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerValues>({
    resolver: zodResolver(CustomerProfileSchema),
  });

  // watch values for previews
  const watchedValidId = watch("valid_id");
  const watchedSignature = watch("e_signature");

  const idPreview = getFilePreviewLaundry(watchedValidId, "valid_id");
  const sigPreview = getFilePreviewLaundry(watchedSignature, "e_signature");

  useEffect(() => {
    if (open && selectedData) {
      reset(selectedData);
    } else if (open) {
      reset({
        full_name: "",
        address: "",
        phone_number: "",
        notes: "",
        valid_id: undefined,
        e_signature: undefined,
      });
    }
  }, [selectedData, reset, open]);

  // Helper to extract file path from URL for deletion
  const getPathFromUrl = (url: string | undefined, bucket: string) => {
    if (!url) return null;
    return url.split(`${bucket}/`)[1];
  };

  const onSubmit = async (data: CustomerValues) => {
    try {
      let validIdUrl = selectedData?.valid_id;
      let signatureUrl = selectedData?.e_signature;

      // 1. Handle Valid ID upload
      if (data.valid_id?.[0] instanceof File) {
        if (mode === "edit" && selectedData?.valid_id) {
          const oldPath = getPathFromUrl(selectedData.valid_id, "valid_id");
          if (oldPath)
            await supabaseLaundry.storage.from("valid_id").remove([oldPath]);
        }

        const { path } = await uploadFileLaundry(data.valid_id[0], "valid_id");
        validIdUrl = getPublicUrlLaundry("valid_id", path);
      }

      // 2. Handle E-Signature upload
      if (data.e_signature?.[0] instanceof File) {
        if (mode === "edit" && selectedData?.e_signature) {
          const oldPath = getPathFromUrl(
            selectedData.e_signature,
            "e_signature",
          );
          if (oldPath)
            await supabaseLaundry.storage.from("e_signature").remove([oldPath]);
        }

        const { path } = await uploadFileLaundry(data.e_signature[0], "e_signature");
        signatureUrl = getPublicUrlLaundry("e_signature", path);
      }

      const payload = {
        full_name: data.full_name,
        address: data.address,
        phone_number: data.phone_number,
        notes: data.notes,
        valid_id: validIdUrl,
        e_signature: signatureUrl,
      };

      if (mode === "edit") {
        const { error } = await supabaseLaundry
          .from("customer_profile")
          .update(payload)
          .eq("id", selectedData.id);
        if (error) throw error;

        toast.success("Customer updated!");
      } else {
        // times_service starts at 0; last_date_service is filled in by bookings
        const { error } = await supabaseLaundry
          .from("customer_profile")
          .insert([{ ...payload, times_service: 0 }]);
        if (error) throw error;

        toast.success("Customer registered!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!open) return null;

  const isView = mode === "view";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-1000 flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-slate-800 uppercase">
            {mode === "create"
              ? "Register New Customer"
              : mode === "edit"
                ? "Edit Customer"
                : "Customer Details"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <icons.closeModal size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="md:col-span-2">
            <label className={labelClass}>Full Name</label>
            <input
              placeholder="ex: John Doe"
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

          {/* Address */}
          <div className="md:col-span-2">
            <label className={labelClass}>Home Address</label>
            <input
              placeholder="ex: Angeles"
              {...register("address")}
              disabled={isView}
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div className="md:col-span-2">
            <label className={labelClass}>Phone Number</label>
            <input
              placeholder="ex: 09212400232"
              {...register("phone_number")}
              disabled={isView}
              className={inputClass}
            />
          </div>

          {/* Read-only service stats (updated by bookings, not typed in) */}
          {mode !== "create" && selectedData && (
            <>
              <div>
                <label className={labelClass}>Times Serviced</label>
                <input
                  value={selectedData.times_service ?? 0}
                  readOnly
                  disabled
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last Service</label>
                <input
                  value={selectedData.last_date_service || "N/A"}
                  readOnly
                  disabled
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="md:col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea
              rows={3}
              placeholder="ex: Prefers fabric softener, pickup on weekends"
              {...register("notes")}
              disabled={isView}
              className={inputClass}
            />
          </div>

          {/* Valid ID */}
          <div className="border-t pt-4 md:col-span-1">
            <label className={`${labelClass} mb-2`}>Valid ID Photo</label>
            {!isView && (
              <input
                type="file"
                accept="image/*"
                {...register("valid_id")}
                className={fileInputClass}
              />
            )}

            <div className="relative w-full min-h-32 bg-slate-50 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
              {idPreview ? (
                <img
                  src={idPreview}
                  className="w-full max-h-[400px] object-cover"
                  alt="ID Preview"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 opacity-30">
                  <icons.upload size={20} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">
                    No ID Selected
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* E-Signature */}
          <div className="border-t pt-4 md:col-span-1">
            <label className={`${labelClass} mb-2`}>E-Signature</label>
            {!isView && (
              <input
                type="file"
                accept="image/*"
                {...register("e_signature")}
                className={fileInputClass}
              />
            )}

            <div className="relative w-full min-h-32 bg-slate-50 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
              {sigPreview ? (
                <img
                  src={sigPreview}
                  className="max-h-full object-contain p-2"
                  alt="Signature Preview"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 opacity-30">
                  <span className="text-[9px] font-black uppercase tracking-tighter">
                    No Signature
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
              {mode === "edit" ? "Update Customer" : "Register Customer"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;