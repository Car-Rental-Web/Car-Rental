import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../utils/supabase";
import { uploadFile } from "../utils/UploadFile";
import { toast } from "react-toastify";
import icons from "../constants/icon";
import { RenterProfileSchema, type RenterValues } from "../schema/schema";

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
    formState: { errors },
  } = useForm<RenterValues>({
    resolver: zodResolver(RenterProfileSchema),
  });

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
        pagibig_number: ""
      });
    }
  }, [selectedData, reset, open]);

  const onSubmit = async (data: RenterValues) => {
    try {
      let validIdUrl = selectedData?.valid_id;
      let signatureUrl = selectedData?.e_signature;

      // 1. Handle Valid ID Upload
      if (data.valid_id?.[0] instanceof File) {
        const { path } = await uploadFile(data.valid_id[0], "ids");
        validIdUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/ids/${path}`;
      }

      // 2. Handle E-Signature Upload
      if (data.e_signature?.[0] instanceof File) {
        const { path } = await uploadFile(data.e_signature[0], "signatures");
        signatureUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/signatures/${path}`;
      }

      const payload = {
        ...data,
        valid_id: validIdUrl,
        e_signature: signatureUrl,
      };

      if (mode === "edit") {
        const { error } = await supabase
          .from("renter")
          .update(payload)
          .eq("id", selectedData.id);
        if (error) throw error;
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
            {mode === "create" ? "Register New Renter" : mode === "edit" ? "Edit Profile" : "Renter Details"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <icons.closeModal size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section: Personal Info */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
            <input placeholder="ex: John Doe" {...register("full_name")} disabled={isView} className={`w-full p-3 border rounded-xl outline-none transition-all ${errors.full_name ? "border-red-500" : "focus:border-blue-500"} disabled:bg-slate-50`} />
            {errors.full_name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.full_name.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Home Address</label>
            <input placeholder="ex: Angeles" {...register("address")} disabled={isView} className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50" />
          </div>

          {/* Section: Government IDs */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">License Number</label>
            <input {...register("license_number")} disabled={isView} className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PhilHealth Number</label>
            <input {...register("philhealth_number")} disabled={isView} className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">TIN Number</label>
            <input {...register("tin_number")} disabled={isView} className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">SSS Number</label>
            <input {...register("sss_number")} disabled={isView} className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50" />
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pag-IBIG Number</label>
            <input {...register("pagibig_number")} disabled={isView} className="w-full p-3 border rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50" />
          </div>

          {/* Section: File Uploads */}
          <div className="border-t pt-4 md:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Valid ID Photo</label>
            {!isView && <input type="file" {...register("valid_id")} className="text-xs mb-2 block w-full" />}
            {selectedData?.valid_id && (
              <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden border">
                <img src={selectedData.valid_id} className="w-full h-full object-cover" alt="ID Preview" />
              </div>
            )}
          </div>

          <div className="border-t pt-4 md:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">E-Signature</label>
            {!isView && <input type="file" {...register("e_signature")} className="text-xs mb-2 block w-full" />}
            {selectedData?.e_signature && (
              <div className="relative w-full h-32 bg-slate-50 rounded-xl overflow-hidden border border-dashed flex items-center justify-center">
                <img src={selectedData.e_signature} className="max-h-full object-contain p-2" alt="Signature Preview" />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
            Close
          </button>
          {!isView && (
            <button type="submit" className="flex-2 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
              {mode === "edit" ? "Update Profile" : "Register Renter"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;