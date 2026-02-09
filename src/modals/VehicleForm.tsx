/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect } from "react";
import { ModalButton } from "../components/CustomButtons";
import { useForm } from "react-hook-form";
// !!! MAKE SURE YOUR SCHEMA INCLUDES last_registration_date !!!
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
      // --- NEW DEFAULT VALUE ---
      last_registration_date: new Date().toISOString().split("T")[0],
      // -------------------------
    },
  });

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  useEffect(() => {
    if (initialData) {
      // Ensure date format is YYYY-MM-DD for input type="date"
      const formattedData = {
        ...initialData,
        last_registration_date: initialData.last_registration_date
          ? new Date(initialData.last_registration_date)
              .toISOString()
              .split("T")[0]
          : "",
      };
      reset(formattedData);
    } else {
      // Reset to defaults if no initialData
      reset({
        model: "",
        brand: "",
        type: "",
        color: "",
        plate_no: "",
        status: "Available",
        last_registration_date: new Date().toISOString().split("T")[0],
      });
    }
  }, [initialData, reset, open]);

  const onAddVehicle = useCallback(
    async (data: VehicleFormData) => {
      setLoading(true);

      try {
        if (isCreate) {
          const { error } = await supabase.from("vehicle").insert({
            ...data,
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
        toast.error("Operation failed: " + error.message);
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
        className="border border-gray-400 rounded-xl py-4 px-8 w-full md:w-2/5 bg-sub"
      >
        <ModalButton type="button" onclick={onClose} />
        
        {/* ... (Existing fields: Model, Brand, Type, Color, Plate) ... */}
        {/* ... (Ensure all errors check the correct field name, e.g., errors.plate_no) ... */}

        {/* --- NEW FIELD: REGISTRATION DATE --- */}
        <div className="flex flex-col mb-3">
          <label htmlFor="last_registration_date" className="text-start text-white">
            Last Registration Date
          </label>
          <input
            {...register("last_registration_date")}
            disabled={isView}
            className="border py-4 px-4 border-gray-600 rounded bg-transparent text-white w-full"
            type="date"
          />
          {errors.last_registration_date && (
            <p className="text-red-500 text-sm text-start">
              {errors.last_registration_date.message}
            </p>
          )}
        </div>
        {/* ------------------------------------- */}

        <div className="flex flex-col mb-3">
          <label htmlFor="" className="text-start text-white">
            Status
          </label>
          <input
            disabled={isView} // Changed from disabled strictly to allows changing status later
            defaultValue={"Available"}
            {...register("status")}
            type="text"
            className="border py-4 px-4 border-gray-600 rounded bg-transparent text-white w-full"
            placeholder="Available"
          />
        </div>

        <div className="flex gap-4 mt-8 mb-4">
          {!isView && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-white py-4 cursor-pointer rounded border border-gray-400 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          )}

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
                {isEdit ? "Updating..." : "Submitting..."}
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

export default React.memo(VehicleForm);