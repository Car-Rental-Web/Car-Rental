/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../../utils/supabase";
import { toast } from "react-toastify";
import { Field, FormModal, PhotoUpload, inputStyles } from "../../../components/FormParts";
import { RenterProfileSchema, type RenterValues } from "../../../schema/schema";
import getFilePreview from "../../../utils/rental/getFilePreview";
import { uploadFile } from "../../../utils/rental/UploadFile";
import getPublicUrl from "../../../utils/rental/getPublicUrl";

interface Props {
  open: boolean;
  onClose: () => void;
  selectedData?: any;
  mode: "create" | "edit" | "view";
  onSuccess: () => void;
}

const ProfileForm: React.FC<Props> = ({
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
  } = useForm<RenterValues>({
    resolver: zodResolver(RenterProfileSchema),
  });

  // watch values for previews
  const watchedValidId = watch("valid_id");
  const watchedSignature = watch("e_signature");
  const watchedSelfie = watch("renter_selfie" as any);

  const idPreview = getFilePreview(watchedValidId, "valid_id");
  const sigPreview = getFilePreview(watchedSignature, "e_signature");
  const selfiePreview = getFilePreview(watchedSelfie, "renter_selfie");

  useEffect(() => {
    if (open && selectedData) {
      reset(selectedData);
    } else if (open) {
      reset({
        full_name: "",
        address: "",
        license_number: "",
        philhealth_number: "",
        tin_number: "",
        sss_number: "",
        pagibig_number: "",
      });
    }
  }, [selectedData, reset, open]);

  // Helper to extract file path from URL for deletion
  const getPathFromUrl = (url: string | undefined, bucket: string) => {
    if (!url) return null;
    // Assuming URL structure includes the bucket name
    return url.split(`${bucket}/`)[1];
  };

  const onSubmit = async (data: RenterValues) => {
    try {
      let validIdUrl = selectedData?.valid_id;
      let signatureUrl = selectedData?.e_signature;
      let selfieUrl = selectedData?.renter_selfie;

      // 1. Handle Valid ID Upload
      if (data.valid_id?.[0] instanceof File) {
        // --- CLEANUP: Delete old file if updating ---
        if (mode === "edit" && selectedData?.valid_id) {
          const oldPath = getPathFromUrl(selectedData.valid_id, "valid_id");
          if (oldPath)
            await supabase.storage.from("valid_id").remove([oldPath]);
        }

        const { path } = await uploadFile(data.valid_id[0], "valid_id");
        validIdUrl = getPublicUrl("valid_id", path);
      }

      // 2. Handle E-Signature Upload
      if (data.e_signature?.[0] instanceof File) {
        // --- CLEANUP: Delete old file if updating ---
        if (mode === "edit" && selectedData?.e_signature) {
          const oldPath = getPathFromUrl(
            selectedData.e_signature,
            "e_signature"
          );
          if (oldPath)
            await supabase.storage.from("e_signature").remove([oldPath]);
        }

        const { path } = await uploadFile(data.e_signature[0], "e_signature");
        signatureUrl = getPublicUrl("e_signature", path);
      }

      // 3. Handle Renter Selfie Upload
      const selfieFile = (data as any).renter_selfie?.[0];
      if (selfieFile instanceof File) {
        // --- CLEANUP: Delete old file if updating ---
        if (mode === "edit" && selectedData?.renter_selfie) {
          const oldPath = getPathFromUrl(
            selectedData.renter_selfie,
            "renter_selfie"
          );
          if (oldPath)
            await supabase.storage.from("renter_selfie").remove([oldPath]);
        }

        const { path } = await uploadFile(selfieFile, "renter_selfie");
        selfieUrl = getPublicUrl("renter_selfie", path);
      }

      const payload = {
        ...data,
        valid_id: validIdUrl,
        e_signature: signatureUrl,
        renter_selfie: selfieUrl,
      };

      if (mode === "edit") {
        const { error: profileError } = await supabase
          .from("renter")
          .update(payload)
          .eq("id", selectedData.id);
        if (profileError) throw profileError;

        toast.success("Renter updated!");
      } else {
        const { error } = await supabase.from("renter").insert([payload]);
        if (error) throw error;
        toast.success("Renter registered!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const isView = mode === "view";
  const isEdit = mode === "edit";

  return (
    <FormModal
      open={open}
      title={
        mode === "create"
          ? "Register New Renter"
          : isEdit
            ? "Edit Renter Profile"
            : "Renter Profile"
      }
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      isView={isView}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? "Update Renter" : "Register Renter"}
      submittingLabel={isEdit ? "Updating..." : "Processing..."}
    >
      {/* Photo on the left, details on the right */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <PhotoUpload
            label="Renter Photo"
            previewUrl={selfiePreview}
            emptyText="No selfie selected"
            isView={isView}
            inputProps={register("renter_selfie" as any)}
          />
        </div>

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

          <Field label="Contact #">
            <input
              disabled={isView}
              {...register("contact_number")}
              type="text"
              placeholder="e.g. 09212400232"
              className={inputStyles}
            />
          </Field>

          <Field label="Facebook Account">
            <input
              disabled={isView}
              {...register("facebook_account")}
              type="text"
              placeholder="e.g. John Doe"
              className={inputStyles}
            />
          </Field>

          <Field label="License Number">
            <input
              disabled={isView}
              {...register("license_number")}
              type="text"
              placeholder="e.g. ABC-123-ZXC"
              className={inputStyles}
            />
          </Field>

          <Field label="PhilHealth Number">
            <input
              disabled={isView}
              {...register("philhealth_number")}
              type="text"
              placeholder="e.g. ABC-123-ZXC"
              className={inputStyles}
            />
          </Field>

          <Field label="TIN Number">
            <input
              disabled={isView}
              {...register("tin_number")}
              type="text"
              placeholder="e.g. ABC-123-ZXC"
              className={inputStyles}
            />
          </Field>

          <Field label="SSS Number">
            <input
              disabled={isView}
              {...register("sss_number")}
              type="text"
              placeholder="e.g. ABC-123-ZXC"
              className={inputStyles}
            />
          </Field>

          <Field label="Pag-IBIG Number">
            <input
              disabled={isView}
              {...register("pagibig_number")}
              type="text"
              placeholder="e.g. ABC-123-ZXC"
              className={inputStyles}
            />
          </Field>

          <Field label="Referral">
            <input
              disabled={isView}
              {...register("referral")}
              type="text"
              placeholder="e.g. John Doe"
              className={inputStyles}
            />
          </Field>
        </div>
      </div>

      {/* Documents */}
      <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <PhotoUpload
          label="Valid ID Photo"
          previewUrl={idPreview}
          emptyText="No ID selected"
          isView={isView}
          wide
          fit="contain"
          inputProps={register("valid_id")}
        />
        <PhotoUpload
          label="E-Signature"
          previewUrl={sigPreview}
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

export default ProfileForm;