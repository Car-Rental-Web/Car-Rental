import { useForm } from "react-hook-form";
import { ModalButton } from "../components/CustomButtons";
import icons from "../constants/icon";
import {
  MaintenanceFormSchema,
  type MaintenanceFormData,
} from "../schema/schema";
import type { ModalProps } from "../types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../utils/supabase";

const MaintenanceForm: React.FC<ModalProps> = ({ open, onClose }) => {
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
  });


  const onAddMaintenance = async (data: MaintenanceFormData) => {
    setIsLoading(true);
    console.log(data);
    const { data: maintenance, error } = await supabase
      .from("maintenance")
      .insert({
        date: data.date,
        car: data.car,
        type_of_maintenance: data.typeOfMaintenance,
        cost_of_maintenance: data.costOfMaintenance,
        location: data.location,
        maintained_by: data.maintainedBy,
        status: data.status
      })
      .select()
      .single();
      

    if (error) {
      setIsLoading(false);
      console.log("Error adding maintenance:", error.message);
      toast.error("Error adding maintenance:" + error.message);
      return;
    }

    const {data:updateVehicle, error: errorUpdate} = await supabase
      .from("vehicle")
      .update({status: "On Maintenance"})
      .eq("id", data.car)

      if(errorUpdate) {
        setIsLoading(false)
        console.log("Update error:", errorUpdate)
      }
      setIsLoading(true)
      console.log("Update Succesfully:", updateVehicle)

    setIsLoading(false);
    console.log("Maintenance added successfully:", maintenance);
    toast.success("Maintenance added successfully");
    onClose();
    reset();
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_no");

      if (error) {
        console.log("Error fetching vehicles:", error.message);
        return;
      }
      setVehicles(data);
    };
    fetchVehicles();
  }, []);

  if (!open) return null;
  return (
    <div className="absolute inset-0 bg-gray-400/25 z-999 flex justify-center items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onAddMaintenance)(e);
        }}
        onClick={(e) => e.stopPropagation()}
        action=""
        className="border border-gray-400 rounded-xl py-4 px-8 w-2/5 bg-white"
      >
        <ModalButton onclick={onClose} />
        <div className="flex flex-col mb-3">
          <label htmlFor="" className="text-start">
            Maintenance Date
          </label>
          <input
            {...register("date")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="date"
            placeholder="Ex:Civic Lx"
          />
        </div>
        <div
          onClick={() => setSelectToggle(!selectToggle)}
          className="flex flex-col gap-2 mb-3 relative"
        >
          <label htmlFor="" className="text-start">
            Registered Vehicles
          </label>
          <select
            {...register("car")}
            className="appearance-none outline-none border py-4 px-4 border-gray-400 rounded"
          >
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plate_no}
              </option>
            ))}
          </select>
          {selectToggle ? (
            <icons.up className="absolute top-13 right-4 text-[#696FC7]" />
          ) : (
            <icons.down className="absolute top-13 right-4 text-[#696FC7]" />
          )}
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Cost of Maintenance
          </label>
          <input
            {...register("costOfMaintenance")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="Ex:Sedan"
          />
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Type of Maintenance
          </label>
          <input
            {...register("typeOfMaintenance")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="Ex:Midnight Blue"
          />
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            location
          </label>

          <input
            {...register("location")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="EX:ABC-1234"
          />
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Maintained By
          </label>
          <input
            {...register("maintainedBy")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="EX:ABC-1234"
          />
          {errors.maintainedBy && (
            <p className="text-red-500 text-sm">
              {errors.maintainedBy.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 mb-3">
           <label htmlFor="" className="text-start">
            Status
          </label>
          <input
          defaultValue={"On Maintenance"}
            {...register("status")}
            className="border py-4 px-4 border-gray-400 rounded"
            type="text"
            placeholder="EX:ABC-1234"
          />
        </div>
        <div className="mt-15 mb-6">
          <button
            type="submit"
            className="bg-[#696FC7] text-white w-full py-4 rounded cursor-pointer"
          >
            {loading ? "Adding..." : "Add Maintenance"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;
