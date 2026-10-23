/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RenterFormDataSchema, type RenterFormValues } from "../../../schema/schema";
import { supabase } from "../../../utils/supabase";
import type { DataRenterHistoryProps } from "../../../types/types";
import { useEffect, useState } from "react";
import {
  Field,
  FormModal,
  inputStyles,
  useFilePreview,
} from "../../../components/FormParts";
import RenterAgreement from "./RenterAgreement";
import { RenterAgreementPDF } from "./RenterAgreementPDF";
import icons from "../../../constants/icon";
import { toast } from "react-toastify";
import { PDFDownloadLink } from "@react-pdf/renderer";
import React from "react";

// ADDED FOR DATEPICKER
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { differenceInDays, parseISO, format } from "date-fns";
import { uploadFile } from "../../../utils/rental/UploadFile";
import getPublicUrl from "../../../utils/rental/getPublicUrl";

const errorInputStyles =
  "w-full border border-red-500 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400";

const fileInputStyles =
  "text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
    {children}
  </p>
);

// A newly picked proof photo (the preview is released when it is removed)
const NewProofThumb = ({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) => {
  const url = useFilePreview(file);

  return (
    <div className="relative group w-16 h-16 border-2 border-blue-400 rounded-lg bg-white overflow-hidden">
      {url && <img src={url} className="w-full h-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100"
      >
        <icons.trash size={10} />
      </button>
    </div>
  );
};

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
      color: string;
      status: string;
    }[]
  >([]);
  const [existingPaths, setExistingPaths] = useState({
    uploaded_proof: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  // ADDED: State for booked dates
  const [bookedIntervals, setBookedIntervals] = useState<
    { start: Date; end: Date }[]
  >([]);

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
  const watchedTotal = watch("total_price_rent");
  const watchedDownpayment = watch("downpayment");
  // ADDED: Watch dates for duration calculation
  const watchedStartDate = watch("start_date");
  const watchedEndDate = watch("end_date");

  // calculate balance
 useEffect(() => {
  const total = parseFloat(watchedTotal || "0");
  const down = parseFloat(watchedDownpayment || "0");
  const balance = total - down;

  // Only set value if the modal is actually open and values are numbers
  if (open && !isNaN(balance)) {
    setValue("remaining_balance", balance, { 
      shouldValidate: true, 
      shouldDirty: true 
    });
  }
}, [watchedTotal, watchedDownpayment, setValue, open]);

  // Logic for Auto-filling Vehicle and Duration
  useEffect(() => {
    if (!selectedPlate) {
      setValue("car_model", "");
      setValue("car_type", "");
      setValue("car_color", "");
      setBookedIntervals([]); // Clear intervals if no plate
    }
    const selectedVehicle = vehicles.find(
      (v) => v.plate_number === selectedPlate,
    );
    if (selectedVehicle) {
      setValue("car_model", selectedVehicle.model);
      setValue("car_type", selectedVehicle.type);
      setValue("car_color", selectedVehicle.color);
    }

    // NEW: Calculate Duration Automatically
    if (watchedStartDate && watchedEndDate) {
      const start = new Date(watchedStartDate);
      const end = new Date(watchedEndDate);
      const diff = differenceInDays(end, start);
      setValue("duration", diff > 0 ? diff.toString() : "1");
    }
  }, [selectedPlate, vehicles, setValue, watchedStartDate, watchedEndDate]);

  // NEW: Fetch existing bookings to disable dates
  useEffect(() => {
    if (!selectedPlate) return;

    const fetchDisabledDates = async () => {
      const { data } = await supabase
        .from("renter_booking")
        .select("start_date, end_date")
        .eq("car_plate_number", selectedPlate)
        .in("status", ["On Reservation", "On Service"])
        .neq("id", selectedData?.id || "00000000-0000-0000-0000-000000000000");

      if (data) {
        const intervals = data.map((item) => ({
          start: parseISO(item.start_date),
          end: parseISO(item.end_date),
        }));
        setBookedIntervals(intervals);
      }
    };

    fetchDisabledDates();
  }, [selectedPlate, selectedData]);

  useEffect(() => {
    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_number, model, type, color, status");

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
        car_color: selectedData.car_color,
        start_date: selectedData.start_date,
        end_date: selectedData.end_date,
        start_time: selectedData.start_time,
        end_time: selectedData.end_time,
        duration: selectedData.duration,
        type_of_rent: selectedData.type_of_rent,
        location: selectedData.location,
        status: selectedData.status,
        e_signature: selectedData.e_signature,
        total_price_rent: selectedData.total_price_rent,
        downpayment: selectedData.downpayment,
        remaining_balance: Number(selectedData.remaining_balance) || 0,
        remarks: selectedData.remarks || "",
      });
    }
    if (selectedData?.uploaded_proof) {
      setExistingPaths({
        uploaded_proof: Array.isArray(selectedData.uploaded_proof)
          ? selectedData.uploaded_proof
          : [],
      });
    } else {
      reset();
      setExistingPaths({uploaded_proof:[]})
    }
  }, [selectedData, reset]);

