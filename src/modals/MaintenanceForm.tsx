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
interface MaintenanceFormProps {
  open: boolean;
  onClose: () => void;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ open, onClose }) => {
  const [loading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<{ id: string; plate_no: string }[]>(
    []
  );
  const [selectToggle, setSelectToggle] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(MaintenanceFormSchema),
    shouldUnregister:false,
    mode:"onSubmit",
  });
  

  // onsubmit function to add data
  const onSubmit = useCallback( async (data: MaintenanceFormData) => {
    setIsLoading(true);
    console.log(data);
    const { data: maintenance, error } = await supabase
      .from("maintenance")
      .insert({
       ...data
      })
    
    if (error) {
      setIsLoading(false);
      console.log("Error adding maintenance:", error.message);
      toast.error("Error adding maintenance:" + error.message);
      return;
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

    setIsLoading(false);
    console.log("Maintenance added successfully:", maintenance);
    toast.success("Maintenance added successfully");
    onClose();
    reset();
  }, [onClose, reset]);

  //fetch vehicles to use in select options
  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_no")

      if (error) {
        console.log("Error fetching vehicles:", error.message);
        return;
      }
      setVehicles(data);
    };
    fetchVehicles();
  }, []);

  return (
    <div className={`fixed inset-0 bg-[#032d44]/25 z-999 flex justify-center items-center ${open ? "flex": "hidden"} `}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        onClick={(e) => e.stopPropagation()}
        action=""
        className="border border-gray-400 rounded-xl py-6 px-8 w-full md:w-2/5 bg-sub overflow-y-auto h-full   "
      >
        <ModalButton onclick={onClose} />
        <div className="flex flex-col pb-3 w-full">
          <label htmlFor="" className="text-start text-white">
            Maintenance Date
          </label>
          <input
            {...register("date")}
            className=" text-white border py-4 px-2 border-gray-400 rounded"
            type="date"
            placeholder="Ex:Civic Lx"
          />
          {errors?.date?.message && 
          <p className="text-red-400 text-start text-sm">Please Select a Date</p>
          }
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
        {errors?.car?.message &&
        <p className="text-red-400 text-start text-sm">Please Select a Vehicle</p>
        }
        <div className="flex flex-col gap-1 pt-3 pb-3">
          <label htmlFor="" className="text-start text-white">
            Cost of Maintenance
          </label>
          <input
            {...register("cost_of_maintenance")}
            className="placeholder-white border py-4 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="Ex: 1000 "
          />
          {errors?.cost_of_maintenance?.message && 
          <p className="text-red-400 text-start text-sm">Please Input a Price</p>
          }
        </div>
        <div className="flex flex-col gap-1 pb-3">
          <label htmlFor="" className="text-start text-white">
            Type of Maintenance
          </label>
          <input
            {...register("type_of_maintenance")}
            className="placeholder-white border py-4 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="Ex:Midnight Blue"
          />
           {errors?.type_of_maintenance?.message && 
          <p className="text-red-400 text-start text-sm">Please Input a Type</p>
          }
        </div>
        <div className="flex flex-col gap-1 pb-3">
          <label htmlFor="" className="text-start text-white">
            location
          </label>
          <input
            {...register("location")}
            className="placeholder-white border py-4 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="Ex: Angeles"
          />
           {errors?.location?.message && 
          <p className="text-red-400 text-start text-sm">Please Input a Location</p>
          }
        </div>
        <div className="flex flex-col gap-1 pb-3">
          <label htmlFor="" className="text-start text-white">
            Maintained By
          </label>
          <input
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
        <div className="mt-15 mb- 6">
          <button
          disabled={loading}
            type="submit"
            className="hover:bg-[#4E8EA2] bg-[#1d596b] text-white w-full py-4 rounded cursor-pointer"
          >
            {loading ? "Adding..." : "Add Maintenance"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(MaintenanceForm);
