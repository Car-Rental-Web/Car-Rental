/* eslint-disable @typescript-eslint/no-explicit-any */
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

// ADDED FOR DATEPICKER
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { differenceInDays, format, parseISO } from "date-fns";

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
    formState: { errors },
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
      const { data, error } = await supabase.from("renter").select("*");
      if (error) {
        console.log("Failed to Fetched Renters", error);
        return;
      }
      setRenter(data);
    };
    fetchRenter();
  }, []);

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

  const inputStyles =
    "w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all read-only:bg-gray-50 text-gray-800";
  const labelStyles = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div
      className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-1300 justify-center items-center p-4 ${open ? "flex" : "hidden"}`}
    >
      <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-8 py-5 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-slate-800">
            Vehicle Rental Booking
          </h2>
          <ModalButton type="button" onclick={onClose} />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto p-8 flex-1 space-y-6"
        >
          <div className="space-y-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b pb-2">
              1. Renter Selection
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className={labelStyles}>Full Name</label>
                <div
                  className="relative"
                  onClick={() => setSelectToggle(!selectToggle)}
                >
                  <select
                    {...register("full_name")}
                    className={`${inputStyles} appearance-none cursor-pointer`}
                  >
                    <option value="">Select A Renter</option>
                    {renter.map((row) => (
                      <option key={row.id} value={row.full_name}>
                        {row.full_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                    {selectToggle ? <icons.up /> : <icons.down />}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelStyles}>Address</label>
                <input
                  readOnly
                  {...register("address")}
                  className={inputStyles}
                  placeholder="Address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "License No.", name: "license_number" },
                { label: "PhilHealth", name: "philhealth_number" },
                { label: "TIN", name: "tin_number" },
                { label: "SSS", name: "sss_number" },
                { label: "Pagibig", name: "pagibig_number" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="text-[11px] font-bold text-gray-500 uppercase">
                    {field.label}
                  </label>
                  <input
                    readOnly
                    {...register(field.name as any)}
                    className={`${inputStyles} py-2 text-sm bg-gray-50`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b pb-2">
              2. Vehicle Information
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className={labelStyles}>Plate #</label>
                <input
                  readOnly
                  {...register("car_plate_number")}
                  className={`${inputStyles} font-mono font-bold bg-white`}
                />
              </div>
              <div>
                <label className={labelStyles}>Model</label>
                <input
                  readOnly
                  {...register("car_model")}
                  className={`${inputStyles} bg-white`}
                />
              </div>
              <div>
                <label className={labelStyles}>Type</label>
                <input
                  readOnly
                  {...register("car_type")}
                  className={`${inputStyles} bg-white`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b pb-2">
              3. Rental Schedule
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="w-full">
                  <label className={labelStyles}>Start Date</label>
                  <DatePicker
                    disabled={isReadOnly}
                    selected={
                      watchedStartDate ? new Date(watchedStartDate) : null
                    }
                    onChange={(date: Date | null) =>
                      setValue(
                        "start_date",
                        date ? format(date, "yyyy-MM-dd") : "",
                      )
                    }
                    excludeDateIntervals={bookedIntervals}
                    minDate={new Date()}
                    placeholderText="Select start date"
                    className={inputStyles}
                  />
                  {errors.start_date && (
                    <p className="text-red-500 text-xs mt-1">Required</p>
                  )}
                </div>
                <div className="w-full">
                  <label className={labelStyles}>End Date</label>
                  <DatePicker
                    disabled={isReadOnly || !watchedStartDate}
                    selected={watchedEndDate ? new Date(watchedEndDate) : null}
                    onChange={(date: Date | null) =>
                      setValue(
                        "end_date",
                        date ? format(date, "yyyy-MM-dd") : "",
                      )
                    }
                    excludeDateIntervals={bookedIntervals}
                    minDate={
                      watchedStartDate ? new Date(watchedStartDate) : new Date()
                    }
                    placeholderText="Select end date"
                    className={` w-full ${inputStyles}`}
                  />
                  {errors.end_date && (
                    <p className="text-red-500 text-xs mt-1">Required</p>
                  )}
                </div>
                <div>
                  <label className={labelStyles}>Duration (Days)</label>
                  <input
                    readOnly
                    {...register("duration")}
                    className={inputStyles}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="md:flex w-full gap-4">
                <div className="w-full">
                  <label className={labelStyles}>Pick Up Time</label>
                  <input
                    type="time"
                    disabled={isReadOnly}
                    {...register("start_time")}
                    className={inputStyles}
                  />
                </div>
                <div className="w-full">
                  <label className={labelStyles}>Drop Off Time</label>
                  <input
                    type="time"
                    disabled={isReadOnly}
                    {...register("end_time")}
                    className={inputStyles}
                  />
                </div>
                <div className="w-full">
                  <label className={labelStyles}>Location</label>
                  <input
                    disabled={isReadOnly}
                    {...register("location")}
                    className={inputStyles}
                    placeholder="Ex: Baguio"
                  />
                </div>
              </div>

              <div className="flex w-full gap-4 pt-4">
                <div className="w-full relative">
                  <label className={labelStyles}>Type of Rent</label>
                  <select
                    disabled={isReadOnly}
                    {...register("type_of_rent")}
                    className={`${inputStyles} font-bold appearance-none`}
                  >
                    <option value="">Choose Type</option>
                    <option value="Self Drive">Self Drive</option>
                    <option value="With Driver">With Driver</option>
                  </select>
                  <icons.down className="absolute right-4 bottom-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="w-full">
                  <label className={labelStyles}>Booking Status</label>
                  <select
                    disabled={isReadOnly}
                    {...register("status")}
                    className={`${inputStyles} font-bold`}
                  >
                    <option value="">Select Status</option>
                    <option value="On Service">On Service</option>
                    <option value="On Reservation">On Reservation</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b pb-2">
            4. Payment
          </h3>
          <div className="flex gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex flex-col w-full">
              <label className={labelStyles}>Total Price Rent</label>
              <input
                placeholder="ex: 3000"
                disabled={isReadOnly}
                {...register("total_price_rent")}
                type="number"
                className={inputStyles}
              />
              {/* <ErrorMessage field="total_price_rent" /> */}
            </div>
            <div className="flex flex-col w-full">
              <label className={labelStyles}>Downpayment</label>
              <input
                placeholder="ex: 1000"
                disabled={isReadOnly}
                {...register("downpayment")}
                type="number"
                className={inputStyles}
              />
              {/* <ErrorMessage field="downpayment" /> */}
            </div>
            <div className="flex flex-col w-full">
              <label className={labelStyles}>Remaining Balance</label>
              <input
                placeholder="ex: 1000"
                readOnly
                {...register("remaining_balance")}
                type="number"
                className={inputStyles}
              />
              {/* <ErrorMessage field="downpayment" /> */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="p-4 bg-slate-50 border rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-slate-700">
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
                  <div className="bg-white border rounded p-2 flex justify-center">
                    <img
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      src={watchedSignature}
                      alt="Signature"
                      className="h-20 object-contain"
                    />
                  </div>
                  {!isReadOnly && (
                    <input
                      type="file"
                      {...register("e_signature")}
                      className="text-xs"
                      accept="image/*"
                    />
                  )}
                </div>
              )}
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
                  <input
                    type="file"
                    {...register("uploaded_proof")}
                    multiple
                    accept="image/*"
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-blue-500 file:text-blue-700 hover:file:bg-blue-300"
                  />
                )}
              </div>
            </div>
          </div>

          {isReadOnly && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setShowAgreement(!showAgreement)}
                  className="flex-1 px-4 py-3 border rounded-lg font-bold text-slate-700 hover:bg-gray-50"
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
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold text-center"
                >
                  {({ loading }) =>
                    loading ? "Generating PDF..." : "Download as PDF"
                  }
                </PDFDownloadLink>
              </div>
              {showAgreement && (
                <div className="p-6 border rounded-xl bg-white shadow-inner">
                  <RenterAgreement
                    full_name={watchedName}
                    signatureUrl={watchedSignature}
                  />
                </div>
              )}
            </div>
          )}
        </form>

        <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-white transition-all"
          >
            Close
          </button>
          {!isReadOnly && (
            <button
              onClick={handleSubmit(onSubmit)}
              className="flex-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              {mode === "edit" ? "Update Rental Details" : "Confirm & Add Rent"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleRenterForm;
