import { useEffect, useState } from "react";
import { ModalButton } from "../components/CustomButtons";
import icons from "../constants/icon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RenterFormSchema, type BookingFormValues } from "../schema/schema";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";
import { uploadFile } from "../utils/UploadFile";
import React from "react";
import { useLoadingStore } from "../store/useLoading";
import type { DataBookingRow } from "../types/types";
import getPublicUrl from "../utils/getPublicUrl";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "view" | "edit";
  initialData?: DataBookingRow & { id: number };
}

const BookingForm: React.FC<ModalProps> = ({
  open,
  onClose,
  mode,
  initialData,
}) => {
  const [selectToggle, setSelectToggle] = useState(false);
  const [vehicles, setVehicles] = useState<
    { id: string; plate_no: string; model: string; type: string }[]
  >([]);
  const [existingPaths, setExistingPaths] = useState({
    valid_id: "",
    agreement_photo: "",
    uploaded_proof: [] as string[],
  });
  const { loading, setLoading } = useLoadingStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    resetField,
    setValue,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(RenterFormSchema),
    shouldUnregister: false,
    mode: "onSubmit",
    defaultValues: {
      full_name: "",
      address: "",
      license_number: "",
      valid_id: undefined,
      pagibig_number: "",
      sss_number: "",
      tin_number: "",
      philhealth_number: "",
      car_plate_number: "",
      car_type: "",
      car_model: "",
      total_price_rent: "",
      downpayment: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      type_of_rent: "",
      location: "",
      vehicle_left_plate_number: "",
      vehicle_left_model: "",
      vehicle_left_type: "",
      agreement_photo: undefined,
      notes: "",
      uploaded_proof: undefined,
      status: "",
    },
  });
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";
  useEffect(() => {
    if (initialData) {
      setExistingPaths({
        valid_id: initialData.valid_id || "",
        agreement_photo: initialData.agreement_photo || "",
        uploaded_proof: Array.isArray(initialData.uploaded_proof)
          ? initialData.uploaded_proof
          : [],
      });
    } else {
      // Reset for "Add Booking" mode
      setExistingPaths({
        valid_id: "",
        agreement_photo: "",
        uploaded_proof: [],
      });
    }
  }, [initialData]);
  const getDisplayUrl = (
    fieldName: "valid_id" | "agreement_photo",
    bucket: string
  ) => {
    const newFile = watch(fieldName);

    // Priority 1: If user just selected a NEW file, show it
    if (newFile instanceof FileList && newFile.length > 0) {
      return URL.createObjectURL(newFile[0]);
    }

    // Priority 2: If no new file, show the existing path from our state
    const path = existingPaths[fieldName];
    if (path) return getPublicUrl(bucket, path);

    return null;
  };

  useEffect(() => {
    if (initialData && (mode === "view" || mode === "edit")) {
      reset({
        ...initialData,
        valid_id: initialData.valid_id,
        agreement_photo: initialData.agreement_photo,
        uploaded_proof: initialData.uploaded_proof,
      });
    } else if (mode === "create") {
      reset({
        full_name: "",
        address: "",
        license_number: "",
        valid_id: undefined,
        pagibig_number: "",
        sss_number: "",
        tin_number: "",
        philhealth_number: "",
        car_plate_number: "",
        car_type: "",
        car_model: "",
        total_price_rent: "",
        downpayment: "",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        type_of_rent: "",
        location: "",
        vehicle_left_plate_number: "",
        vehicle_left_model: "",
        vehicle_left_type: "",
        agreement_photo: undefined,
        notes: "",
        uploaded_proof: undefined,
        status: "",
      });
    }
  }, [initialData, mode, reset]);

  //fetching vehicle
  useEffect(() => {
    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_no ,model, type")
        .neq("status", "On Maintenance");

      if (error) {
        console.log("Error fetching Vehicles", error);
        return;
      }
      setVehicles(data);
    };
    fetchVehicle();
  }, []);

  // get selectedPlate value from vehicles
  const selectedPlate = watch("car_plate_number");

  useEffect(() => {
    if (!selectedPlate) {
      setValue("car_model", "");
      setValue("car_type", "");
    }
    const selectedVehicle = vehicles.find((v) => v.plate_no === selectedPlate);
    if (selectedVehicle) {
      setValue("car_model", selectedVehicle.model);
      setValue("car_type", selectedVehicle.type);
    }
  }, [selectedPlate, vehicles, setValue]);

  // onSubmit function to add data

  const onSubmit = async (data: BookingFormValues) => {
    setLoading(true);
    try {
      // 1. TRACK DELETED FILES FOR STORAGE CLEANUP (Pre-calculated)
      const deletedFiles: { bucket: string; path: string }[] = [];

      if (initialData?.valid_id && existingPaths.valid_id === "") {
        deletedFiles.push({ bucket: "valid_id", path: initialData.valid_id });
      }
      if (
        initialData?.agreement_photo &&
        existingPaths.agreement_photo === ""
      ) {
        deletedFiles.push({
          bucket: "agreement_photo",
          path: initialData.agreement_photo,
        });
      }

      // 2. HANDLE NEW UPLOADS (Single Files)
      let finalValidId = existingPaths.valid_id;
      if (data.valid_id?.[0] instanceof File) {
        const upload = await uploadFile(data.valid_id[0], "valid_id");
        finalValidId = upload.path;
      }

      let finalAgreementPhoto = existingPaths.agreement_photo;
      if (data.agreement_photo?.[0] instanceof File) {
        const upload = await uploadFile(
          data.agreement_photo[0],
          "agreement_photo"
        );
        finalAgreementPhoto = upload.path;
      }

      // 3. HANDLE MULTIPLE UPLOADS (Proof Array)
      let newProofPaths: string[] = [];
      if (data.uploaded_proof && data.uploaded_proof.length > 0) {
        // ✅ THE FIX: Convert FileList to Array and FILTER out strings/nulls
        // This ensures uploadFile ONLY receives actual File objects
        const validFiles = Array.from(data.uploaded_proof).filter(
          (f) => f instanceof File
        );

        if (validFiles.length > 0) {
          const results = await Promise.all(
            validFiles.map((f) => uploadFile(f as File, "uploaded_proof"))
          );
          newProofPaths = results.map((r) => r.path);
        }
      }

      // Combine existing paths (the ones you didn't delete) with new ones
      const finalProofs = [...existingPaths.uploaded_proof, ...newProofPaths];

      // 4. PREPARE PAYLOAD
      const payload = {
        ...data,
        valid_id: finalValidId,
        agreement_photo: finalAgreementPhoto,
        uploaded_proof: finalProofs,
      };

      // 5. DATABASE OPERATIONS
      if (isCreate) {
        const { error } = await supabase.from("booking").insert(payload);
        if (error) throw error;
        toast.success("Booking created!");
      } else if (isEdit && initialData?.id) {
        const { error } = await supabase
          .from("booking")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;

        // 6. PHYSICAL STORAGE CLEANUP (Only on successful Edit)
        // Cleanup single files
        if (deletedFiles.length > 0) {
          await Promise.all(
            deletedFiles.map((f) =>
              supabase.storage.from(f.bucket).remove([f.path])
            )
          );
        }

        // Calculate which proofs were actually removed from the original list
        const removedProofs = (initialData?.uploaded_proof || []).filter(
          (path: string) => !existingPaths.uploaded_proof.includes(path)
        );

        if (removedProofs.length > 0) {
          await supabase.storage.from("uploaded_proof").remove(removedProofs);
        }

        toast.success("Updated and storage cleaned!");
      }

      // 7. RENTER HISTORY LOGIC
      const { data: renter } = await supabase
        .from("renter")
        .select("id, times_rented")
        .eq("license_number", data.license_number)
        .maybeSingle();

      if (!renter) {
        await supabase.from("renter").insert({
          full_name: data.full_name,
          license_number: data.license_number,
          times_rented: 1,
          notes: data.notes,
        });
      } else if (isCreate) {
        // Only increment if creating a NEW booking
        await supabase
          .from("renter")
          .update({ times_rented: (renter.times_rented || 0) + 1 })
          .eq("id", renter.id);
      }

      reset();
      onClose();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed  inset-0 bg-[#032d44]/25  z-999 flex justify-center items-center ${
        open ? "flex" : "hidden"
      }`}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="h-full overflow-y-auto  border border-gray-400 rounded-xl  w-full md:w-3/5 bg-sub px-8 py-4"
      >
        <div className="flex flex-col gap-5">
          <div>
            <ModalButton onclick={onClose} />
            <p className=" text-start text-white text-primary">
              Renter Information
            </p>
          </div>
          <div className="md:flex w-full justify-around items-center gap-5 ">
            <div className="flex flex-col w-full gap-1 ">
              <label className=" text-start text-white">Fullname</label>
              <input
                disabled={isView}
                {...register("full_name")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                type="text"
                placeholder="Ex:John Doe"
              />
              {errors?.full_name?.message && (
                <p className="text-red-400 text-start text-sm">
                  Please input Fullname
                </p>
              )}
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Address
              </label>
              <input
                disabled={isView}
                {...register("address")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                type="text"
                placeholder="Ex:110 Maligaya St."
              />
              {errors?.address?.message && (
                <p className="text-red-400 text-start text-sm">
                  Please input Address
                </p>
              )}
            </div>
            <div className="xl:flex w-full  gap-5 ">
              <div className="flex flex-col w-full  gap-1 ">
                <label htmlFor="" className=" text-start text-white">
                  License id / Number
                </label>
                <input
                  disabled={isView}
                  {...register("license_number")}
                  className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white  w-full"
                  type="text"
                  placeholder="Ex:N01-23-456789"
                />
                {errors?.license_number?.message && (
                  <p className="text-red-400 text-start text-sm">
                    Please input License #
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-full justify-around items-center gap-5">
            <div className="flex flex-col w-full gap-1 ">
              <label htmlFor="" className=" text-start text-white">
                Pagibig No.
                <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                disabled={isView}
                {...register("pagibig_number")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                SSS No.<span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                disabled={isView}
                {...register("sss_number")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
          </div>
          <div className="flex w-full justify-around items-center gap-5 ">
            <div className="flex flex-col w-full gap-1 ">
              <label htmlFor="" className=" text-start text-white">
                Tin No.<span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                disabled={isView}
                {...register("tin_number")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Philhealth No.
                <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                disabled={isView}
                {...register("philhealth_number")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
          </div>
          <div className="flex flex-col w-full gap-3">
            <p className=" text-start text-white text-primary">Car Rented</p>
            <div className="md:flex  justify-around items-center w-full gap-3">
              <div
                onClick={() => setSelectToggle(!selectToggle)}
                className="flex flex-col w-full relative "
              >
                <label htmlFor="" className="text-start text-white">
                  Plate #
                </label>
                <select
                  disabled={isView}
                  {...register("car_plate_number", { required: true })}
                  className="appearance-none peer outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-400  text-white"
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
                <div className="absolute bottom-5 right-4 txt-color flex items-center">
                  {selectToggle ? (
                    <icons.up className="hidden peer-focus:block" />
                  ) : (
                    <icons.down className="peer-focus:hidden" />
                  )}
                </div>

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
                  disabled={isView}
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
                  disabled={isView}
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
          </div>
          <div className="flex flex-col w-full gap-5">
            <p className=" text-start text-white text-primary">
              Location Visting
            </p>
            <div>
              <div className="flex flex-col gap-5">
                <div className="flex w-full justify-around gap-5">
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Total Price
                    </label>
                    <input
                      disabled={isView}
                      {...register("total_price_rent", { required: true })}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                      placeholder="Ex: 2000"
                    />
                    {errors?.total_price_rent?.message && (
                      <p className="text-red-400 text-start text-sm ">
                        Please Input an amount
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Downpayment
                    </label>
                    <input
                      disabled={isView}
                      {...register("downpayment", { required: true })}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                      placeholder="Ex:1000"
                    />
                    {errors?.downpayment?.message && (
                      <p className="text-red-400 text-start text-sm ">
                        Please Input an amount
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex w-full justify-around gap-5">
                  <div className="flex flex-col flex-1 w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Start Date
                    </label>
                    <input
                      disabled={isView}
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
                      disabled={isView}
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
                </div>
                <div className="flex w-full justify-around gap-5">
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Pick Up time
                    </label>
                    <input
                      disabled={isView}
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
                      disabled={isView}
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
                <div className="flex w-full justify-around gap-5">
                  <div
                    onClick={() => setSelectToggle((t) => !t)}
                    className="flex relative flex-col w-full gap-1"
                  >
                    <label htmlFor="" className=" text-start text-white">
                      Type of Rent
                    </label>
                    <select
                      disabled={isView}
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
                      disabled={isView}
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
              </div>

              <div className="flex flex-col gap-2 w-full pt-5">
                <p className=" text-start text-white text-primary">
                  Vehicle left in the garage of renter
                  <span className="text-sm   text-start  text-white">
                    (optional)
                  </span>
                </p>
                <div className="flex flex-col gap-5">
                  <div className="md:flex w-full gap-5">
                    <div className="flex flex-col w-full gap-1">
                      <label htmlFor="" className=" text-start text-white">
                        Plate #
                      </label>
                      <input
                        disabled={isView}
                        {...register("vehicle_left_plate_number")}
                        type="text"
                        className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                        placeholder="Ex:ABC-1234"
                      />
                    </div>
                    <div className="flex flex-col w-full gap-1">
                      <label htmlFor="" className=" text-start text-white">
                        Model
                      </label>
                      <input
                        disabled={isView}
                        {...register("vehicle_left_model")}
                        type="text"
                        className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                        placeholder="Ex:Civic LX"
                      />
                    </div>
                    <div className="flex flex-col w-full gap-1  ">
                      <label htmlFor="" className=" text-start text-white">
                        Type
                      </label>
                      <input
                        disabled={isView}
                        {...register("vehicle_left_type")}
                        className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white w-full "
                        type="text"
                        placeholder="Ex: Sedan"
                      />
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="" className=" text-start text-white">
                        Notes
                      </label>
                      <textarea
                        {...register("notes")}
                        className="appearance-none outline-none border border-gray-400 rounded placeholder-gray-400  px-4 py-4 text-white"
                        placeholder="Ex: Renter is on time"
                      ></textarea>
                    </div>
                    <label htmlFor="" className="text-start text-white">
                      Photos
                    </label>
                    <div className="md:flex w-full gap-2">
                      <div className="flex flex-col  gap-1 w-full">
                        <label htmlFor="" className=" text-start text-white">
                          Valid id
                        </label>
                        <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded placeholder-gray-400 text-white w-full">
                          {getDisplayUrl("valid_id", "valid_id") ? (
                            <div className="relative w-full h-40 border border-gray-600 rounded overflow-hidden bg-gray-900">
                              <img
                                src={getDisplayUrl("valid_id", "valid_id")!}
                                className="w-full h-full object-contain"
                              />

                              {/* REMOVE BUTTON: Only show if NOT in View mode */}
                              {!isView && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExistingPaths((prev) => ({
                                      ...prev,
                                      valid_id: "",
                                    })); // Clear state
                                    resetField("valid_id"); // Clear the <input>
                                  }}
                                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                                >
                                  <icons.trash size={16} />
                                </button>
                              )}
                            </div>
                          ) :( <div className="w-full h-40 flex flex-col items-center justify-center border border-dashed border-gray-600 rounded bg-black/20 mb-2">
                              <p className="text-gray-500 text-xs italic">
                                No valid id uploaded
                              </p>
                            </div>)}

                          {/* INPUT: Only show if adding/editing */}
                          {!isView && (
                            <input
                              type="file"
                              {...register("valid_id")}
                              className="text-gray-600 w-full"
                              accept="image/*"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col  gap-1 w-full  ">
                        <label htmlFor="" className=" text-start text-white">
                          Agreement <span>(photo)</span>
                        </label>
                        <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded placeholder-gray-400 text-white w-full">
                          {getDisplayUrl(
                            "agreement_photo",
                            "agreement_photo"
                          ) ? (
                            <div className="relative w-full h-40 border border-gray-600 rounded overflow-hidden bg-gray-900">
                              <img
                                src={
                                  getDisplayUrl(
                                    "agreement_photo",
                                    "agreement_photo"
                                  )!
                                }
                                className="w-full h-full object-contain"
                              />

                              {/* REMOVE BUTTON: Only show if NOT in View mode */}
                              {!isView && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExistingPaths((prev) => ({
                                      ...prev,
                                      agreement_photo: "",
                                    })); // Clear state
                                    resetField("agreement_photo"); // Clear the <input>
                                  }}
                                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                                >
                                  <icons.trash size={16} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-40 flex flex-col items-center justify-center border border-dashed border-gray-600 rounded bg-black/20 mb-2">
                              <p className="text-gray-500 text-xs italic">
                                No agreement photo uploaded
                              </p>
                            </div>
                          )}

                          {/* INPUT: Only show if adding/editing */}
                          {!isView && (
                            <input
                              type="file"
                              {...register("agreement_photo")}
                              className="text-gray-600 w-full"
                              accept="image/*"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full  text-start text-white flex flex-col gap-1">
                      <label htmlFor="" className="">
                        Uploaded pictures of proof the whole transactions{" "}
                        <span>(others)</span>
                      </label>
                      <div className="flex flex-col gap-4 border border-gray-400 py-4 px-4 rounded bg-black/10 min-h-[100px]">
                        {/* SECTION A: DATABASE IMAGES (Shows on View and Edit) */}
                        {existingPaths.uploaded_proof.length > 0 ? (
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
                                {!isView && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExistingPaths((prev) => ({
                                        ...prev,
                                        uploaded_proof:
                                          prev.uploaded_proof.filter(
                                            (_, i) => i !== index
                                          ),
                                      }));
                                    }}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <icons.trash size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          isView && (
                            <p className="text-gray-500 text-xs italic text-center">
                              No proofs uploaded.
                            </p>
                          )
                        )}

                        {/* SECTION B: NEW LOCAL FILES (Shows only when user picks new files) */}
                        {watch("uploaded_proof") instanceof FileList &&
                          watch("uploaded_proof")!.length > 0 && (
                            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-700">
                              <p className="w-full text-[10px] text-blue-400 uppercase font-bold">
                                New files to upload:
                              </p>
                              {Array.from(
                                watch("uploaded_proof") as FileList
                              ).map((file, index) => (
                                <div
                                  key={`new-${index}`}
                                  className="relative w-20 h-20 border border-blue-500 rounded overflow-hidden"
                                >
                                  <img
                                    src={URL.createObjectURL(file)}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                        {/* SECTION C: THE INPUT */}
                        {!isView && (
                          <div className="relative flex items-center mt-2">
                            <input
                              {...register("uploaded_proof")}
                              className="text-gray-400 text-xs w-full cursor-pointer"
                              type="file"
                              accept="image/*"
                              multiple
                            />
                            <icons.upload className="absolute right-0 text-gray-400" />
                          </div>
                        )}
                      </div>
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
                      disabled={isView}
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
                      {/* <option value="Completed" className="txt-color">Completed</option> */}
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
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default React.memo(BookingForm);
