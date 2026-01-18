import { useForm } from "react-hook-form";
import { RenterFormDataSchema, type RenterFormValues } from "../schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "../utils/UploadFile";
import { supabase } from "../utils/supabase";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { DataVehicleTypes } from "../types/types";
import icons from "../constants/icon";
import getPublicUrl from "../utils/getPublicUrl";
import { ModalButton } from "./CustomButtons";

interface RenterFormProps {
  open: boolean;
  onClose: () => void;
  selectedData: DataVehicleTypes | null;
}

const VehicleRenterForm: React.FC<RenterFormProps> = ({
  open,
  onClose,
  selectedData,
}) => {
  const [selectToggle, setSelectToggle] = useState(false);
  const [renter, setRenter] = useState<
    {
      id: string;
      full_name: string;
      address: string;
      license_number: string;
      philhealth_number: string;
      tin_number: string;
      sss_number: string;
      pagibig_number: string;
    }[]
  >([]);
  const [existingPaths, setExistingPaths] = useState({
    // valid_id: "",
    // agreement_photo: "",
    uploaded_proof: [] as string[],
  });
  const {
    register,
    handleSubmit,
    reset,
    resetField,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RenterFormValues>({
    resolver: zodResolver(RenterFormDataSchema),
    mode: "onSubmit",
  });
  useEffect(() => {
    if (open && selectedData) {
      setValue("car_plate_number", selectedData.plate_number);
      setValue("car_model", selectedData.model);
      setValue("car_type", selectedData.type);
    }
  }, [open, selectedData, setValue]);

  useEffect(() => {
    const fetchRenter = async () => {
      const { data, error } = await supabase.from("renter").select("*");

      if (error) {
        console.log("Failed to Fetched Renters", error);
        return;
      }
      console.log("Fetched Renters", data);
      setRenter(data);
    };
    fetchRenter();
  }, []);

  const selectedRenter = watch("full_name");

  useEffect(() => {
    if (!selectedRenter) {
      setValue("address", "");
      setValue("license_number", "");
      setValue("tin_number", "");
      setValue("philhealth_number", "");
      setValue("sss_number", "");
      setValue("pagibig_number", "");
    }
    const selectedName = renter.find((r) => r.full_name === selectedRenter);
    if (selectedRenter) {
      setValue("address", selectedName?.address || "");
      setValue("license_number", selectedName?.license_number || "");
      setValue("tin_number", selectedName?.tin_number || "");
      setValue("philhealth_number", selectedName?.philhealth_number || "");
      setValue("sss_number", selectedName?.sss_number || "");
      setValue("pagibig_number", selectedName?.pagibig_number || "");
    }
  }, [setValue, selectedRenter, renter]);

  const onSubmit = async (renterData: RenterFormValues) => {
    console.log("Submit triggered!"); // If you don't see this, validation failed

    try {
      let proofPaths: string[] = [];

      // 1. Upload files only if they exist and are a FileList
      if (
        renterData.uploaded_proof instanceof FileList &&
        renterData.uploaded_proof.length > 0
      ) {
        const validFiles = Array.from(renterData.uploaded_proof);

        const uploadPromises = validFiles.map((file) =>
          uploadFile(file as File, "uploaded_proof")
        );

        const uploadResults = await Promise.all(uploadPromises);
        proofPaths = uploadResults.map((res) => res.path);
      }

      // 2. Build the final object for Supabase
      const finalPayload = {
        ...renterData,
        // Replace the FileList with the array of paths for the DB
        uploaded_proof: [...existingPaths.uploaded_proof, ...proofPaths],
      };

      const { error } = await supabase
        .from("renter_booking")
        .insert([finalPayload]);

      if (error) throw error;

      toast.success("Added Rent Successfully");
      reset();
      onClose();
    } catch (err: any) {
      console.error("Error submitting form:", err);
      alert(err.message);
    }
  };
  return (
    <div>
      <div
        className={`fixed inset-0 bg-[#032d44]/25 z-999 justify-center items-center ${
          open ? "flex" : "hidden"
        }`}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className=" h-full overflow-y-auto border border-white bg-body w-1/2 p-6 rounded"
        >
          <ModalButton type="button" onclick={onClose} />
          <div className="flex w-full gap-3">
            <div
              onClick={() => setSelectToggle(!selectToggle)}
              className="flex flex-col gap-1 w-full relative"
            >
              <label htmlFor="" className="text-white">
                Fullname
              </label>
              <select
                {...register("full_name")}
                className="appearance-none peer outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-400  text-white"
              >
                <option value="" className="">
                  Select A Renter
                </option>
                {renter.map((row) => (
                  <option
                    className="txt-color"
                    value={row.full_name}
                    key={row.id}
                  >
                    {row.full_name}
                  </option>
                ))}
              </select>
              <div className="absolute bottom-5 right-4 txt-color flex items-center">
                {selectToggle ? (
                  <icons.up  />
                ) : (
                  <icons.down  />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-white">
                Address
              </label>
              <input
                readOnly
                {...register("address")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white  w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-white">
                License_No.
              </label>
              <input
                readOnly
                {...register("license_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white  w-full"
              />
            </div>
          </div>
          <div className="flex w-full gap-3">
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-white">
                PhilHealth No.
              </label>
              <input
                readOnly
                {...register("philhealth_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white  w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-white">
                Tin No.
              </label>
              <input
                readOnly
                {...register("tin_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white  w-full"
              />
            </div>
          </div>
          <div className="flex w-full gap-3">
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-white">
                SSS No.
              </label>
              <input
                readOnly
                {...register("sss_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white  w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-white">
                Pagibig No.
              </label>
              <input
                readOnly
                {...register("pagibig_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white  w-full"
              />
            </div>
          </div>
          <div className="md:flex  justify-around items-center w-full gap-3">
            <div
              onClick={() => setSelectToggle(!selectToggle)}
              className="flex flex-col w-full relative "
            >
              <label htmlFor="" className="text-start text-white">
                Plate #
              </label>
              <input
                readOnly
                type="text"
                {...register("car_plate_number", { required: true })}
                className="appearance-none peer outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-400  text-white"
              />
              {errors?.car_plate_number?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select A Vehicle{" "}
                </p>
              )}
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="" className=" text-start text-white">
                Model
              </label>
              <input
                readOnly
                {...register("car_model", { required: true })}
                type="text"
                placeholder="Ex:Civic LX"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
              />
              {errors?.car_plate_number?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select A Vehicle
                </p>
              )}
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="" className=" text-start text-white">
                Type
              </label>
              <input
                readOnly
                {...register("car_type", { required: true })}
                type="text"
                placeholder="Ex: Sedan"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
              />
              {errors?.car_plate_number?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select A Vehicle
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full justify-around gap-3">
            <div className="flex flex-col flex-1 w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Start Date
              </label>
              <input
                {...register("start_date", { required: true })}
                type="date"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 w-full "
              />
              {errors?.start_date?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select a Date
                </p>
              )}
            </div>
            <div className="flex flex-col flex-1 w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                End Date
              </label>
              <input
                {...register("end_date", { required: true })}
                type="date"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 w-full "
              />
              {errors?.end_date?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select a Date
                </p>
              )}
            </div>
            <div className="flex flex-col flex-1 w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Duration(days)
              </label>
              <input
                {...register("duration", { required: true })}
                type="text"
                placeholder="Duration"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 w-full "
              />
              {errors?.end_date?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Input a duration
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full justify-around gap-3">
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Pick Up time
              </label>
              <input
                {...register("start_time", { required: true })}
                type="time"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 "
              />
              {errors?.start_time?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select a time
                </p>
              )}
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Drop off Time
              </label>
              <input
                {...register("end_time", { required: true })}
                type="time"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 "
              />
              {errors?.end_time?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select a time
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <div
              onClick={() => setSelectToggle((t) => !t)}
              className="flex relative flex-col w-full gap-1"
            >
              <label htmlFor="" className=" text-start text-white">
                Type of Rent
              </label>
              <select
                {...register("type_of_rent", { required: true })}
                className="border py-4 px-4 border-gray-400 rounded text-white  appearance-none peer outline-none"
              >
                <option value="" className="txt-color">
                  Type of Rent
                </option>
                <option value="Self Drive" className="txt-color">
                  Self Drive
                </option>
                <option value="With Driver" className="txt-color">
                  With Driver
                </option>
              </select>
              <div className="absolute top-12 right-3 txt-color flex items-center">
                {" "}
                {selectToggle ? (
                  <icons.up className="hidden peer-focus:block" />
                ) : (
                  <icons.down className="peer-focus:hidden" />
                )}
              </div>
              {errors?.type_of_rent?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select a type
                </p>
              )}
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Location
              </label>
              <input
                {...register("location", { required: true })}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                placeholder="Ex: Baguio"
              />
              {errors?.location?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please input a location
                </p>
              )}
            </div>
          </div>
          <div className="w-full text-start text-white flex flex-col gap-1">
            <label className="">
              Uploaded pictures of proof the whole transactions{" "}
              <span>(others)</span>
            </label>

            <div className="flex flex-col gap-4 border border-gray-400 py-4 px-4 rounded bg-black/10 min-h-[100px]">
              {/* SECTION A: DATABASE IMAGES (Existing) */}
              {existingPaths.uploaded_proof.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {existingPaths.uploaded_proof.map((path, index) => (
                    <div
                      key={`existing-${index}`}
                      className="relative group w-24 h-24 border border-gray-600 rounded overflow-hidden"
                    >
                      <img
                        src={getPublicUrl("uploaded_proof", path)}
                        alt="Existing Proof"
                        className="w-full h-full object-cover"
                      />
                      {/* is view */}

                      <button
                        type="button"
                        onClick={() => {
                          setExistingPaths((prev) => ({
                            ...prev,
                            uploaded_proof: prev.uploaded_proof.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <icons.trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION B: NEW LOCAL FILES (The one you wanted corrected) */}
              {watch("uploaded_proof") instanceof FileList &&
                watch("uploaded_proof")!.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-700">
                    <p className="w-full text-[10px] text-blue-400 uppercase font-bold">
                      New files to upload:
                    </p>
                    {Array.from(watch("uploaded_proof") as FileList).map(
                      (file, index) => (
                        <div
                          key={`new-${index}`}
                          className="relative group w-20 h-20 border border-blue-500 rounded overflow-hidden"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            className="w-full h-full object-cover"
                          />
                          {/* is view */}
                          <button
                            type="button"
                            onClick={() => resetField("uploaded_proof")}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <icons.trash size={10} />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* SECTION C: THE INPUT & EMPTY STATE */}
              {/* {!isView ? ( */}
              <div className="relative flex items-center mt-2">
                <input
                  {...register("uploaded_proof")}
                  className="text-gray-400 text-xs w-full cursor-pointer"
                  type="file"
                  accept="image/*"
                  multiple
                />
                <icons.upload className="absolute right-0 text-gray-400 pointer-events-none" />
              </div>
              {/* // ) : (
                        //   existingPaths.uploaded_proof.length === 0 && (
                        //     <p className="text-gray-500 text-xs italic text-center">
                        //       No proofs uploaded.
                        //     </p>
                        //   )
                        // )} */}
            </div>
          </div>

          <div
            onClick={() => setSelectToggle((t) => !t)}
            className=" flex relative flex-col w-full gap-1"
          >
            <label htmlFor="" className="text-white text-start">
              Status
            </label>
            <select
              {...register("status", { required: true })}
              className=" appearance-none outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-400  text-white"
            >
              <option value="" className="txt-color">
                Select Status
              </option>
              <option value="On Service" className="txt-color">
                On Service
              </option>
              <option value="On Reservation" className="txt-color">
                On Reservation
              </option>
              <option value="Completed" className="txt-color">
                Completed
              </option>
            </select>
            <div className="absolute top-12 right-3 txt-color">
              {selectToggle ? <icons.up /> : <icons.down />}
            </div>
            {errors?.status?.message && (
              <p className="text-red-400 text-start text-sm ">
                Please Select a Status
              </p>
            )}
          </div>
          <button
            type="submit"
            className="text-white w-full text-center py-4 px-4 bg-blue-500 mt-2 rounded cursor-pointer"
          >
            Add Rent
          </button>
        </form>
      </div>
    </div>
  );
};

export default VehicleRenterForm;
