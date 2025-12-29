/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from "react-hook-form";
import { ModalButton } from "../components/CustomButtons";
import icons from "../constants/icon";
import {
  MaintenanceFormSchema,
  type MaintenanceFormData,
} from "../schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../utils/supabase";
import React from "react";
import { useLoadingStore } from "../store/useLoading";
import type { MaintenanceFormValues } from "../types/types";
interface MaintenanceFormProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  initialData?: MaintenanceFormValues & { id?: number };
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  open,
  onClose,
  mode,
  initialData,
}) => {
  const [vehicles, setVehicles] = useState<{ id: string; plate_no: string }[]>(
    []
  );
  const [selectToggle, setSelectToggle] = useState(false);
  const { loading, setLoading } = useLoadingStore();
  const [vehicleLoaded, setVehicleLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(MaintenanceFormSchema),
    shouldUnregister: false,
    mode: "onSubmit",
    defaultValues: {
      date: "",
      car: "",
      cost_of_maintenance: "",
      type_of_maintenance: "",
      location: "",
      maintained_by: "",
      status: "On Maintenance",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, vehicleLoaded, reset]);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  // onsubmit function to add data
  const onSubmit = useCallback(
    async (data: MaintenanceFormData) => {
      setLoading(true);

      try {
        if (isCreate) {
          const { error } = await supabase.from("maintenance").insert(data);
          if (error) throw error;
          toast.success("Maintenance added successfully");
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
            .from("maintenance")
            .update(data)
            .eq("id", initialData.id);

          if (error) throw error;
          toast.success("Maintenance updated successfully");
        }
        // update vehicle status if on maintenance

        // const { data: updateVehicle, error: errorUpdate } = await supabase
        //   .from("vehicle")
        //   .update({ status: "On Maintenance" })
        //   .eq("plate_no", data.car);

        // if (errorUpdate) {
        //   setIsLoading(false);
        //   console.log("Update error:", errorUpdate);
        //   return
        // }
        // setIsLoading(true);
        // console.log("Update Succesfully:", updateVehicle);
        onClose();
        reset();
      } catch (error: Error | any) {
        toast.error(error.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [isCreate, isEdit, initialData, onClose, reset, setLoading]
  );

  //fetch vehicles to use in select options
  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_no");

      if (error) {
        console.log("Error fetching vehicles:", error.message);
        return;
      }
      setVehicleLoaded(true);
      setVehicles(data);
    };
    fetchVehicles();
  }, []);

  return (
    <div
      className={`fixed inset-0 bg-[#032d44]/25 z-999 flex justify-center items-center ${
        open ? "flex" : "hidden"
      } `}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        onClick={(e) => e.stopPropagation()}
        action=""
        className="border border-gray-400 rounded-xl py-6 px-8 w-full md:w-2/5 bg-sub overflow-y-auto h-full   "
      >
        <ModalButton type="button" onclick={onClose} />
        <div className="flex flex-col pb-3 w-full">
          <label htmlFor="" className="text-start text-white">
            Maintenance Date
          </label>
          <input
            {...register("date")}
            disabled={isView}
            className=" text-white border py-4 px-2 border-gray-400 rounded"
            type="date"
            placeholder="Ex:Civic Lx"
          />
          {errors?.date?.message && (
            <p className="text-red-400 text-start text-sm">
              Please Select a Date
            </p>
          )}
        </div>
        <div
          onClick={() => setSelectToggle(!selectToggle)}
          className="flex flex-col gap-1  relative"
        >
          <label htmlFor="" className="text-start text-white">
            Registered Vehicles
          </label>
          <select
            {...register("car")}
            disabled={isView}
            className="appearance-none outline-none border py-4 px-2 border-gray-400 rounded text-white"
          >
            <option value="" className="txt-color">
              Select Vehicle
            </option>
            {vehicles.map((vehicle) => (
              <option
                className="txt-color"
                key={vehicle.id}
                value={vehicle.plate_no}
              >
                {vehicle.plate_no}
              </option>
            ))}
          </select>
          {selectToggle ? (
            <icons.up className="absolute top-13 right-4 txt-color" />
          ) : (
            <icons.down className="absolute top-13 right-4 txt-color" />
          )}
        </div>
        {errors?.car?.message && (
          <p className="text-red-400 text-start text-sm">
            Please Select a Vehicle
          </p>
        )}
        <div className="flex flex-col gap-1 pt-3 pb-3">
          <label htmlFor="" className="text-start text-white">
            Cost of Maintenance
          </label>
          <input
            disabled={isView}
            {...register("cost_of_maintenance")}
            className="placeholder-white border py-4 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="Ex: 1000 "
          />
          {errors?.cost_of_maintenance?.message && (
            <p className="text-red-400 text-start text-sm">
              Please Input a Price
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 pb-3">
          <label htmlFor="" className="text-start text-white">
            Type of Maintenance
          </label>
          <input
            disabled={isView}
            {...register("type_of_maintenance")}
            className="placeholder-white border py-4 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="Ex:Midnight Blue"
          />
          {errors?.type_of_maintenance?.message && (
            <p className="text-red-400 text-start text-sm">
              Please Input a Type
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 pb-3">
          <label htmlFor="" className="text-start text-white">
            location
          </label>
          <input
            disabled={isView}
            {...register("location")}
            className="placeholder-white border py-4 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="Ex: Angeles"
          />
          {errors?.location?.message && (
            <p className="text-red-400 text-start text-sm">
              Please Input a Location
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 pb-3">
          <label htmlFor="" className="text-start text-white">
            Maintained By
          </label>
          <input
            disabled={isView}
            {...register("maintained_by")}
            className="placeholder-white border py-4 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="Ex: Nicko"
          />
          {errors.maintained_by && (
            <p className="text-red-400 text-sm text-start">
              Please Input Maintained By
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 ">
          <label htmlFor="" className="text-start text-white">
            Status
          </label>
          <input
            defaultValue={"On Maintenance"}
            {...register("status")}
            disabled
            className="placeholder-white  text-white border py-4 px-2 border-gray-400 rounded"
            type="text"
            placeholder="EX:ABC-1234"
          />
        </div>
        <div className="flex gap-4 mt-8 mb-4">
          {/* Cancel Button - Only show if NOT in View mode */}
          {!isView && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-white py-4 cursor-pointer rounded border border-gray-400 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          )}

          {/* Main Action Button */}
          <button
            type={isView ? "button" : "submit"}
            onClick={isView ? onClose : undefined}
            disabled={loading}
            className={`flex-1 text-white py-4 cursor-pointer rounded transition-colors ${
              isView
                ? "bg-gray-600 hover:bg-gray-500"
                : "button-color hover:opacity-90"
            }`}
          >
            {loading ? (
              <span className="flex justify-center items-center gap-2">
                {/* Simple inline spinner if you have one, or just text */}
                {isEdit ? "Updating..." : "Submitting..."}
              </span>
            ) : (
              <>
                {isEdit && "Update Booking"}
                {isCreate && "Add Booking"}
                {isView && "Close"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(MaintenanceForm);
