/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../../utils/supabase";
import {
  Field,
  FormModal,
  PhotoUpload,
  inputStyles,
  useFilePreview,
} from "../../../components/FormParts";

const ID_BUCKET = "valid_id"; // public buckets in the laundry project
const SIGNATURE_BUCKET = "e_signature";

// Schema for the `customer_profile` table.
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

// Upload to the laundry project and return both the public URL and the path
const uploadImage = async (bucket: string, file: File) => {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;

  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return { url, path };
};

const getPathFromUrl = (url: string | undefined, bucket: string) =>
  url ? url.split(`${bucket}/`)[1] : null;

const CustomerForm: React.FC<Props> = ({
  open,
  onClose,
  selectedData,
  mode,
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
    resolver: zodResolver(CustomerProfileSchema),
  });

  // Previews: a newly picked file first, otherwise the saved image
  const watchedId = watch("valid_id");
  const watchedSignature = watch("e_signature");
  const idFile: File | undefined =
    watchedId?.[0] instanceof File ? watchedId[0] : undefined;
  const signatureFile: File | undefined =
    watchedSignature?.[0] instanceof File ? watchedSignature[0] : undefined;

  const idPreview = useFilePreview(idFile) || selectedData?.valid_id || null;
  const signaturePreview =
    useFilePreview(signatureFile) || selectedData?.e_signature || null;

  useEffect(() => {
    if (!open) return;
    reset({
      full_name: selectedData?.full_name ?? "",
      address: selectedData?.address ?? "",
      phone_number: selectedData?.phone_number ?? "",
      notes: selectedData?.notes ?? "",
      valid_id: undefined,
      e_signature: undefined,
    });
  }, [selectedData, reset, open]);

  const onSubmit = async (data: CustomerValues) => {
    if (isView) return;

    const uploaded: { bucket: string; path: string }[] = [];

    try {
      let validIdUrl = selectedData?.valid_id ?? null;
      let signatureUrl = selectedData?.e_signature ?? null;

      // 1. Valid ID
      if (idFile) {
        const { url, path } = await uploadImage(ID_BUCKET, idFile);
        uploaded.push({ bucket: ID_BUCKET, path });
        validIdUrl = url;
      }

      // 2. E-signature
      if (signatureFile) {
        const { url, path } = await uploadImage(SIGNATURE_BUCKET, signatureFile);
        uploaded.push({ bucket: SIGNATURE_BUCKET, path });
        signatureUrl = url;
      }

      const payload = {
        full_name: data.full_name.trim(),
        address: data.address || null,
        phone_number: data.phone_number || null,
        notes: data.notes || null,
        valid_id: validIdUrl,
        e_signature: signatureUrl,
      };

      if (isEdit && selectedData) {
        const { error } = await supabase
          .from("customer_profile")
          .update(payload)
          .eq("id", selectedData.id);
        if (error) throw error;

        // Remove the replaced images only after the update worked
        if (idFile && selectedData.valid_id) {
          const oldPath = getPathFromUrl(selectedData.valid_id, ID_BUCKET);
          if (oldPath) await supabase.storage.from(ID_BUCKET).remove([oldPath]);
        }
        if (signatureFile && selectedData.e_signature) {
          const oldPath = getPathFromUrl(selectedData.e_signature, SIGNATURE_BUCKET);
          if (oldPath)
            await supabase.storage.from(SIGNATURE_BUCKET).remove([oldPath]);
        }

        toast.success("Customer updated!");
      } else {
        // times_service starts at 0; last_date_service is filled in by bookings
        const { error } = await supabase
          .from("customer_profile")
          .insert([{ ...payload, times_service: 0 }]);
        if (error) throw error;

        toast.success("Customer registered!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Customer submit error:", error);

      // Don't leave images behind if saving failed
      await Promise.all(
        uploaded.map((u) => supabase.storage.from(u.bucket).remove([u.path])),
      );
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
        {/* Left: Valid ID */}
        <div className="w-full md:w-1/3">
          <PhotoUpload
            label="Valid ID Photo"
            previewUrl={idPreview}
            emptyText="No ID selected"
            isView={isView}
            fit="contain"
            inputProps={register("valid_id")}
          />
        </div>

        {/* Right: details */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
          <Field label="Full Name" className="sm:col-span-2" error={errors.full_name?.message}>
            <input
              disabled={isView}
              {...register("full_name")}
              type="text"
              placeholder="e.g. John Doe"
              className={inputStyles}
            />
          </Field>

          <Field label="Home Address" className="sm:col-span-2">
            <input
              disabled={isView}
              {...register("address")}
              type="text"
              placeholder="e.g. Angeles"
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

          {/* Updated by bookings, so read-only */}
          {mode !== "create" && selectedData && (
            <>
              <Field label="Times Serviced">
                <input
                  disabled
                  value={selectedData.times_service ?? 0}
                  readOnly
                  className={inputStyles}
                />
              </Field>
              <Field label="Last Service">
                <input
                  disabled
                  value={selectedData.last_date_service || "N/A"}
                  readOnly
                  className={inputStyles}
                />
              </Field>
            </>
          )}

          <Field label="Notes" className="sm:col-span-2">
            <textarea
              rows={3}
              disabled={isView}
              {...register("notes")}
              placeholder="e.g. Prefers fabric softener, pickup on weekends"
              className={inputStyles}
            />
          </Field>
        </div>
      </div>

      {/* Signature */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <PhotoUpload
          label="E-Signature"
          previewUrl={signaturePreview}
          emptyText="No signature"
          isView={isView}
          wide
          fit="contain"
          inputProps={register("e_signature")}
        />
      </div>
    </FormModal>
  );
};

export default CustomerForm;