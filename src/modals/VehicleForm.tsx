/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect } from "react";
import { ModalButton } from "../components/CustomButtons";
import { useForm } from "react-hook-form";
import { VehicleFormSchema, type VehicleFormData } from "../schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";
import React from "react";
import { useLoadingStore } from "../store/useLoading";
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  initialData?: VehicleFormData & { id?: number };
}
const VehicleForm: React.FC<ModalProps> = ({
  open,
  onClose,
  mode,
  initialData,
}) => {
  const { loading, setLoading } = useLoadingStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(VehicleFormSchema),
    mode: "onSubmit",
    shouldUnregister: false,
    defaultValues: {
      model: "",
      brand: "",
      type: "",
      color: "",
      plate_no: "",
      status: "Available",
    },
  });

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onAddVehicle = useCallback(
    async (data: VehicleFormData) => {
      setLoading(true);

      try {
        if (isCreate) {
          const { error } = await supabase.from("vehicle").insert({
            data,
          });
          if (error) throw error;
          toast.success("Vehicle Added Successfully");
        }
        if (isEdit && initialData?.id) {
          const hasChanges = Object.keys(data).some(
            (key) =>
              data[key as keyof typeof data] !==
              initialData[key as keyof typeof initialData]
          );
          if (!hasChanges) {
            toast.info("No changes to update");
            return;
          }
          const { error } = await supabase
            .from("vehicle")
            .update({
              ...data,
            })
            .eq("id", initialData?.id);
          if (error) throw error;
          toast.success("Vehicle Updated Successfully");
        }
        onClose();
        reset();
      } catch (error: any) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
    },
    [reset, onClose, setLoading, isCreate, isEdit, initialData]
  );

  return (
    <div
      className={`fixed inset-0 bg-[#032d44]/25 z-999 justify-center items-center ${
        open ? "flex" : "hidden"
      } `}
    >
      <form
        onSubmit={handleSubmit(onAddVehicle)}
        action=""
        className="border border-gray-400 rounded-xl py-4 px-8  w-full md:w-2/5 bg-sub "
      >
        <ModalButton onclick={onClose} />
        <div className="flex flex-col  mb-3">
          <label htmlFor="" className="text-start text-white">
            Model
          </label>
          <input
            {...register("model")}
            disabled={isView}
            className="border py-4 px-4 border-gray-600 rounded placeholder-white text-white  w-full"
            type="text"
            placeholder="Ex:Civic Lx"
          />
          {errors.brand && (
            <p className="text-red-500 text-sm text-start">
              Please Input a Model
            </p>
          )}
        </div>
        <div className="flex flex-col  mb-3">
          <label htmlFor="" className="text-start text-white">
            Brand
          </label>
          <input
            disabled={isView}
            {...register("brand")}
            className="border py-4 px-4 border-gray-600 rounded placeholder-white text-white w-full"
            type="text"
            placeholder="Ex:Toyota"
          />
          {errors.brand && (
            <p className="text-red-500 text-sm text-start">
              Please Input a Brand
            </p>
          )}
        </div>
        <div className="flex flex-col  mb-3">
          <label htmlFor="" className="text-start text-white">
            Type
          </label>
          <input
            disabled={isView}
            {...register("type")}
            className="border py-4 px-4 border-gray-600 rounded placeholder-white text-white w-full"
            type="text"
            placeholder="Ex:Sedan"
          />
          {errors.brand && (
            <p className="text-red-500 text-sm text-start">
              Please Input a Type
            </p>
          )}
        </div>
        <div className="flex flex-col  mb-3">
          <label htmlFor="" className="text-start text-white">
            Color
          </label>
          <input
            disabled={isView}
            {...register("color")}
            className="border py-4 px-4 border-gray-600 rounded placeholder-white text-white w-full"
            type="text"
            placeholder="Ex:Midnight Blue"
          />
          {errors.brand && (
            <p className="text-red-500 text-sm text-start">
              Please Input a Color
            </p>
          )}
        </div>
        <div className="flex flex-col  mb-3">
          <label htmlFor="" className="text-start text-white">
            Plate #
          </label>
          <input
            disabled={isView}
            {...register("plate_no")}
            className="border py-4 px-4 border-gray-600 rounded placeholder-white text-white w-full "
            type="text"
            placeholder="EX:ABC-1234"
          />
          {errors.brand && (
            <p className="text-red-500 text-sm text-start">
              Please Input a Plate #
            </p>
          )}
        </div>
        <div className="flex flex-col  mb-3">
          <label htmlFor="" className="text-start text-white">
            Status
          </label>
          <input
            disabled
            defaultValue={"Available"}
            {...register("status")}
            type="text"
            className="border py-4 px-4 border-gray-600 rounded placeholder-white text-white w-full"
            placeholder="Available"
          />
        </div>
        <div className="mt-15 mb-6">
          <button
            disabled={loading}
            type="submit"
            className="bg-border text-white w-full py-4 rounded cursor-pointer"
          >
            {loading
              ? isEdit
                ? "Updating..."
                : "Submitting"
              : isEdit
              ? "Update Vehicle"
              : isView
              ? "Close"
              : "Add Vehicle"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(VehicleForm);