//   const onSubmit = async (renterData: RenterFormValues) => {
//   if (mode === "view") {
//     onClose();
//     return;
//   }
//   try {
//     setLoading(true);

//     let finalProofArray: string[] = [...existingPaths.uploaded_proof];

//     // --- File Deletion Logic ---
//     if (mode === "edit" && selectedData?.uploaded_proof) {
//       const originalPaths: string[] = selectedData.uploaded_proof as any;
//       const pathsToDelete = originalPaths.filter(
//         (path) => !existingPaths.uploaded_proof.includes(path),
//       );

//       if (pathsToDelete.length > 0) {
//         const { error: deleteError } = await supabase.storage
//           .from("uploaded_proof")
//           .remove(pathsToDelete);
//         if (deleteError) console.error("Error deleting files:", deleteError);
//       }
//     }

//     // --- File Upload Logic ---
//     if (
//       renterData.uploaded_proof instanceof FileList &&
//       renterData.uploaded_proof.length > 0
//     ) {
//       const validFiles = Array.from(renterData.uploaded_proof);
//       const uploadPromises = validFiles.map((file) =>
//         uploadFile(file as File, "uploaded_proof"),
//       );
//       const uploadResults = await Promise.all(uploadPromises);
//       const newPaths = uploadResults.map((res) => res.path);
//       finalProofArray = [...finalProofArray, ...newPaths];
//     }

//     const cleanPayload: any = {
//       ...renterData,
//       uploaded_proof: finalProofArray,
//     };

//     // --- Signature Handling ---
//     if (renterData.e_signature instanceof FileList) {
//       if (renterData.e_signature.length > 0) {
//         delete cleanPayload.e_signature;
//       } else {
//         cleanPayload.e_signature = watchedSignature;
//       }
//     } else {
//       cleanPayload.e_signature = watchedSignature;
//     }

//     // --- NEW LOGIC: Calculate Correct Vehicle Status ---
//     let vehicleStatus = "Available";
//     const plateNumber = cleanPayload.car_plate_number;

//     if (cleanPayload.status === "On Service") {
//       vehicleStatus = "On Service";
//     } else if (cleanPayload.status === "On Reservation") {
//       vehicleStatus = "On Reservation";
//     } else if (cleanPayload.status === "Completed") {
//       // Check for any OTHER booking that is currently Active or Reserved
//       const { data: activeBookings } = await supabase
//         .from("renter_booking")
//         .select("id, status")
//         .eq("car_plate_number", plateNumber)
//         .in("status", ["On Reservation", "On Service"]) // Check both!
//         .neq("id", selectedData?.id || ""); // Exclude current record

//       if (activeBookings && activeBookings.length > 0) {
//         // If another booking is "On Service", the car is still out.
//         // Otherwise, if it's "On Reservation", it's reserved for the next customer.
//         const isStillRented = activeBookings.some((b) => b.status === "On Service");
//         vehicleStatus = isStillRented ? "On Service" : "On Reservation";
//       } else {
//         vehicleStatus = "Available";
//       }
//     }
//     // ----------------------------------------------------

