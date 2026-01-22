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
    {
      id: string;
      plate_number: string;
      model: string;
      type: string;
      status: string;
    }[]
  >([]);
  const [existingPaths, setExistingPaths] = useState({
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
  const selectedPlate = watch("car_plate_number");
  const watchedProof = watch("uploaded_proof");
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

  useEffect(() => {
    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_number, model, type, status");

      if (error) {
        console.log("Error fetching Vehicles", error);
        return;
      }
      setVehicles(data);
    };
    fetchVehicle();
  }, []);

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

      // 1. Handle File Deletions (Edit Mode)
      if (mode === "edit" && selectedData?.uploaded_proof) {
        const originalPaths: string[] = selectedData.uploaded_proof;
        const pathsToDelete = originalPaths.filter(
          (path) => !existingPaths.uploaded_proof.includes(path),
        );

        if (pathsToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from("uploaded_proof")
            .remove(pathsToDelete);
          if (deleteError) console.error("Error deleting files:", deleteError);
        }
      }

      // 2. Handle File Uploads
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
        finalProofArray = [...finalProofArray, ...newPaths];
      }

      // 3. Prepare Payload
      const cleanPayload: any = {
        ...renterData,
        uploaded_proof: finalProofArray,
      };

      // Handle Signature
      if (renterData.e_signature instanceof FileList) {
        if (renterData.e_signature.length > 0) {
          delete cleanPayload.e_signature;
        } else {
          cleanPayload.e_signature = watchedSignature;
        }
      } else {
        cleanPayload.e_signature = watchedSignature;
      }

      /* ==========================================================
          4. DYNAMIC VEHICLE STATUS LOGIC
      ========================================================== */
      let vehicleStatus = "Available"; // Default
      if (cleanPayload.status === "On Service") {
        vehicleStatus = "On Service";
      } else if (cleanPayload.status === "On Reservation") {
        vehicleStatus = "On Reservation";
      } else if (cleanPayload.status === "Completed") {
        vehicleStatus = "Available";
      }

      const plateNumber = cleanPayload.car_plate_number;

      // 5. Database Operations
      if (mode === "edit") {
        // Update Booking
        const { error } = await supabase
          .from("renter_booking")
          .update(cleanPayload)
          .eq("id", selectedData?.id);
        if (error) throw error;

        // Update Vehicle Status
        if (plateNumber) {
          await supabase
            .from("vehicle")
            .update({ status: vehicleStatus })
            .eq("plate_number", plateNumber);
        }

        toast.success("Updated successfully");
        if (onSuccess) onSuccess();
      } else {
        // Insert Booking
        const { error } = await supabase
          .from("renter_booking")
          .insert([cleanPayload]);
        if (error) throw error;

        // Update Vehicle Status
        if (plateNumber) {
          await supabase
            .from("vehicle")
            .update({ status: vehicleStatus })
            .eq("plate_number", plateNumber);
        }

        toast.success("Added Rent Successfully");
        reset();
      }
      onClose();
    } catch (err: any) {
      console.error("Error submitting form:", err);
      toast.error(err.message);
    }
  };

  // Reusable Helper for dynamic input classes based on errors
  const getInputClass = (fieldName: keyof RenterFormValues) => {
    const hasError = !!errors[fieldName];
    return `w-full border rounded-lg py-3 px-4 outline-none transition-all focus:ring-2 bg-white disabled:bg-gray-50 disabled:text-gray-500 ${
      hasError
        ? "border-red-500 focus:ring-red-100 focus:border-red-500"
        : "border-gray-300 focus:ring-blue-100 focus:border-blue-500 text-gray-700"
    }`;
  };

  const ErrorMessage = ({ field }: { field: keyof RenterFormValues }) =>
    errors[field] ? (
      <span className="flex items-center gap-1 text-red-500 text-[10px] font-bold mt-1 animate-pulse">
        <icons.info size={10} /> {errors[field]?.message as string}
      </span>
    ) : null;

  const labelBase =
    "text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 ml-1";
  const sectionTitle =
    "text-sm font-black text-blue-600 uppercase tracking-widest mb-4 border-b pb-2 flex items-center gap-2";

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-999 flex justify-center items-center p-4 transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(onSubmit)}
        className="relative h-full max-h-[95vh] overflow-y-auto bg-white w-full max-w-4xl p-8 rounded-2xl shadow-2xl scrollbar-hide"
      >
        <div className="absolute top-6 right-6">
          <ModalButton type="button" onclick={onClose} />
        </div>

        <header className="mb-8">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            {mode === "view"
              ? "Booking Summary"
              : mode === "edit"
                ? "Modify Booking"
                : "New Rental Registration"}
          </h2>
          <p className="text-gray-500 text-sm">
            Fill in all required fields to proceed.
          </p>
        </header>

        {/* SECTION: RENTER IDENTITY */}
        <h3 className={sectionTitle}>1. Identity Information</h3>
        <div className=" flex flex-col gap-5 mb-10">
          <div className="flex w-full gap-4">
            <div className="flex flex-col lg:col-span-2 w-4/8">
              <label className={labelBase}>Full Name</label>
              <input
                readOnly
                {...register("full_name")}
                type="text"
                className={getInputClass("full_name")}
              />
              <ErrorMessage field="full_name" />
            </div>

            <div className="flex flex-col md:col-span-2 lg:col-span-3 w-full">
              <label className={labelBase}>Current Address</label>
              <input
                readOnly
                {...register("address")}
                type="text"
                className={getInputClass("address")}
              />
              <ErrorMessage field="address" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <label className={labelBase}>License Number</label>
              <input
                readOnly
                {...register("license_number")}
                type="text"
                className={getInputClass("license_number")}
              />
              <ErrorMessage field="license_number" />
            </div>
            <div className="flex flex-col">
              <label className={labelBase}>PhilHealth No.</label>
              <input
                readOnly
                {...register("philhealth_number")}
                type="text"
                className={getInputClass("philhealth_number")}
              />
              <ErrorMessage field="philhealth_number" />
            </div>
            <div className="flex flex-col">
              <label className={labelBase}>TIN No.</label>
              <input
                readOnly
                {...register("tin_number")}
                type="text"
                className={getInputClass("tin_number")}
              />
              <ErrorMessage field="tin_number" />
            </div>
            <div className="flex flex-col">
              <label className={labelBase}>SSS No.</label>
              <input
                readOnly
                {...register("sss_number")}
                type="text"
                className={getInputClass("sss_number")}
              />
              <ErrorMessage field="sss_number" />
            </div>
            <div className="flex flex-col">
              <label className={labelBase}>Pag-IBIG No.</label>
              <input
                readOnly
                {...register("pagibig_number")}
                type="text"
                className={getInputClass("pagibig_number")}
              />
              <ErrorMessage field="pagibig_number" />
            </div>
          </div>
        </div>

        {/* SECTION: RENTAL LOGISTICS */}
        <h3 className={sectionTitle}>2. Vehicle Selection</h3>
        <div className="flex w-full gap-4 mb-5 bg-gray-50 rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col relative w-full">
            <label className={labelBase}>Plate Number</label>
            <select
              disabled={isReadOnly}
              {...register("car_plate_number", { required: true })}
              className={`${getInputClass("car_plate_number")} appearance-none`}
              onClick={() => setSelectToggle(!selectToggle)}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option
                  disabled={v.status === "On Rent" || v.status === "On Service"}
                  key={v.id}
                  value={v.plate_number}
                  className={`${v.status === "On Service" ? "text-red-500" : ""}`}
                >
                  {v.plate_number} {v.status === "On Service" ? "(Rented)" : ""}
                </option>
              ))}
            </select>
            <icons.down className="absolute right-4 bottom-4 text-gray-400 pointer-events-none" />
            <ErrorMessage field="car_plate_number" />
          </div>

          <div className="flex flex-col w-full">
            <label className={labelBase}>Model</label>
            <input
              readOnly
              {...register("car_model")}
              type="text"
              className={getInputClass("car_model")}
            />
            <ErrorMessage field="car_model" />
          </div>

          <div className="flex flex-col w-full">
            <label className={labelBase}>Body Type</label>
            <input
              readOnly
              {...register("car_type")}
              type="text"
              className={getInputClass("car_type")}
            />
            <ErrorMessage field="car_type" />
          </div>
        </div>
        <h3 className={sectionTitle}>3. Rental Schedule</h3>
        <div className="w-full gap-5 mb-10 p-6 bg-gray-50 rounded-xl border border-gray-100">
         <div className="flex w-full gap-4">
           <div className="flex flex-col w-full">
            <label className={labelBase}>Start Date</label>
            <input
              disabled={isReadOnly}
              {...register("start_date")}
              type="date"
              className={getInputClass("start_date")}
            />
            <ErrorMessage field="start_date" />
          </div>

          <div className="flex flex-col w-full">
            <label className={labelBase}>End Date</label>
            <input
              disabled={isReadOnly}
              {...register("end_date")}
              type="date"
              className={getInputClass("end_date")}
            />
            <ErrorMessage field="end_date" />
          </div>
            <div className="flex flex-col w-full">
            <label className={labelBase}>Duration (Days)</label>
            <input
            placeholder="0"
              disabled={isReadOnly}
              {...register("duration")}
              type="text"
              className={getInputClass("duration")}
            />
            <ErrorMessage field="duration" />
          </div>
         </div>
