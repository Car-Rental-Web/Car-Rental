import { useState } from "react";
import { ModalButton } from "../components/CustomButtons";
import type { ModalProps } from "../types/types";
import { useForm } from "react-hook-form";
import { VehicleFormSchema, type VehicleFormData } from "../schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";

const VehicleForm: React.FC<ModalProps> = ({ open, onClose }) => {
  const [loading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(VehicleFormSchema),
  });

  const onAddVehicle = async (data: VehicleFormData) => {
    setIsLoading(true);

    console.log(data);
    const { data: vehicle, error } = await supabase
      .from("vehicle")
      .insert({
        model: data.model,
        brand: data.brand,
        type: data.type,
        color: data.color,
        plate_no: data.plate_no,
      })
      .select()
      .single();

    if (error) {
      console.log("Error adding vehicle:", error.message);
      setIsLoading(false);
      toast.error("Error adding vehicle:" + error.message);
      return;
    }

    console.log("Vehicle added successfully:", vehicle);
    toast.success("Vehicle added successfully");

    setIsLoading(false);
    onClose();
    reset();
  };

  if (!open) return null;
  return (
    <div className="absolute inset-0 bg-gray-400/25 z-999 flex justify-center items-center">
      <form
        onSubmit={handleSubmit(onAddVehicle)}
        action=""
        className="border border-gray-400 rounded-xl py-4 px-8 w-2/5 bg-white"
      >
        <ModalButton onclick={onClose} />
        <div className="flex flex-col mb-3">
          <label htmlFor="" className="text-start">
            Model
          </label>
          <input
            {...register("model")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="Ex:Civic Lx"
          />
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Brand
          </label>
          <input
            {...register("brand")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="Ex:Toyota"
          />
          {errors.brand && (
            <p className="text-red-500 text-sm">{errors.brand.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Type
          </label>
          <input
            {...register("type")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="Ex:Sedan"
          />
          {errors.type && (
            <p className="text-red-500 text-sm">{errors.type.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Color
          </label>
          <input
            {...register("color")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="Ex:Midnight Blue"
          />
          {errors.color && (
            <p className="text-red-500 text-sm">{errors.color.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Plate #
          </label>
          <input
            {...register("plate_no")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="EX:ABC-1234"
          />
          {errors.plate_no && (
            <p className="text-red-500 text-sm">{errors.plate_no.message}</p>
          )}
        </div>
        <div className="mt-15 mb-6">
          <button
            type="submit"
            className="bg-[#696FC7] text-white w-full py-4 rounded cursor-pointer"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
