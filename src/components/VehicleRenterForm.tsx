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
import { RenterAgreementPDF } from "./RenterAgreementPDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import RenterAgreement from "./RenterAgreement";

interface RenterFormProps {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "view" | "edit";
  selectedData: DataVehicleTypes | null;
  onSuccess?: () => void;
}

const VehicleRenterForm: React.FC<RenterFormProps> = ({
  open,
  onClose,
  mode,
  selectedData,
  onSuccess,
}) => {
  const [showSignature, setShowSignature] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
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
      e_signature: any;
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

  const isReadOnly = mode === "view";
  const watchedName = watch("full_name");
  const watchedSignature = watch("e_signature");
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
  const getGoogleDirectLink = (url: string) => {
    if (!url) return "";

    // Handle both /d/ and /open?id= formats used by Google Forms/Drive
    let fileId = "";
    if (url.includes("/d/")) {
      fileId = url.split("/d/")[1]?.split("/")[0];
    } else if (url.includes("id=")) {
      fileId = url.split("id=")[1]?.split("&")[0];
    }

    if (!fileId) return url;

    // This is the specific endpoint that bypasses the Google UI for <img> tags
    return `https://lh3.googleusercontent.com/d/${fileId}=s1000?authuser=0`;
  };
  useEffect(() => {
    const selectedName = renter.find((r) => r.full_name === selectedRenter);

    if (selectedRenter && selectedName) {
      setValue("address", selectedName.address || "");
      setValue("license_number", selectedName.license_number || "");
      setValue("tin_number", selectedName.tin_number || "");
      setValue("philhealth_number", selectedName.philhealth_number || "");
      setValue("sss_number", selectedName.sss_number || "");
      setValue("pagibig_number", selectedName.pagibig_number || "");

      const directLink = getGoogleDirectLink(selectedName.e_signature);
      setValue("e_signature", directLink);
      setShowSignature(true);
    } else {
      // Reset fields if no renter is selected
      [
        "address",
        "license_number",
        "tin_number",
        "philhealth_number",
        "sss_number",
        "pagibig_number",
        "e_signature",
      ].forEach((field) => setValue(field as any, ""));
    }
  }, [setValue, selectedRenter, renter]);

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
        e_signature:
          typeof watchedSignature === "string" ? watchedSignature : null,
      };

      // Remove the e_signature if it's still a FileList object to prevent JSON errors
      // if (cleanPayload.e_signature instanceof FileList) {
      //   // You should handle the signature upload similar to the proof upload
      //   // For now, let's ensure it's not a FileList object
      //   delete (cleanPayload as any).e_signature;
      // }

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
    <div>
      <div
        className={`fixed py-4 inset-0 bg-[#032d44]/25 z-999 justify-center items-center ${
          open ? "flex" : "hidden"
        }`}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className=" h-full overflow-y-auto border border-white bg-white w-full md:w-1/2 p-6 rounded"
        >
          <ModalButton type="button" onclick={onClose} />
          <div className="flex w-full gap-3">
            <div
              onClick={() => setSelectToggle(!selectToggle)}
              className="flex flex-col gap-1 w-full relative"
            >
              <label htmlFor="" className="text-gray-800">
                Fullname
              </label>
              <select
                {...register("full_name")}
                className="appearance-none peer outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-800  text-gray-800"
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
                {selectToggle ? <icons.up /> : <icons.down />}
              </div>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-gray-800">
                Address
              </label>
              <input
                readOnly
                {...register("address")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-800  w-full"
                placeholder="address"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-gray-800">
                License_No.
              </label>
              <input
                readOnly
                {...register("license_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-800  w-full"
                placeholder="license #"
              />
            </div>
          </div>
          <div className="flex w-full gap-3">
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-gray-800">
                PhilHealth No.
              </label>
              <input
                readOnly
                {...register("philhealth_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-800  w-full"
                placeholder="philhealth #"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-gray-800">
                Tin No.
              </label>
              <input
                readOnly
                {...register("tin_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-800  w-full"
                placeholder="tin #"
              />
            </div>
          </div>
          <div className="flex w-full gap-3">
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-gray-800">
                SSS No.
              </label>
              <input
                readOnly
                {...register("sss_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-800  w-full"
                placeholder="sss #"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="" className="text-gray-800">
                Pagibig No.
              </label>
              <input
                readOnly
                {...register("pagibig_number")}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-800  w-full"
                placeholder="pagibig #"
              />
            </div>
          </div>
          <div className="md:flex  justify-around items-center w-full gap-3">
            <div
              onClick={() => setSelectToggle(!selectToggle)}
              className="flex flex-col w-full relative "
            >
              <label htmlFor="" className="text-start text-gray-800">
                Plate #
              </label>
              <input
                readOnly
                type="text"
                {...register("car_plate_number", { required: true })}
                className="appearance-none peer outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-800  text-gray-800"
              />
              {errors?.car_plate_number?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select A Vehicle{" "}
                </p>
              )}
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="" className=" text-start text-gray-800">
                Model
              </label>
              <input
                readOnly
                {...register("car_model", { required: true })}
                type="text"
                placeholder="Ex:Civic LX"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-800 "
              />
              {errors?.car_plate_number?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select A Vehicle
                </p>
              )}
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="" className=" text-start text-gray-800">
                Type
              </label>
              <input
                readOnly
                {...register("car_type", { required: true })}
                type="text"
                placeholder="Ex: Sedan"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-800 "
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
              <label htmlFor="" className=" text-start text-gray-800">
                Start Date
              </label>
              <input
                {...register("start_date", { required: true })}
                type="date"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-400 w-full "
              />
              {errors?.start_date?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select a Date
                </p>
              )}
            </div>
            <div className="flex flex-col flex-1 w-full gap-1">
              <label htmlFor="" className=" text-start text-gray-800">
                End Date
              </label>
              <input
                {...register("end_date", { required: true })}
                type="date"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-400 w-full "
              />
              {errors?.end_date?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select a Date
                </p>
              )}
            </div>
            <div className="flex flex-col flex-1 w-full gap-1">
              <label htmlFor="" className=" text-start text-gray-800">
                Duration(days)
              </label>
              <input
                {...register("duration", { required: true })}
                type="text"
                placeholder="Duration"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-400 w-full "
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
              <label htmlFor="" className=" text-start text-gray-800">
                Pick Up time
              </label>
              <input
                {...register("start_time", { required: true })}
                type="time"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-400 "
              />
              {errors?.start_time?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please Select a time
                </p>
              )}
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-gray-800">
                Drop off Time
              </label>
              <input
                {...register("end_time", { required: true })}
                type="time"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-400 "
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
              <label htmlFor="" className=" text-start text-gray-800">
                Type of Rent
              </label>
              <select
                {...register("type_of_rent", { required: true })}
                className="border py-4 px-4 border-gray-400 rounded text-gray-800  appearance-none peer outline-none"
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
              <label htmlFor="" className=" text-start text-gray-800">
                Location
              </label>
              <input
                {...register("location", { required: true })}
                type="text"
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-800 text-gray-800 w-full "
                placeholder="Ex: Baguio"
              />
              {errors?.location?.message && (
                <p className="text-red-400 text-start text-sm ">
                  Please input a location
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSignature(!showSignature)}
            className="text-gray-800 p-2 border border-gray-200 rounded cursor-pointer mt-2 mb-2"
          >
            {showSignature ? "Hide Signature" : "Show Signature"}
          </button>
          <div className="flex flex-col gap-2  p-4 rounded bg-gray-800/50">
            <label className="text-sm text-gray-800">Renter Signature</label>

            {/* Show current signature from Supabase if it exists */}
            {showSignature && watchedSignature && (
              <div>
                <div className="mb-2">
                  <p className="text-[10px] text-white uppercase mb-1">
                    Current Signature:
                  </p>
                  <img
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    key={watchedSignature}
                    src={watchedSignature}
                    alt="Signature Preview"
                    className="h-20 object-contain bg-white rounded p-2"
                    onError={(e) => {
                      console.error("Image failed to load:", watchedSignature);
                      // If it fails, try the fallback 'uc' link format
                      const fallback = watchedSignature.replace(
                        "thumbnail?id=",
                        "uc?export=view&id=",
                      );
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                </div>
                {/* File input for UPDATING or NEW signatures */}
                {!isReadOnly && (
                  <input
                    {...register("e_signature")}
                    type="file"
                    className="text-xs text-gray-300 mt-2"
                    accept="image/*"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>
            )}
          </div>
          <div className="w-full text-start text-gray-800 flex flex-col gap-1">
            <label className="">
              Uploaded pictures of proof the whole transactions{" "}
              <span>(others)</span>
            </label>

            <div className="flex flex-col gap-4 border border-gray-400 py-4 px-4 rounded bg-gray-400 min-h-[100px]">
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
                        className="absolute top-1 right-1 bg-red-600 text-gray-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
                    <p className="w-full text-[10px] text-white uppercase font-bold">
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
                            className="absolute top-1 right-1 bg-red-600 text-gray-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <icons.trash size={10} className="text-white" />
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
                    {...register("uploaded_proof")}
                    className="text-gray-800 text-xs w-full cursor-pointer"
                    type="file"
                    accept="image/*"
                    multiple
                  />
                  <icons.upload className="absolute right-0 text-gray-800 pointer-events-none" />
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
            <label htmlFor="" className="text-gray-800 text-start">
              Status
            </label>
            <select
              {...register("status", { required: true })}
              className=" appearance-none outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-800  text-gray-800"
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
                className="text-gray-800 border border-gray-400 rounded  cursor-pointer"
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
                className="w-full text-center bg-green-700 py-3 rounded text-gray-800 font-bold hover:bg-green-600 transition-colors"
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
          <button
            type="submit"
            className="text-gray-200 w-full text-center py-4 px-4 bg-gray-800 hover:bg-gray-600 mt-2 rounded cursor-pointer"
          >
            Add Rent
          </button>
        </form>
      </div>
    </div>
  );
};

export default VehicleRenterForm;
