import { useForm } from "react-hook-form";
import {
  VehicleHistorySchema,
  type VehicleHistoryData,
} from "../schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";
import { ModalButton } from "../components/CustomButtons";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";
import { uploadFile } from "../utils/UploadFile";
import getFilePreview from "../utils/getFilePreview";
import { useEffect } from "react";
import type { VehicleFormValues } from "../types/types";
import { useLoadingStore } from "../store/useLoading";
import icons from "../constants/icon";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  initialData?: VehicleFormValues & { id?: number };
}

const VehicleHistoryForm: React.FC<ModalProps> = ({
  open,
  onClose,
  mode,
  initialData,
}) => {
  const { loading, setLoading } = useLoadingStore();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<VehicleHistoryData>({
    resolver: zodResolver(VehicleHistorySchema),
    mode: "onSubmit",
    shouldUnregister: false,
    defaultValues: {
      car_image: "",
      brand: "",
      model: "",
      type: "",
      color: "",
      plate_number: "",
      status: "Available",
    },
  });

  const watchedImage = watch("car_image");
  const previewUrl = getFilePreview(watchedImage, "vehicle");

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({
          brand: "",
          model: "",
          type: "",
          color: "",
          plate_number: "",
          car_image: "",
          status: "Available",
        });
      }
    }
  }, [initialData, open, reset]);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const onSubmit = async (data: VehicleHistoryData) => {
    setLoading(true);
    try {
      let imageUrl = initialData?.car_image || "";

      if (data.car_image instanceof FileList && data.car_image.length > 0) {
        const file = data.car_image[0];
        const uploadResult = await uploadFile(file, "vehicle");
        const { data: urlData } = supabase.storage
          .from(uploadResult.bucket)
          .getPublicUrl(uploadResult.path);
        imageUrl = urlData.publicUrl;
      }

      const { car_image, ...rest } = data;
      const payload = { ...rest, car_image: imageUrl };

      if (isEdit && initialData?.id) {
        const { error } = await supabase
          .from("vehicle")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success("Updated Successfully");
      } else if (isCreate) {
        const { error } = await supabase.from("vehicle").insert([payload]);
        if (error) throw error;
        toast.success("Registered Successfully");
      }

      reset();
      onClose();
    } catch (error: any) {
      console.error("Submit Error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const inputStyles = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400";
  const labelStyles = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999 flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isView ? "Vehicle Profile" : isEdit ? "Edit Vehicle Info" : "Register New Vehicle"}
          </h2>
          <ModalButton type="button" onclick={onClose} />
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-8">
          {/* Left Side: Image Upload */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <label className={labelStyles}>Vehicle Photo</label>
            <div className="relative group w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center transition-all hover:border-blue-400">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <icons.add className="text-3xl text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No image selected</p>
                </div>
              )}
              
              {!isView && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <p className="text-white text-xs font-bold">Change Image</p>
                </div>
              )}
            </div>
            
            {!isView && (
              <input
                {...register("car_image")}
                type="file"
                accept="image/*"
                className="mt-3 text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
              />
            )}
            {errors.car_image && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-wider">Image Required</p>}
          </div>

          {/* Right Side: Inputs */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-1">
              <label className={labelStyles}>Manufacturer</label>
              <input disabled={isView} {...register("brand")} type="text" placeholder="e.g. Honda" className={inputStyles} />
              {errors.brand && <p className="text-red-500 text-[10px] mt-1">Brand is required</p>}
            </div>

            <div className="sm:col-span-1">
              <label className={labelStyles}>Model</label>
              <input disabled={isView} {...register("model")} type="text" placeholder="e.g. 2021" className={inputStyles} />
              {errors.model && <p className="text-red-500 text-[10px] mt-1">Model is required</p>}
            </div>

            <div className="sm:col-span-1">
              <label className={labelStyles}>Body Type</label>
              <input disabled={isView} {...register("type")} type="text" placeholder="e.g. Sedan" className={inputStyles} />
            </div>

            <div className="sm:col-span-1">
              <label className={labelStyles}>Color</label>
              <input disabled={isView} {...register("color")} type="text" placeholder="e.g. Black" className={inputStyles} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelStyles}>Plate Number</label>
              <input 
                disabled={isView} 
                {...register("plate_number")} 
                type="text" 
                placeholder="ABC-1234" 
                className={`${inputStyles} font-mono font-bold tracking-widest`} 
              />
              {errors.plate_number && <p className="text-red-500 text-[10px] mt-1">Valid plate number required</p>}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
          >
            {isView ? "Back to Fleet" : "Cancel"}
          </button>
          
          {!isView && (
            <button
              disabled={loading}
              type="submit"
              className="flex-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {isEdit ? "Updating..." : "Processing..."}
                </>
              ) : (
                isEdit ? "Update Vehicle" : "Register Vehicle"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VehicleHistoryForm;