<div className="flex w-full gap-4">
 <div className="flex flex-col w-full">
            <label className={labelBase}>Pick Up Time</label>
            <input
              disabled={isReadOnly}
              {...register("start_time")}
              type="time"
              className={getInputClass("start_time")}
            />
            <ErrorMessage field="start_time" />
          </div>

          <div className="flex flex-col w-full">
            <label className={labelBase}>Drop Off Time</label>
            <input
              disabled={isReadOnly}
              {...register("end_time")}
              type="time"
              className={getInputClass("end_time")}
            />
            <ErrorMessage field="end_time" />
          </div>

          <div className="flex flex-col w-full">
            <label className={labelBase}>Destination/Location</label>
            <input
              disabled={isReadOnly}
              {...register("location")}
              type="text"
              className={getInputClass("location")}
              placeholder="Baguio City"
            />
            <ErrorMessage field="location" />
          </div>
</div>
        

         
          <div className="flex w-full gap-4 pt-4">
            <div className="flex flex-col relative w-full">
              <label className={labelBase}>Rental Type</label>
              <select
                disabled={isReadOnly}
                {...register("type_of_rent")}
                className={`${getInputClass("type_of_rent")} appearance-none font-bold`}
              >
                <option value="">Choose Type</option>
                <option value="Self Drive">Self Drive</option>
                <option value="With Driver">With Driver</option>
              </select>
              <icons.down className="absolute right-4 bottom-4 text-gray-400 pointer-events-none" />
              <ErrorMessage field="type_of_rent" />
            </div>

            <div className="flex flex-col relative w-full">
              <label className={labelBase}>Booking Status</label>
              <select
                disabled={isReadOnly}
                {...register("status")}
                className={`${getInputClass("status")} appearance-none font-bold text-blue-600`}
              >
                <option value="">Set Status</option>
                <option value="On Service">On Service</option>
                <option value="On Reservation">On Reservation</option>
                <option value="Completed">Completed</option>
              </select>
              <icons.down className="absolute right-4 bottom-4 text-gray-400 pointer-events-none" />
              <ErrorMessage field="status" />
            </div>
          </div>
        </div>

        {/* SECTION: SIGNATURE & PROOF */}
        <h3 className={sectionTitle}>
          <icons.upload size={16} /> Verification & Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className={labelBase}>E-Signature</label>
              <button
                type="button"
                onClick={() => setShowSignature(!showSignature)}
                className="text-[10px] font-bold text-blue-500 hover:text-blue-700 underline uppercase tracking-tighter"
              >
                {showSignature ? "Close Preview" : "View Current Signature"}
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 flex flex-col items-center justify-center min-h-40">
              {showSignature && selectedData?.e_signature ? (
                <div className="text-center">
                  <img
                    src={selectedData.e_signature}
                    className="h-20 object-contain mix-blend-multiply mb-4"
                  />
                  {!isReadOnly && (
                    <input
                      {...register("e_signature")}
                      type="file"
                      className="text-xs"
                      accept="image/*"
                    />
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <icons.person size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs italic">Signature preview is hidden</p>
                </div>
              )}
            </div>
            <ErrorMessage field="e_signature" />
          </div>

          <div className="p-4 bg-slate-50 border rounded-xl">
            <label className="text-sm font-bold text-slate-700 block mb-3">
              Transaction Proofs
            </label>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {existingPaths.uploaded_proof.map((path, index) => (
                  <div
                    key={index}
                    className="relative group w-16 h-16 border rounded bg-white overflow-hidden"
                  >
                    <img
                      src={getPublicUrl("uploaded_proof", path)}
                      className="w-full h-full object-cover"
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          setExistingPaths((prev) => ({
                            ...prev,
                            uploaded_proof: prev.uploaded_proof.filter(
                              (_, i) => i !== index,
                            ),
                          }))
                        }
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100"
                      >
                        <icons.trash size={10} />
                      </button>
                    )}
                  </div>
                ))}
                {watchedProof instanceof FileList &&
                  Array.from(watchedProof).map((file, index) => (
                    <div
                      key={index}
                      className="relative group w-16 h-16 border-blue-500 border rounded bg-white overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => resetField("uploaded_proof")}
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100"
                      >
                        <icons.trash size={10} />
                      </button>
                    </div>
                  ))}
              </div>
              {!isReadOnly && (
                <div className="relative">
                  <input
                    type="file"
                    {...register("uploaded_proof")}
                    multiple
                    accept="image/*"
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: AGREEMENT & EXPORT (VIEW ONLY) */}
        {mode === "view" && (
          <div className="mb-10 bg-slate-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <button
                type="button"
                onClick={() => setShowAgreement(!showAgreement)}
                className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <icons.openEye size={18} />{" "}
                {showAgreement ? "Hide Agreement" : "View Signed Document"}
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
                fileName={`Agreement_${watchedName}.pdf`}
                className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold text-sm text-slate-900 transition-all flex items-center justify-center gap-2"
              >
                {({ loading }) =>
                  loading ? (
                    "Preparing..."
                  ) : (
                    <>
                      <icons.download size={18} /> Download Official PDF
                    </>
                  )
                }
              </PDFDownloadLink>
            </div>

            {showAgreement && (
              <div className="bg-white text-gray-800 p-8 rounded-xl max-h-96 overflow-y-auto shadow-inner">
                <RenterAgreement
                  full_name={watchedName}
                  signatureUrl={watchedSignature}
                />
              </div>
            )}
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white pt-6 border-t mt-4">
          {(mode === "create" || mode === "edit") && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={`flex-2 px-8 py-4 rounded-xl font-black text-white shadow-lg transition-all ${
              mode === "view"
                ? "bg-slate-800 hover:bg-slate-700"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200"
            }`}
          >
            {mode === "view"
              ? "Close Portal"
              : mode === "edit"
                ? "Save Changes"
                : "Confirm Booking"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RenterForm;
