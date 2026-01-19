import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RenterFormDataSchema, type RenterFormValues } from "../schema/schema";
import { supabase } from "../utils/supabase";
import type { DataRenterHistoryProps } from "../types/types";
import { useEffect, useState } from "react";
import { ModalButton } from "./CustomButtons";
import icons from "../constants/icon";
import { uploadFile } from "../utils/UploadFile";
import getPublicUrl from "../utils/getPublicUrl";
import { toast } from "react-toastify";
import RenterAgreement from "./RenterAgreement";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RenterAgreementPDF } from "./RenterAgreementPDF";

interface RenterFormProps {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "view" | "edit";
  selectedData: DataRenterHistoryProps | null;
  onSuccess?: () => void;
}
const RenterForm: React.FC<RenterFormProps> = ({
  selectedData,
  open,
  onClose,
  mode,
  onSuccess,
}) => {
  const [selectToggle, setSelectToggle] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [vehicles, setVehicles] = useState<
    { id: string; plate_number: string; model: string; type: string }[]
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

  const isReadOnly = mode === "view";
  // for agreement
  const watchedName = watch("full_name");
  const watchedSignature = watch("e_signature");
  // for selection of vehicle
  const selectedPlate = watch("car_plate_number");
  useEffect(() => {
    if (!selectedPlate) {
      setValue("car_model", "");
      setValue("car_type", "");
    }
    const selectedVehicle = vehicles.find(
      (v) => v.plate_number === selectedPlate,
    );
    if (selectedVehicle) {
      setValue("car_model", selectedVehicle.model);
      setValue("car_type", selectedVehicle.type);
    }
  }, [selectedPlate, vehicles, setValue]);
  //fetch vehicle
  useEffect(() => {
    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_number, model, type");
      // .neq("status", "On Maintenance");

      if (error) {
        console.log("Error fetching Vehicles", error);
        return;
      }
      setVehicles(data);
    };
    fetchVehicle();
  }, []);

  //print

  // data
  useEffect(() => {
    if (selectedData) {
      reset({
        full_name: selectedData.full_name,
        address: selectedData.address,
        license_number: selectedData.license_number,
        philhealth_number: selectedData.philhealth_number,
        tin_number: selectedData.tin_number,
        sss_number: selectedData.sss_number,
        pagibig_number: selectedData.pagibig_number,
        car_plate_number: selectedData.car_plate_number,
        car_model: selectedData.car_model,
        car_type: selectedData.car_type,
        start_date: selectedData.start_date,
        end_date: selectedData.end_date,
        start_time: selectedData.start_time,
        end_time: selectedData.end_time,
        duration: selectedData.duration,
        type_of_rent: selectedData.type_of_rent,
        location: selectedData.location,
        status: selectedData.status,
        e_signature: selectedData.e_signature,
      });
    }
    if (selectedData?.uploaded_proof) {
      setExistingPaths({
        uploaded_proof: Array.isArray(selectedData.uploaded_proof)
          ? selectedData.uploaded_proof
          : [],
      });
    }
  }, [selectedData, reset]);

  const onSubmit = async (renterData: RenterFormValues) => {
    if (mode === "view") {
      onClose();
      return;
    }

    try {
      let finalProofArray: string[] = [...existingPaths.uploaded_proof];

      // 1. Process New Uploads
      // We check if it's a FileList and has items
      if (
        renterData.uploaded_proof instanceof FileList &&
        renterData.uploaded_proof.length > 0
      ) {
        const validFiles = Array.from(renterData.uploaded_proof);
        const uploadPromises = validFiles.map((file) =>
          uploadFile(file as File, "uploaded_proof"),
        );

        const uploadResults = await Promise.all(uploadPromises);
        const newPaths = uploadResults.map((res) => res.path);

        // Merge existing paths with the new ones
        finalProofArray = [...finalProofArray, ...newPaths];
      }

      // 2. Prepare the clean payload
      // We explicitly overwrite the fields that are problematic (Files/FileLists)
      const cleanPayload = {
        ...renterData,
        uploaded_proof: finalProofArray, // Ensure this is a simple string[]
        e_signature: selectedData?.e_signature || renterData.e_signature, // Handle as string URL
      };

      // Remove the e_signature if it's still a FileList object to prevent JSON errors
      if (cleanPayload.e_signature instanceof FileList) {
        // You should handle the signature upload similar to the proof upload
        // For now, let's ensure it's not a FileList object
        delete (cleanPayload as any).e_signature;
      }

      if (mode === "edit") {
        const { error } = await supabase
          .from("renter_booking")
          .update(cleanPayload)
          .eq("id", selectedData?.id);
        if (error) throw error;
        toast.success("Updated successfully");
        if (onSuccess) onSuccess();
      } else {
        const { error } = await supabase
          .from("renter_booking")
          .insert([cleanPayload]);

        if (error) throw error;
        toast.success("Added Rent Successfully");
        reset();
      }
      onClose();
    } catch (err: any) {
      console.error("Error submitting form:", err);
      toast.error(err.message);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`fixed inset-0 bg-[#032d44]/25 z-999 justify-center items-center py-4 ${
        open ? "flex" : "hidden"
      }`}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className=" h-full overflow-y-auto border border-white bg-body w-full md:w-1/2 p-6 rounded"
      >
        <ModalButton type="button" onclick={onClose} />
        <div className="flex w-full gap-3">
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="" className="text-white">
              Fullname
            </label>
            <input
              readOnly
              {...register("full_name")}
              type="text"
              placeholder="fullname"
              className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white  w-full"
            />
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
            <select
              disabled={isReadOnly}
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
                  value={vehicle.plate_number}
                >
                  {vehicle.plate_number}
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
        <div className=" xl:flex w-full justify-around gap-3">
          <div className="flex flex-col flex-1 w-full gap-1">
            <label htmlFor="" className=" text-start text-white">
              Start Date
            </label>
            <input
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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
        <button type="button" onClick={() => setShowSignature(!showSignature)} className="text-white p-2 border border-gray-200 rounded cursor-pointer mt-2 mb-2">
         {showSignature ? "Hide Signature" : "Show Signature"}
        </button>
        <div className="flex flex-col gap-2 border p-4 rounded bg-gray-800/50">
          <label className="text-sm text-gray-400">Renter Signature</label>

          {/* Show current signature from Supabase if it exists */}
          {showSignature && selectedData?.e_signature && (
            <div>
              <div className="mb-2">
                <p className="text-[10px] text-blue-400 uppercase mb-1">
                  Current Signature:
                </p>
                <img
                  src={selectedData.e_signature}
                  alt="Signature Preview"
                  className="h-20 object-contain bg-white rounded p-2"
                />
              </div>
              {/* File input for UPDATING or NEW signatures */}
              <input
                {...register("e_signature")}
                disabled={isReadOnly}
                type="file"
                className="text-xs text-gray-300"
                accept="image/*"
              />
            </div>
          )}
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
                            (_, i) => i !== index,
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
                <div
                  aria-disabled={isReadOnly}
                  className="flex flex-wrap gap-3 pt-2 border-t border-gray-700"
                >
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
                    ),
                  )}
                </div>
              )}

            {/* SECTION C: THE INPUT & EMPTY STATE */}
            {mode !== "view" ? (
            <div className="relative flex items-center mt-2">
              <input
                disabled={isReadOnly}
                {...register("uploaded_proof")}
                className="text-gray-400 text-xs w-full cursor-pointer"
                type="file"
                accept="image/*"
                multiple
              />
              <icons.upload className="absolute right-0 text-gray-400 pointer-events-none" />
            </div>
            ) : (
                           existingPaths.uploaded_proof.length === 0 && (
                            <p className="text-gray-500 text-xs italic text-center">
                               No proofs uploaded.
                             </p>
                           )
                         )} 
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
            disabled={isReadOnly}
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
        {mode === "view" && (
          <div className="flex gap-3 items-center justify-center mt-2">
            <button
              className="text-white border border-gray-400 rounded  cursor-pointer"
              type="button"
              onClick={() => setShowAgreement(!showAgreement)}
            >
              {showAgreement ? "Hide Agreement" : "View Signed Agreement"}
            </button>
            <PDFDownloadLink
              document={
                <RenterAgreementPDF
                  data={{
                    full_name: watchedName,
                    e_signature: watchedSignature,
                  }}
                />
              }
              fileName={`Rental_Agreement_${watchedName || "Booking"}.pdf`}
              className="w-full text-center bg-green-700 py-3 rounded text-white font-bold hover:bg-green-600 transition-colors"
            >
              {({ loading }) =>
                loading ? "Generating PDF..." : "Download as PDF"
              }
            </PDFDownloadLink>
          </div>
        )}

        {showAgreement && (
          <div className="p-4 bg-white rounded-lg mb-4">
            <RenterAgreement
              full_name={watchedName}
              signatureUrl={watchedSignature}
            />
          </div>
        )}

        {/* 2. ACTION BUTTONS SECTION */}
        <div className="flex gap-2">
          {mode !== "view" && mode !== "edit" && (
            <button
              type="button"
              onClick={onClose} // Make sure this calls your close/cancel function
              className="w-full bg-gray-600 py-5 mt-2 rounded text-white cursor-pointer hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
          {mode === "edit" && (
            <button
              type="button"
              onClick={onClose} // Make sure this calls your close/cancel function
              className="w-full bg-gray-600 py-5 mt-2 rounded text-white cursor-pointer hover:bg-gray-700"
            >
              Cancel
            </button>
          )}

          <button
            type="submit" // "Update" and "Add" need to trigger the form submit
            className="w-full bg-blue-600 py-5 mt-2 rounded text-white cursor-pointer hover:bg-blue-700"
          >
            {mode === "view"
              ? "Close"
              : mode === "edit"
                ? "Update"
                : "Add Booking"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RenterForm;