//     // --- Database Update/Insert ---
//     if (mode === "edit") {
//       const { error } = await supabase
//         .from("renter_booking")
//         .update(cleanPayload)
//         .eq("id", selectedData?.id);
//       if (error) throw error;

//       if (plateNumber) {
//         await supabase
//           .from("vehicle")
//           .update({ status: vehicleStatus })
//           .eq("plate_number", plateNumber);
//       }

//       toast.success(
//         vehicleStatus !== "Available" && cleanPayload.status === "Completed"
//           ? `Record Completed. Car status updated to: ${vehicleStatus}`
//           : "Updated successfully",
//       );
//       reset();
//       if (onSuccess) onSuccess();
//     } else {
//       const { error } = await supabase
//         .from("renter_booking")
//         .insert([cleanPayload]);
//       if (error) throw error;

//       if (plateNumber) {
//         await supabase
//           .from("vehicle")
//           .update({ status: vehicleStatus })
//           .eq("plate_number", plateNumber);
//       }

//       toast.success("Added Rent Successfully");
//       reset();
//     }
//     setLoading(false);
//     onClose();
//   } catch (err: any) {
//     console.error("Error submitting form:", err);
//     toast.error(err.message);
//     setLoading(false);
//   }
// };

const onSubmit = async (renterData: RenterFormValues) => {
    if (mode === "view") {
      onClose();
      return;
    }
    try {
      setLoading(true);

      let finalProofArray: string[] = [...existingPaths.uploaded_proof];

      // --- File Deletion Logic ---
      if (mode === "edit" && selectedData?.uploaded_proof) {
        const originalPaths: string[] = selectedData.uploaded_proof as any;
        const pathsToDelete = originalPaths.filter(
          (path) => !existingPaths.uploaded_proof.includes(path)
        );

        if (pathsToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from("uploaded_proof")
            .remove(pathsToDelete);
          if (deleteError) console.error("Error deleting files:", deleteError);
        }
      }

      // --- File Upload Logic ---
      if (
        renterData.uploaded_proof instanceof FileList &&
        renterData.uploaded_proof.length > 0
      ) {
        const validFiles = Array.from(renterData.uploaded_proof);
        const uploadPromises = validFiles.map((file) =>
          uploadFile(file as File, "uploaded_proof")
        );
        const uploadResults = await Promise.all(uploadPromises);
        const newPaths = uploadResults.map((res) => res.path);
        finalProofArray = [...finalProofArray, ...newPaths];
      }

      const cleanPayload: any = {
        ...renterData,
        uploaded_proof: finalProofArray,
      };

      // --- Signature Handling ---
      if (renterData.e_signature instanceof FileList) {
        if (renterData.e_signature.length > 0) {
          // If new signature uploaded, uploadFile will handle it in the schema/api
          // Assuming uploadFile handles the actual upload and returns the path/url
        } else {
          cleanPayload.e_signature = watchedSignature;
        }
      } else {
        cleanPayload.e_signature = watchedSignature;
      }

      // --- NEW LOGIC: Calculate Correct Vehicle Status ---
      let vehicleStatus = "Available";
      const plateNumber = cleanPayload.car_plate_number;

      if (cleanPayload.status === "On Service") {
        vehicleStatus = "On Service";
      } else if (cleanPayload.status === "On Reservation") {
        vehicleStatus = "On Reservation";
      } else if (cleanPayload.status === "Completed") {
        // Check for any OTHER booking that is currently Active or Reserved
        const { data: activeBookings } = await supabase
          .from("renter_booking")
          .select("id, status")
          .eq("car_plate_number", plateNumber)
          .in("status", ["On Reservation", "On Service"]) // Check both!
          .neq("id", selectedData?.id || ""); // Exclude current record

        if (activeBookings && activeBookings.length > 0) {
          const isStillRented = activeBookings.some(
            (b) => b.status === "On Service"
          );
          vehicleStatus = isStillRented ? "On Service" : "On Reservation";
        } else {
          vehicleStatus = "Available";
        }
      }
      // ----------------------------------------------------

      // --- Database Update/Insert ---
      if (mode === "edit") {
        const { error } = await supabase
          .from("renter_booking")
          .update(cleanPayload)
          .eq("id", selectedData?.id);
        if (error) throw error;

        if (plateNumber) {
          await supabase
            .from("vehicle")
            .update({ status: vehicleStatus })
            .eq("plate_number", plateNumber);
        }

        toast.success(
          vehicleStatus !== "Available" && cleanPayload.status === "Completed"
            ? `Record Completed. Car status updated to: ${vehicleStatus}`
            : "Updated successfully"
        );
        reset();
        if (onSuccess) onSuccess();
      } else {
        const { error } = await supabase
          .from("renter_booking")
          .insert([cleanPayload]);
        if (error) throw error;

        if (plateNumber) {
          await supabase
            .from("vehicle")
            .update({ status: vehicleStatus })
            .eq("plate_number", plateNumber);
        }

        toast.success("Added Rent Successfully");
        reset();
      }
      setLoading(false);
      onClose();
    } catch (err: any) {
      console.error("Error submitting form:", err);
      toast.error(err.message);
      setLoading(false);
    }
  };

  const err = (field: keyof RenterFormValues) =>
    errors[field]?.message as string | undefined;
  const cls = (field: keyof RenterFormValues) =>
    errors[field] ? errorInputStyles : inputStyles;
  const isEdit = mode === "edit";

  return (
    <FormModal
      open={open}
      title={
        isReadOnly
          ? "Booking Summary"
          : isEdit
            ? "Modify Booking"
            : "New Rental Registration"
      }
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      isView={isReadOnly}
      isSubmitting={loading}
      cancelLabel={isReadOnly ? "Close Portal" : "Cancel"}
      submitLabel={isEdit ? "Save Changes" : "Confirm Booking"}
      submittingLabel="Saving..."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8">
        {!isReadOnly && (
          <p className="text-sm text-gray-500 -mt-2">
            Fill in all required fields to proceed.
          </p>
        )}

        {/* 1. Identity */}
        <div>
          <SectionLabel>1. Identity Information</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" error={err("full_name")}>
              <input
                readOnly
                {...register("full_name")}
                type="text"
                className={`${cls("full_name")} read-only:bg-gray-50`}
              />
            </Field>

            <Field label="Current Address" error={err("address")}>
              <input
                readOnly
                {...register("address")}
                type="text"
                className={`${cls("address")} read-only:bg-gray-50`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <Field label="License Number" error={err("license_number")}>
              <input
                {...register("license_number")}
                type="text"
                className={cls("license_number")}
              />
            </Field>
            <Field label="PhilHealth No." error={err("philhealth_number")}>
              <input
                readOnly
                {...register("philhealth_number")}
                type="text"
                className={`${cls("philhealth_number")} read-only:bg-gray-50`}
              />
            </Field>
            <Field label="TIN No." error={err("tin_number")}>
              <input
                readOnly
                {...register("tin_number")}
                type="text"
                className={`${cls("tin_number")} read-only:bg-gray-50`}
              />
            </Field>
            <Field label="SSS No." error={err("sss_number")}>
              <input
                readOnly
                {...register("sss_number")}
                type="text"
                className={`${cls("sss_number")} read-only:bg-gray-50`}
              />
            </Field>
            <Field label="Pag-IBIG No." error={err("pagibig_number")}>
              <input
                readOnly
                {...register("pagibig_number")}
                type="text"
                className={`${cls("pagibig_number")} read-only:bg-gray-50`}
              />
            </Field>
          </div>
        </div>

        {/* 2. Vehicle */}
        <div>
          <SectionLabel>2. Vehicle Selection</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Plate Number" error={err("car_plate_number")}>
              <select
                disabled={isReadOnly}
                {...register("car_plate_number", { required: true })}
                className={cls("car_plate_number")}
                onClick={() => setSelectToggle(!selectToggle)}
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option
                    key={v.id}
                    value={v.plate_number}
                    className={`${v.status === "On Service" ? "text-red-500" : v.status === "On Reservation" ? "text-blue-500" : v.status === "On Maintenance" ? "text-red-500" : ""}`}
                  >
                    {v.plate_number} {v.status === "On Service" ? "(Rented)" : ""}{" "}
                    {v.status === "On Reservation" ? "(Reserved)" : ""}{" "}
                    {v.status === "On Maintenance" ? "(Maintenance)" : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Model" error={err("car_model")}>
              <input
                readOnly
                {...register("car_model")}
                type="text"
                className={`${cls("car_model")} read-only:bg-gray-50`}
              />
            </Field>

            <Field label="Body Type" error={err("car_type")}>
              <input
                readOnly
                {...register("car_type")}
                type="text"
                className={`${cls("car_type")} read-only:bg-gray-50`}
              />
            </Field>

            <Field label="Color" error={err("car_color")}>
              <input
                readOnly
                {...register("car_color")}
                type="text"
                className={`${cls("car_color")} read-only:bg-gray-50`}
              />
            </Field>
          </div>
        </div>

        {/* 3. Schedule */}
        <div>
          <SectionLabel>3. Rental Schedule</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Start Date" error={err("start_date")}>
              <DatePicker
                disabled={isReadOnly || !selectedPlate}
                selected={watchedStartDate ? new Date(watchedStartDate) : null}
                onChange={(date: Date | null) =>
                  setValue("start_date", date ? format(date, "yyyy-MM-dd") : "")
                }
                excludeDateIntervals={bookedIntervals}
                minDate={new Date()}
                placeholderText="Select start date"
                wrapperClassName="w-full"
                className={cls("start_date")}
              />
            </Field>

            <Field label="End Date" error={err("end_date")}>
              <DatePicker
                disabled={isReadOnly || !watchedStartDate}
                selected={watchedEndDate ? new Date(watchedEndDate) : null}
                onChange={(date: Date | null) =>
                  setValue("end_date", date ? format(date, "yyyy-MM-dd") : "")
                }
                excludeDateIntervals={bookedIntervals}
                minDate={watchedStartDate ? new Date(watchedStartDate) : new Date()}
                placeholderText="Select end date"
                wrapperClassName="w-full"
                className={cls("end_date")}
              />
            </Field>

            <Field label="Duration (Days)" error={err("duration")}>
              <input
                placeholder="0"
                readOnly
                disabled={isReadOnly}
                {...register("duration")}
                type="text"
                className={`${cls("duration")} read-only:bg-gray-50`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Field label="Pick Up Time" error={err("start_time")}>
              <input
                disabled={isReadOnly}
                {...register("start_time")}
                type="time"
                className={cls("start_time")}
              />
            </Field>

            <Field label="Drop Off Time" error={err("end_time")}>
              <input
                disabled={isReadOnly}
                {...register("end_time")}
                type="time"
                className={cls("end_time")}
              />
            </Field>

            <Field label="Destination/Location" error={err("location")}>
              <input
                disabled={isReadOnly}
                {...register("location")}
                type="text"
                className={cls("location")}
                placeholder="Baguio City"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Rental Type" error={err("type_of_rent")}>
              <select
                disabled={isReadOnly}
                {...register("type_of_rent")}
                className={cls("type_of_rent")}
              >
                <option value="">Choose Type</option>
                <option value="Self Drive">Self Drive</option>
                <option value="With Driver">With Driver</option>
              </select>
            </Field>

            <Field label="Booking Status" error={err("status")}>
              <select
                disabled={isReadOnly}
                {...register("status")}
                className={cls("status")}
              >
                <option value="">Set Status</option>
                <option value="On Service">On Service</option>
                <option value="On Reservation">On Reservation</option>
                <option value="Completed">Completed</option>
              </select>
            </Field>
          </div>
        </div>

        {/* 4. Payment */}
        <div>
          <SectionLabel>4. Payment</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Total Price Rent" error={err("total_price_rent")}>
              <input
                placeholder="ex: 3000"
                disabled={isReadOnly}
                {...register("total_price_rent")}
                type="text"
                className={cls("total_price_rent")}
              />
            </Field>
            <Field label="Downpayment" error={err("downpayment")}>
              <input
                placeholder="ex: 1000"
                disabled={isReadOnly}
                {...register("downpayment")}
                type="number"
                className={cls("downpayment")}
              />
            </Field>
            <Field label="Remaining Balance" error={err("remaining_balance")}>
              <input
                placeholder="ex: 1000"
                readOnly
                disabled={isReadOnly}
                {...register("remaining_balance")}
                type="number"
                className={`${cls("remaining_balance")} read-only:bg-gray-50`}
              />
            </Field>
          </div>
        </div>

        {/* Verification & documents */}
        <div>
          <SectionLabel>Verification & Documents</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Signature */}
            <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  E-Signature
                </label>
                <button
                  type="button"
                  onClick={() => setShowSignature(!showSignature)}
                  className="text-xs font-bold text-blue-600"
                >
                  {showSignature ? "Close Preview" : "View Current Signature"}
                </button>
              </div>

              {showSignature && selectedData?.e_signature ? (
                <div className="space-y-3 text-center">
                  <div className="bg-white border border-gray-200 rounded-lg p-2 flex justify-center">
                    <img
                      src={selectedData.e_signature}
                      alt="Signature"
                      className="h-20 object-contain"
                    />
                  </div>
                  {!isReadOnly && (
                    <input
                      {...register("e_signature")}
                      type="file"
                      className={fileInputStyles}
                      accept="image/*"
                    />
                  )}
                </div>
              ) : (
                <p className="text-xs italic text-gray-400 text-center py-6">
                  Signature preview is hidden
                </p>
              )}
              {err("e_signature") && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {err("e_signature")}
                </p>
              )}
            </div>

            {/* Transaction proofs */}
            <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
              <label className="text-sm font-semibold text-gray-700 block mb-3">
                Transaction Proofs
              </label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {existingPaths.uploaded_proof.map((path, index) => (
                    <div
                      key={index}
                      className="relative group w-16 h-16 border border-gray-200 rounded-lg bg-white overflow-hidden"
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
                      <NewProofThumb
                        key={index}
                        file={file as File}
                        onRemove={() => resetField("uploaded_proof")}
                      />
                    ))}
                  {existingPaths.uploaded_proof.length === 0 &&
                    !(watchedProof instanceof FileList && watchedProof.length > 0) && (
                      <p className="text-xs text-gray-400 italic">No proofs yet</p>
                    )}
                </div>
                {!isReadOnly && (
                  <input
                    type="file"
                    {...register("uploaded_proof")}
                    multiple
                    accept="image/*"
                    className={fileInputStyles}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Signed agreement (view only) */}
        {isReadOnly && (
          <div className="space-y-4 border-t border-gray-100 pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowAgreement(!showAgreement)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
              >
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
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center transition-all"
              >
                {({ loading }) => (loading ? "Preparing..." : "Download Official PDF")}
              </PDFDownloadLink>
            </div>
            {showAgreement && (
              <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-inner max-h-96 overflow-y-auto">
                <RenterAgreement
                  full_name={watchedName}
                  signatureUrl={watchedSignature}
                />
              </div>
            )}
          </div>
        )}

        {/* Remarks */}
        <Field label="Remarks / Notes" error={err("remarks")}>
          <input
            disabled={isReadOnly}
            placeholder="Notes"
            {...register("remarks")}
            type="text"
            className={cls("remarks")}
          />
        </Field>
      </div>
    </FormModal>
  );
};

export default React.memo(RenterForm);