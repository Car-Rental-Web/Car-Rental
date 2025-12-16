import { useForm } from "react-hook-form";
import { ModalButton } from "../components/CustomButtons";
import icons from "../constants/icon";
import {
  MaintenanceFormSchema,
  type MaintenanceFormData,
} from "../schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../utils/supabase";
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
  });

  const onAddMaintenance = async (data: MaintenanceFormData) => {
    setIsLoading(true);
    console.log(data);
    const { data: maintenance, error } = await supabase
      .from("maintenance")
      .insert({
        date: data.date,
        car: data.car,
        type_of_maintenance: data.type_of_maintenance,
        cost_of_maintenance: data.cost_of_maintenance,
        location: data.location,
        maintained_by: data.maintained_by,
        status: data.status,
      })
      .select()
      .single();

    if (error) {
      setIsLoading(false);
      console.log("Error adding maintenance:", error.message);
      toast.error("Error adding maintenance:" + error.message);
      return;
    }

    const { data: updateVehicle, error: errorUpdate } = await supabase
      .from("vehicle")
      .update({ status: "On Maintenance" })
      .eq("plate_no", data.car);

    if (errorUpdate) {
      setIsLoading(false);
      console.log("Update error:", errorUpdate);
      return
    }
    setIsLoading(true);
    console.log("Update Succesfully:", updateVehicle);

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
    <div className="fixed inset-0 bg-[#032d44]/25 z-999 flex justify-center items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onAddMaintenance)(e);
        }}
        onClick={(e) => e.stopPropagation()}
        action=""
        className="border border-gray-400 rounded-xl py-6 px-8 w-2/5 bg-sub overflow-y-auto h-full  "
      >
        <ModalButton onclick={onClose} />
        <div className="flex flex-col mb-3 w-full">
          <label htmlFor="" className="text-start text-white">
            Maintenance Date
          </label>
          <input
            {...register("date")}
            className=" text-white border py-2 px-2 border-gray-400 rounded"
            type="date"
            placeholder="Ex:Civic Lx"
          />
        </div>
        <div
          onClick={() => setSelectToggle(!selectToggle)}
          className="flex flex-col gap-1 mb-3 relative"
        >
          <label htmlFor="" className="text-start text-white">
            Registered Vehicles
          </label>
          <select
            {...register("car")}
            className="appearance-none outline-none border py-2 px-2 border-gray-400 rounded text-white"
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
        <div className="flex flex-col gap-1 mb-3">
          <label htmlFor="" className="text-start text-white">
            Cost of Maintenance
          </label>
          <input
            {...register("cost_of_maintenance")}
            className="placeholder-white border py-2 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="Ex:Sedan"
          />
        </div>
        <div className="flex flex-col gap-1 mb-3">
          <label htmlFor="" className="text-start text-white">
            Type of Maintenance
          </label>
          <input
            {...register("type_of_maintenance")}
            className="placeholder-white border py-2 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="Ex:Midnight Blue"
          />
        </div>
        <div className="flex flex-col gap-1 mb-3">
          <label htmlFor="" className="text-start text-white">
            location
          </label>

          <input
            {...register("location")}
            className="placeholder-white border py-2 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="EX:ABC-1234"
          />
        </div>
        <div className="flex flex-col gap-1 mb-3">
          <label htmlFor="" className="text-start text-white">
            Maintained By
          </label>
          <input
            {...register("maintained_by")}
            className="placeholder-white border py-2 px-2 border-gray-400 rounded text-white"
            type="text"
            placeholder="EX:ABC-1234"
          />
          {errors.maintained_by && (
            <p className="text-red-500 text-sm">
              {errors.maintained_by.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 mb-3">
          <label htmlFor="" className="text-start text-white">
            Status
          </label>
          <input
            defaultValue={"On Maintenance"}
            {...register("status")}
            disabled
            className="placeholder-white  text-white border py-2 px-2 border-gray-400 rounded"
            type="text"
            placeholder="EX:ABC-1234"
          />
        </div>
        <div className="mt-15 mb-6">
          <button
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

export default MaintenanceForm;
