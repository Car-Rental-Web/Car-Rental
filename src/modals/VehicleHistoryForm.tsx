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
      status: "",
    },
  });
  const watchedImage = watch("car_image");
  const previewUrl = getFilePreview(watchedImage, "vehicle");

  useEffect(() => {
    if (open) {
      if (initialData) {
        // If we have data, fill the form for Edit/View
        reset(initialData);
      } else {
        // IMPORTANT: If initialData is null (Create mode), clear the form entirely
        reset({
          brand: "",
          model: "",
          type: "",
          color: "",
          plate_number: "",
          car_image: "", // Use "" or undefined depending on your schema
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
      let imageUrl = initialData?.car_image || ""; // Keep old image by default

      // 1. Handle Image Upload (Only if a new file is selected)
      if (data.car_image instanceof FileList && data.car_image.length > 0) {
        const file = data.car_image[0];
        const uploadResult = await uploadFile(file, "vehicle");

        const { data: urlData } = supabase.storage
          .from(uploadResult.bucket)
          .getPublicUrl(uploadResult.path);

        imageUrl = urlData.publicUrl;
      }

      // 2. Prepare Payload (Remove FileList object so it doesn't break Supabase)
      const { car_image, ...rest } = data;
      const payload = { ...rest, car_image: imageUrl };

      // 3. Decide: UPDATE or INSERT
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

  return (
    <div
      className={`fixed inset-0 bg-[#032d44]/25 z-999 justify-center items-center ${
        open ? "flex" : "hidden"
      } `}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        action=""
        className=" border border-white bg-body w-1/2 p-6 rounded"
      >
        <ModalButton type="button" onclick={onClose} />
        <div className="flex gap-3">
          <div className="">
            <label className="text-white">Car Image</label>
            <div className="border border-gray-400 rounded h-64 w-64 overflow-hidden bg-gray-800 mb-2">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No Image Selected
                </div>
              )}
            </div>
            <input
              disabled={isView}
              {...register("car_image")}
              type="file"
              accept="image/*"
              className="text-white text-xs"
            />
            {errors.car_image && (
              <p className="text-red-500 text-sm text-start">
                Please Select an Image
              </p>
            )}
          </div>
          <div className="flex flex-col w-full">
            <div className="flex flex-col w-full">
              <label htmlFor="" className="text-white">
                Brand
              </label>
              <input
                disabled={isView}
                {...register("brand")}
                type="text"
                placeholder="Brand"
                className="placeholder-white border py-4 px-4 border-gray-600 rounded  text-white w-full"
              />
              {errors.brand && (
                <p className="text-red-500 text-sm text-start">
                  Please Input disabled={isView} a Brand
                </p>
              )}
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="" className="text-white">
                Model
              </label>
              <input
                disabled={isView}
                {...register("model")}
                type="text"
                placeholder="Model"
                className="placeholder-white border py-4 px-4 border-gray-600 rounded  text-white w-full"
              />
              {errors.model && (
                <p className="text-red-500 text-sm text-start">
                  Please Input disabled={isView} a Model
                </p>
              )}
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="" className="text-white">
                Type
              </label>
              <input
                disabled={isView}
                {...register("type")}
                type="text"
                placeholder="Type"
                className="placeholder-white border py-4 px-4 border-gray-600 rounded  text-white w-full"
              />
              {errors.type && (
                <p className="text-red-500 text-sm text-start">
                  Please Input disabled={isView} a Type
                </p>
              )}
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="" className="text-white">
                Color
              </label>
              <input
                disabled={isView}
                {...register("color")}
                type="text"
                placeholder="Color"
                className="placeholder-white border py-4 px-4 border-gray-600 rounded  text-white w-full"
              />
              {errors.color && (
                <p className="text-red-500 text-sm text-start">
                  Please Input disabled={isView} a Color
                </p>
              )}
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="" className="text-white">
                plate_number
              </label>
              <input
                disabled={isView}
                {...register("plate_number")}
                type="text"
                placeholder="plate_number"
                className="placeholder-white border py-4 px-4 border-gray-600 rounded  text-white w-full"
              />
              {errors.plate_number && (
                <p className="text-red-500 text-sm text-start">
                  Please Input disabled={isView} a Plate_number
                </p>
              )}
            </div>
            <div className="  mb-3 hidden">
              <label htmlFor="" className="text-start text-white">
                Status
              </label>
              <input
                disabled={isView}
                defaultValue={"Available"}
                {...register("status")}
                type="text"
                className="border py-4 px-4 border-gray-600 rounded placeholder-white text-white w-full "
                placeholder="Available"
              />
            </div>
          </div>
        </div>
        <div className="pt-2">
          <button
            type={isView ? "button" : "submit"}
            onClick={isView ? onClose : undefined}
            disabled={loading}
            className={`flex-1 text-white py-4 cursor-pointer rounded transition-colors w-full ${
              isView
                ? "bg-gray-600 hover:bg-gray-500"
                : "button-color hover:opacity-90"
            }`}
          >
            {loading ? (
              <span className="flex justify-center items-center gap-2">
                {/* Simple inline spinner if you have one, or just text */}
                {isEdit ? "Updating..." : "Adding Vehicle..."}
              </span>
            ) : (
              <>
                {isEdit && "Update Vehicle"}
                {isCreate && "Add Vehicle"}
                {isView && "Close"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default VehicleHistoryForm;
