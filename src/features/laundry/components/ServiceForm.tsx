/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../../utils/supabase";
import icons from "../../../constants/icon";

const BUCKET = "service_image"; // must be a PUBLIC bucket in the laundry project

// Matches the columns of the `laundry_service` table.
// Services are now just a catalog; the machine holds the status.
export interface LaundryServiceData {
  id: string;
  created_at: string;
  service_name: string | null;
  service_image: string | null;
  price: number | null;
}

const ServiceSchema = z.object({
  service_name: z.string().trim().min(1, "Service name is required"),
  price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Enter a valid price"),
  service_image: z.any().optional(),
});
type ServiceValues = z.infer<typeof ServiceSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  selectedData?: LaundryServiceData | null;
  onSuccess: () => void;
}

const inputStyles =
  "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400";
const labelStyles = "block text-sm font-semibold text-gray-700 mb-1";

const ServiceForm: React.FC<Props> = ({
  open,
  onClose,
  mode,
  selectedData,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceValues>({
    resolver: zodResolver(ServiceSchema),
  });

  const isView = mode === "view";
  const isEdit = mode === "edit";

  // Image preview: newly picked file first, otherwise the saved URL
  const watchedImage = watch("service_image");
  const newFile: File | undefined =
    watchedImage?.[0] instanceof File ? watchedImage[0] : undefined;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!newFile) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(newFile);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newFile]);

  const previewUrl = objectUrl || selectedData?.service_image || null;

  useEffect(() => {
    if (!open) return;
    reset({
      service_name: selectedData?.service_name ?? "",
      price: selectedData?.price != null ? String(selectedData.price) : "",
      service_image: undefined,
    });
  }, [open, selectedData, reset]);

  const getPathFromUrl = (url: string) => url.split(`${BUCKET}/`)[1];

  const onSubmit = async (data: ServiceValues) => {
    try {
      let imageUrl = selectedData?.service_image ?? null;
      const oldImageUrl = selectedData?.service_image ?? null;

      // Upload the new image first, so a failed upload never loses the old one
      if (newFile) {
        const ext = newFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, newFile);
        if (uploadError) throw uploadError;

        imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data
          .publicUrl;

        if (isEdit && oldImageUrl) {
          const oldPath = getPathFromUrl(oldImageUrl);
          if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
        }
      }

      const payload = {
        service_name: data.service_name.trim(),
        price: Number(data.price),
        service_image: imageUrl,
      };

      if (isEdit && selectedData) {
        const { error } = await supabase
          .from("laundry_service")
          .update(payload)
          .eq("id", selectedData.id);
        if (error) throw error;

        // Bookings keep a copy of the service name, so keep it in sync
        if (selectedData.service_name !== payload.service_name) {
          await supabase
            .from("laundry_booking")
            .update({ laundry_service: payload.service_name })
            .eq("service_id", selectedData.id);
        }
        toast.success("Service updated!");
      } else {
        const { error } = await supabase
          .from("laundry_service")
          .insert([payload]);
        if (error) throw error;
        toast.success("Service added!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Service submit error:", error);
      toast.error(error.message || "Something went wrong");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1300 flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full max-w-2xl max-h-full overflow-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isView
              ? "Service Details"
              : isEdit
                ? "Edit Service"
                : "Add New Service"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <icons.closeModal size={24} />
          </button>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-8">
          {/* Image */}
          <div className="w-full md:w-2/5 flex flex-col items-center">
            <label className={labelStyles}>Service Image</label>
            <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <icons.upload className="text-3xl text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No image selected</p>
                </div>
              )}
            </div>

            {!isView && (
              <input
                {...register("service_image")}
                type="file"
                accept="image/*"
                className="mt-3 text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
              />
            )}
          </div>

          {/* Name */}
          <div className="flex-1 content-start">
            <label className={labelStyles}>Service Name</label>
            <input
              disabled={isView}
              {...register("service_name")}
              type="text"
              placeholder="e.g. Wash & Fold"
              className={inputStyles}
            />
            {errors.service_name && (
              <p className="text-red-500 text-[10px] mt-1 font-bold">
                {errors.service_name.message}
              </p>
            )}

            <label className={`${labelStyles} mt-4`}>Price (₱)</label>
            <input
              disabled={isView}
              {...register("price")}
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 150"
              className={inputStyles}
            />
            {errors.price && (
              <p className="text-red-500 text-[10px] mt-1 font-bold">
                {errors.price.message}
              </p>
            )}

            <p className="text-[11px] text-gray-400 mt-3">
              Services are a catalog. You pick the machine when you book, and
              the price is saved on each booking.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
          >
            {isView ? "Close" : "Cancel"}
          </button>

          {!isView && (
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {isEdit ? "Updating..." : "Saving..."}
                </>
              ) : isEdit ? (
                "Update Service"
              ) : (
                "Add Service"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;