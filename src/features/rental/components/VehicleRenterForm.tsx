/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from "react-hook-form";
import { RenterFormDataSchema, type RenterFormValues } from "../../../schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "../../../utils/rental/UploadFile";
import { supabase } from "../../../utils/supabase";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { DataVehicleTypes } from "../../../types/types";
import icons from "../../../constants/icon";
import getPublicUrl from "../../../utils/rental/getPublicUrl";
import {
  Field,
  FormModal,
  inputStyles,
  useFilePreview,
} from "../../../components/FormParts";
import { RenterAgreementPDF } from "./RenterAgreementPDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import RenterAgreement from "./RenterAgreement";

// ADDED FOR DATEPICKER
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { differenceInDays, format, parseISO } from "date-fns";

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
  // const [selectToggle, setSelectToggle] = useState(false);
  const [bookedIntervals, setBookedIntervals] = useState<
    { start: Date; end: Date }[]
  >([]);
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
    uploaded_proof: [] as string[],
  });

  const {
    register,
    handleSubmit,
    reset,
    resetField, // Restored
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RenterFormValues>({
    resolver: zodResolver(RenterFormDataSchema),
    mode: "onSubmit",
  });

  const isReadOnly = mode === "view";
  const watchedName = watch("full_name");
  const watchedSignature = watch("e_signature");
  const watchedProof = watch("uploaded_proof"); // Restored
  const watchedPlate = watch("car_plate_number");
  const watchedStartDate = watch("start_date");
  const watchedEndDate = watch("end_date");
  const watchedTotal = watch("total_price_rent");
  const watchedDownpayment = watch("downpayment");

  // Preview of a signature file the user just picked (the field holds a URL otherwise)
  const signatureFile: File | undefined =
    (watchedSignature as any) instanceof FileList
      ? (watchedSignature as any)[0]
      : undefined;
  const signaturePreview = useFilePreview(signatureFile);
  const signatureSrc =
    signaturePreview ||
    (typeof watchedSignature === "string" ? watchedSignature : "");

  //calculate balance
  useEffect(() => {
    const total = parseFloat(watchedTotal || "0");
    const down = parseFloat(watchedDownpayment || "0");
    const balance = total - down;

    // Only set value if the modal is actually open and values are numbers
    if (open && !isNaN(balance)) {
      setValue("remaining_balance", balance, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedTotal, watchedDownpayment, setValue, open]);

  useEffect(() => {
    if (open && selectedData) {
      setValue("car_plate_number", selectedData.plate_number);
      setValue("car_model", selectedData.model);
      setValue("car_type", selectedData.type);
      setValue("car_color", selectedData.color)
    }
  }, [open, selectedData, setValue]);
  // useEffect(() => {
  //   if (selectedData) {
  //     reset({
  //       full_name: selectedData.full_name,
  //       address: selectedData.address,
  //       license_number: selectedData.license_number,
  //       philhealth_number: selectedData.philhealth_number,
  //       tin_number: selectedData.tin_number,
  //       sss_number: selectedData.sss_number,
  //       pagibig_number: selectedData.pagibig_number,
  //       car_plate_number: selectedData.car_plate_number,
  //       car_model: selectedData.car_model,
  //       car_type: selectedData.car_type,
  //       start_date: selectedData.start_date,
  //       end_date: selectedData.end_date,
  //       start_time: selectedData.start_time,
  //       end_time: selectedData.end_time,
  //       duration: selectedData.duration,
  //       type_of_rent: selectedData.type_of_rent,
  //       location: selectedData.location,
  //       status: selectedData.status,
  //       e_signature: selectedData.e_signature,
  //       total_price_rent: selectedData.total_price_rent,
  //       downpayment: selectedData.downpayment,
  //       remaining_balance: Number(selectedData.remaining_balance) || 0,
  //     });
  //   }
  //   if (selectedData?.uploaded_proof) {
  //     setExistingPaths({
  //       uploaded_proof: Array.isArray(selectedData.uploaded_proof)
  //         ? selectedData.uploaded_proof
  //         : [],
  //     });
  //   }
  // }, [selectedData, reset]);
  // Fetch booked dates logic
  useEffect(() => {
    if (!watchedPlate) return;
    const fetchBookedDates = async () => {
      const { data } = await supabase
        .from("renter_booking")
        .select("start_date, end_date")
        .eq("car_plate_number", watchedPlate)
        .in("status", ["On Reservation", "On Service"])
        .neq("id", selectedData?.id || "00000000-0000-0000-0000-000000000000");

      if (data) {
        const intervals = data.map((b) => ({
          start: parseISO(b.start_date),
          end: parseISO(b.end_date),
        }));
        setBookedIntervals(intervals);
      }
    };
    fetchBookedDates();
  }, [watchedPlate, selectedData]);

  // Auto-calculate duration
  useEffect(() => {
    if (watchedStartDate && watchedEndDate) {
      const start = new Date(watchedStartDate);
      const end = new Date(watchedEndDate);
      const diff = differenceInDays(end, start);
      setValue("duration", diff > 0 ? diff.toString() : "1");
    }
  }, [watchedStartDate, watchedEndDate, setValue]);

  useEffect(() => {
    const fetchRenter = async () => {
      if(!open) return
      const { data, error } = await supabase.from("renter").select("*").is("deleted_at", null);
      if (error) {
        console.log("Failed to Fetched Renters", error);
        return;
      }
      setRenter(data || []);
    };
    fetchRenter();
  }, [open]);

  const selectedRenter = watch("full_name");
  const getGoogleDirectLink = (url: string) => {
    if (!url) return "";
    let fileId = "";
    if (url.includes("/d/")) {
      fileId = url.split("/d/")[1]?.split("/")[0];
    } else if (url.includes("id=")) {
      fileId = url.split("id=")[1]?.split("&")[0];
    }
    if (!fileId) return url;
    return `https://lh3.googleusercontent.com/u/0/d/${fileId}`;
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

      if (mode === "edit" && (selectedData as any)?.uploaded_proof) {
        const originalPaths: string[] = (selectedData as any).uploaded_proof;
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

      const cleanPayload: any = {
        ...renterData,
        uploaded_proof: finalProofArray,
      };

      if (renterData.e_signature instanceof FileList) {
        if (renterData.e_signature.length > 0) {
          delete cleanPayload.e_signature;
        } else {
          cleanPayload.e_signature = watchedSignature;
        }
      } else {
        cleanPayload.e_signature = watchedSignature;
      }

      let vehicleStatus = "Available";
      if (cleanPayload.status === "On Service") {
        vehicleStatus = "On Service";
      } else if (cleanPayload.status === "On Reservation") {
        vehicleStatus = "On Reservation";
      } else if (cleanPayload.status === "Completed") {
        vehicleStatus = "Available";
      }

      const plateNumber = cleanPayload.car_plate_number;

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

        toast.success("Updated successfully");
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
      onClose();
    } catch (err: any) {
      console.error("Error submitting form:", err);
      toast.error(err.message);
    }
  };

  const isEdit = mode === "edit";

  return (
    <FormModal
      open={open}
      title="Vehicle Rental Booking"
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      isView={isReadOnly}
      isSubmitting={isSubmitting}
      cancelLabel="Close"
      submitLabel={isEdit ? "Update Rental Details" : "Confirm & Add Rent"}
      submittingLabel={isEdit ? "Updating..." : "Processing..."}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8">
        {/* 1. Renter */}
        <div>
          <SectionLabel>1. Renter Selection</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="Full Name"
              error={errors.full_name?.message as string | undefined}
            >
              <input
                type="text"
                list="renter-list"
                {...register("full_name")}
                className={inputStyles}
                placeholder="Type to search renter..."
              />
              <datalist id="renter-list">
                {renter.map((row) => (
                  <option key={row.id} value={row.full_name} />
                ))}
              </datalist>
            </Field>

            <Field label="Address" className="md:col-span-2">
              <input
                readOnly
                {...register("address")}
                className={`${inputStyles} read-only:bg-gray-50`}
                placeholder="Address"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {[
              { label: "License No.", name: "license_number" },
              { label: "PhilHealth", name: "philhealth_number" },
              { label: "TIN", name: "tin_number" },
              { label: "SSS", name: "sss_number" },
              { label: "Pag-IBIG", name: "pagibig_number" },
            ].map((field) => (
              <Field key={field.name} label={field.label}>
                <input
                  readOnly
                  {...register(field.name as any)}
                  className={`${inputStyles} read-only:bg-gray-50`}
                />
              </Field>
            ))}
          </div>
        </div>

        {/* 2. Vehicle */}
        <div>
          <SectionLabel>2. Vehicle Information</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Plate #">
              <input
                readOnly
                {...register("car_plate_number")}
                className={`${inputStyles} read-only:bg-gray-50 font-mono font-bold`}
              />
            </Field>
            <Field label="Model">
              <input
                readOnly
                {...register("car_model")}
                className={`${inputStyles} read-only:bg-gray-50`}
              />
            </Field>
            <Field label="Type">
              <input
                readOnly
                {...register("car_type")}
                className={`${inputStyles} read-only:bg-gray-50`}
              />
            </Field>
            <Field label="Color">
              <input
                readOnly
                {...register("car_color")}
                className={`${inputStyles} read-only:bg-gray-50`}
              />
            </Field>
          </div>
        </div>

        {/* 3. Schedule */}
        <div>
          <SectionLabel>3. Rental Schedule</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Start Date" error={errors.start_date ? "Required" : undefined}>
              <DatePicker
                disabled={isReadOnly}
                selected={watchedStartDate ? new Date(watchedStartDate) : null}
                onChange={(date: Date | null) =>
                  setValue("start_date", date ? format(date, "yyyy-MM-dd") : "")
                }
                excludeDateIntervals={bookedIntervals}
                minDate={new Date()}
                placeholderText="Select start date"
                wrapperClassName="w-full"
                className={inputStyles}
              />
            </Field>

            <Field label="End Date" error={errors.end_date ? "Required" : undefined}>
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
                className={inputStyles}
              />
            </Field>

            <Field label="Duration (Days)">
              <input
                readOnly
                {...register("duration")}
                className={`${inputStyles} read-only:bg-gray-50`}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Field label="Pick Up Time">
              <input
                type="time"
                disabled={isReadOnly}
                {...register("start_time")}
                className={inputStyles}
              />
            </Field>

            <Field label="Drop Off Time">
              <input
                type="time"
                disabled={isReadOnly}
                {...register("end_time")}
                className={inputStyles}
              />
            </Field>

            <Field label="Location">
              <input
                disabled={isReadOnly}
                {...register("location")}
                className={inputStyles}
                placeholder="e.g. Baguio"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Type of Rent">
              <select
                disabled={isReadOnly}
                {...register("type_of_rent")}
                className={inputStyles}
              >
                <option value="">Choose Type</option>
                <option value="Self Drive">Self Drive</option>
                <option value="With Driver">With Driver</option>
              </select>
            </Field>

            <Field label="Booking Status">
              <select
                disabled={isReadOnly}
                {...register("status")}
                className={inputStyles}
              >
                <option value="">Select Status</option>
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
            <Field label="Total Price Rent">
              <input
                placeholder="e.g. 3000"
                disabled={isReadOnly}
                {...register("total_price_rent")}
                type="number"
                className={inputStyles}
              />
            </Field>
            <Field label="Downpayment">
              <input
                placeholder="e.g. 1000"
                disabled={isReadOnly}
                {...register("downpayment")}
                type="number"
                className={inputStyles}
              />
            </Field>
            <Field label="Remaining Balance">
              <input
                placeholder="e.g. 1000"
                readOnly
                {...register("remaining_balance")}
                type="number"
                className={`${inputStyles} read-only:bg-gray-50`}
              />
            </Field>
          </div>
        </div>

        {/* Signature + proofs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-gray-700">
                Renter Signature
              </label>
              <button
                type="button"
                onClick={() => setShowSignature(!showSignature)}
                className="text-xs font-bold text-blue-600"
              >
                {showSignature ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
            {showSignature && watchedSignature && (
              <div className="space-y-3 text-center">
                <div className="bg-white border border-gray-200 rounded-lg p-2 flex justify-center">
                  <img
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    src={signatureSrc}
                    alt="Signature"
                    className="h-20 object-contain"
                  />
                </div>
                {!isReadOnly && (
                  <input
                    type="file"
                    {...register("e_signature")}
                    className={fileInputStyles}
                    accept="image/*"
                  />
                )}
              </div>
            )}
          </div>

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

        {/* Signed agreement (view only) */}
        {isReadOnly && (
          <div className="space-y-4 border-t border-gray-100 pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowAgreement(!showAgreement)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
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
                fileName={`Rental_Agreement_${watchedName}.pdf`}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center transition-all"
              >
                {({ loading }) => (loading ? "Generating PDF..." : "Download as PDF")}
              </PDFDownloadLink>
            </div>
            {showAgreement && (
              <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-inner">
                <RenterAgreement
                  full_name={watchedName}
                  signatureUrl={watchedSignature}
                />
              </div>
            )}
          </div>
        )}

        {/* Remarks */}
        <Field label="Remarks / Notes">
          <input
            disabled={isReadOnly}
            placeholder="Notes"
            {...register("remarks")}
            type="text"
            className={inputStyles}
          />
        </Field>
      </div>
    </FormModal>
  );
};

export default VehicleRenterForm;