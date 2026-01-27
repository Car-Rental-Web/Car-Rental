import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../utils/supabase";
import { uploadFile } from "../utils/UploadFile";
import { toast } from "react-toastify";
import icons from "../constants/icon";
import { RenterProfileSchema, type RenterValues } from "../schema/schema";
import getPublicUrl from "../utils/getPublicUrl";
import getFilePreview from "../utils/getFilePreview";

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
    formState: { errors },
  } = useForm<RenterValues>({
    resolver: zodResolver(RenterProfileSchema),
  });

  // watch values
  const watchedValidId = watch("valid_id");
  const watchedSignature = watch("e_signature");
  const watchedSelfie = watch("renter_selfie" as any); // Watch the new selfie field

  const idPreview = getFilePreview(watchedValidId, "valid_id");
  const sigPreview = getFilePreview(watchedSignature, "e_signature");
  const selfiePreview = getFilePreview(watchedSelfie, "renter_selfie"); // Get selfie preview

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

  const onSubmit = async (data: RenterValues) => {
    try {
      let validIdUrl = selectedData?.valid_id;
      let signatureUrl = selectedData?.e_signature;
      let selfieUrl = selectedData?.renter_selfie; // Track selfie URL

      // 1. Handle Valid ID Upload
      if (data.valid_id?.[0] instanceof File) {
        const { path } = await uploadFile(data.valid_id[0], "valid_id");
        validIdUrl = getPublicUrl("valid_id", path);
      }

      // 2. Handle E-Signature Upload
      if (data.e_signature?.[0] instanceof File) {
        const { path } = await uploadFile(data.e_signature[0], "e_signature");
        signatureUrl = getPublicUrl("e_signature", path);
      }

      // 3. Handle Renter Selfie Upload
      const selfieFile = (data as any).renter_selfie?.[0];
      if (selfieFile instanceof File) {
        const { path } = await uploadFile(selfieFile, "renter_selfie");
        selfieUrl = getPublicUrl("renter_selfie", path);
      }

      const payload = {
        ...data,
        valid_id: validIdUrl,
        e_signature: signatureUrl,
        renter_selfie: selfieUrl, // Include in payload
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
              ? "Register New Renter"
              : mode === "edit"
                ? "Edit Profile"
                : "Renter Details"}
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
          {/* Section: Personal Info */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <input
              placeholder="ex: John Doe"
              {...register("full_name")}
              disabled={isView}
              className={`w-full p-3 border rounded-xl outline-none transition-all ${errors.full_name ? "border-red-500" : "focus:border-blue-500"} disabled:bg-slate-50`}
            />
            {errors.full_name && (
              <p className="text-red-500 text-[10px] mt-1 font-bold">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Home Address
            </label>
            <input
              placeholder="ex: Angeles"
              {...register("address")}
              disabled={isView}
              className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50"
            />
          </div>

          {/* Section: Government IDs */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              License Number
            </label>
            <input
              placeholder="ex: ABC-123-ZXC"
              {...register("license_number")}
              disabled={isView}
              className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              PhilHealth Number
            </label>
            <input
              placeholder="ex: ABC-123-ZXC"
              {...register("philhealth_number")}
              disabled={isView}
              className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              TIN Number
            </label>
            <input
              placeholder="ex: ABC-123-ZXC"
              {...register("tin_number")}
              disabled={isView}
              className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              SSS Number
            </label>
            <input
              placeholder="ex: ABC-123-ZXC"
              {...register("sss_number")}
              disabled={isView}
              className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pag-IBIG Number
            </label>
            <input
              placeholder="ex: ABC-123-ZXC"
              {...register("pagibig_number")}
              disabled={isView}
              className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50"
            />
          </div>

          {/* Section: File Uploads */}
          <div className="border-t pt-4 md:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Valid ID Photo
            </label>
            {!isView && (
              <input
                type="file"
                {...register("valid_id")}
                className="w-full text-xs text-gray-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
              />
            )}

            <div className="relative w-full min-h-32  bg-slate-50 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              E-Signature
            </label>
            {!isView && (
              <input
                type="file"
                {...register("e_signature")}
                className="w-full text-xs text-gray-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
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

          {/* Renter Selfie (Flexible/Responsive Preview) */}
          <div className="border-t pt-4 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Renter Selfie
            </label>
            {!isView && (
              <input
                type="file"
                {...register("renter_selfie" as any)}
                className="w-full text-xs text-gray-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
              />
            )}

            <div className="relative w-full min-h-32 bg-slate-50 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
              {selfiePreview ? (
                <img
                  src={selfiePreview}
                  className="w-full h-auto max-h-[400px] object-contain p-1"
                  alt="Selfie Preview"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 opacity-30 py-8">
                  <icons.upload size={20} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">
                    No Selfie Selected
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Referral
            </label>
            <input
              placeholder="ex: John Doe"
              {...register("referral")}
              disabled={isView}
              className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50"
            />
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
              className="flex-2 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              {mode === "edit" ? "Update Profile" : "Register Renter"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;