/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../../utils/supabase";
import { syncServiceStatus } from "../../../utils/laundry/syncServiceStatus";
import type { LaundryServiceData } from "./ServiceForm";
import icons from "../../../constants/icon";

const PROOF_BUCKET = "uploaded_proof"; // must be a PUBLIC bucket in the laundry project

// Edit these lists to match how you run the shop
export const SERVICE_TYPES = ["Drop-off", "Pick-up & Delivery", "Self-service"];
export const BOOKING_STATUSES = ["On Reservation", "On Service", "Completed"];

// Matches the columns of the `laundry_booking` table
export interface LaundryBookingData {
  id: string;
  created_at: string;
  full_name: string | null;
  address: string | null;
  phone_number: string | null;
  laundry_service: string | null;
  service_id: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  type_of_service: string | null;
  duration: string | null;
  status: string | null;
  uploaded_proof: string | null;
  e_signature: string | null;
}

interface CustomerOption {
  id: string;
  full_name: string | null;
  address: string | null;
  phone_number: string | null;
  e_signature: string | null;
}

const BookingSchema = z
  .object({
    customer_id: z.string().optional(), // only used in create mode
    type_of_service: z.string().min(1, "Select a type of service"),
    start_date: z.string().min(1, "Start date is required"),
    start_time: z.string().min(1, "Start time is required"),
    end_date: z.string().min(1, "End date is required"),
    end_time: z.string().min(1, "End time is required"),
    status: z.string().min(1, "Select a status"),
    uploaded_proof: z.any().optional(),
  })
  .refine(
    (d) =>
      new Date(`${d.end_date}T${d.end_time}`).getTime() >=
      new Date(`${d.start_date}T${d.start_time}`).getTime(),
    { message: "End must be after the start", path: ["end_date"] },
  );
type BookingValues = z.infer<typeof BookingSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "edit" | "view";
  service?: LaundryServiceData | null; // create mode: the service being booked
  booking?: LaundryBookingData | null; // edit / view mode: the booking
  onSuccess?: () => void;
}

const inputStyles =
  "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500";
const labelStyles = "block text-sm font-semibold text-gray-700 mb-1";

// Local date/time (toISOString would give the UTC date)
const todayLocal = () => new Date().toLocaleDateString("en-CA");
const nowLocal = () => new Date().toTimeString().slice(0, 5);

const ErrorText = ({ message }: { message?: string }) =>
  message ? (
    <p className="text-red-500 text-[10px] mt-1 font-bold">{message}</p>
  ) : null;

const ServiceBookingForm: React.FC<Props> = ({
  open,
  onClose,
  mode = "create",
  service,
  booking,
  onSuccess,
}) => {
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(BookingSchema),
  });

  const customerId = watch("customer_id");
  const startDate = watch("start_date");
  const startTime = watch("start_time");
  const endDate = watch("end_date");
  const endTime = watch("end_time");
  const watchedProof = watch("uploaded_proof");
  const watchedType = watch("type_of_service");
  const watchedStatus = watch("status");

  const customer = customers.find((c) => c.id === customerId) || null;

  // Who is this booking for? (picked customer in create mode, saved data otherwise)
  const customerName = isCreate ? customer?.full_name : booking?.full_name;
  const customerAddress = isCreate ? customer?.address : booking?.address;
  const customerPhone = isCreate ? customer?.phone_number : booking?.phone_number;
  const customerSignature = isCreate
    ? customer?.e_signature
    : booking?.e_signature;

  const serviceName = service?.service_name ?? booking?.laundry_service ?? "";

  // Keep a saved value selectable even if it's no longer in the lists above
  const typeOptions =
    booking?.type_of_service && !SERVICE_TYPES.includes(booking.type_of_service)
      ? [booking.type_of_service, ...SERVICE_TYPES]
      : SERVICE_TYPES;
  const statusOptions =
    booking?.status && !BOOKING_STATUSES.includes(booking.status)
      ? [booking.status, ...BOOKING_STATUSES]
      : BOOKING_STATUSES;

  // Duration is calculated from the schedule
  const duration = useMemo(() => {
    if (!startDate || !startTime || !endDate || !endTime) return "";
    const ms =
      new Date(`${endDate}T${endTime}`).getTime() -
      new Date(`${startDate}T${startTime}`).getTime();
    if (isNaN(ms) || ms < 0) return "";
    const hours = Math.max(Math.ceil(ms / 36e5), 1);
    return hours < 24 ? `${hours} hr/s` : `${Math.ceil(hours / 24)} day/s`;
  }, [startDate, startTime, endDate, endTime]);

  // Proof preview: newly picked file first, otherwise the saved image
  const proofFile: File | undefined =
    watchedProof?.[0] instanceof File ? watchedProof[0] : undefined;
  const [proofObjectUrl, setProofObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!proofFile) {
      setProofObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setProofObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const proofPreview = proofObjectUrl || booking?.uploaded_proof || null;

  // Reset the form each time it opens (and fetch customers when booking)
  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      reset({
        customer_id: "",
        type_of_service: SERVICE_TYPES[0],
        start_date: todayLocal(),
        start_time: nowLocal(),
        end_date: todayLocal(),
        end_time: nowLocal(),
        status: BOOKING_STATUSES[0],
        uploaded_proof: undefined,
      });

      const fetchCustomers = async () => {
        const { data, error } = await supabase
          .from("customer_profile")
          .select("id, full_name, address, phone_number, e_signature")
          .is("deleted_at", null)
          .order("full_name", { ascending: true });

        if (error) {
          console.error("customer_profile error:", error);
          toast.error(`Error fetching customers: ${error.message}`);
          return;
        }
        setCustomers(data || []);
      };
      fetchCustomers();
    } else if (booking) {
      reset({
        customer_id: "",
        type_of_service: booking.type_of_service ?? SERVICE_TYPES[0],
        start_date: booking.start_date ?? "",
        start_time: (booking.start_time ?? "").slice(0, 5), // "08:00:00" -> "08:00"
        end_date: booking.end_date ?? "",
        end_time: (booking.end_time ?? "").slice(0, 5),
        status: booking.status ?? BOOKING_STATUSES[0],
        uploaded_proof: undefined,
      });
    }
  }, [open, isCreate, booking, reset]);

  const getPathFromUrl = (url: string) => url.split(`${PROOF_BUCKET}/`)[1];

  const onSubmit = async (data: BookingValues) => {
    if (isView) return;

    if (isCreate && (!service || !customer)) {
      setError("customer_id", { message: "Select a customer" });
      return;
    }
    if (isEdit && !booking) return;

    let uploadedPath: string | null = null;

    try {
      // 1. Optional proof upload (upload first, so a failed upload never loses the old one)
      let proofUrl: string | null = booking?.uploaded_proof ?? null;
      const oldProofUrl = booking?.uploaded_proof ?? null;

      if (proofFile) {
        const ext = proofFile.name.split(".").pop();
        uploadedPath = `${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(PROOF_BUCKET)
          .upload(uploadedPath, proofFile);
        if (uploadError) throw uploadError;

        proofUrl = supabase.storage.from(PROOF_BUCKET).getPublicUrl(uploadedPath)
          .data.publicUrl;
      }

      const schedule = {
        type_of_service: data.type_of_service,
        start_date: data.start_date,
        end_date: data.end_date,
        start_time: data.start_time,
        end_time: data.end_time,
        duration,
        status: data.status,
        uploaded_proof: proofUrl,
      };

      if (isEdit && booking) {
        // ---------- EDIT ----------
        const { error } = await supabase
          .from("laundry_booking")
          .update(schedule)
          .eq("id", booking.id);
        if (error) throw error;

        // Status may have changed (e.g. to Completed)
        await syncServiceStatus(booking.service_id);

        if (proofFile && oldProofUrl) {
          const oldPath = getPathFromUrl(oldProofUrl);
          if (oldPath) await supabase.storage.from(PROOF_BUCKET).remove([oldPath]);
        }

        toast.success("Booking updated!");
      } else if (service && customer) {
        // ---------- CREATE ----------
        const { error } = await supabase.from("laundry_booking").insert([
          {
            full_name: customer.full_name,
            address: customer.address,
            phone_number: customer.phone_number,
            laundry_service: service.service_name,
            service_id: service.id,
            e_signature: customer.e_signature, // copied from the customer's profile
            ...schedule,
          },
        ]);
        if (error) throw error;

        // The service is now booked, so update its status
        await syncServiceStatus(service.id);

        // Update the customer's stats
        const { data: fresh } = await supabase
          .from("customer_profile")
          .select("times_service")
          .eq("id", customer.id)
          .single();

        const { error: statsError } = await supabase
          .from("customer_profile")
          .update({
            times_service: (fresh?.times_service ?? 0) + 1,
            last_date_service: data.start_date,
          })
          .eq("id", customer.id);

        if (statsError) {
          console.error("customer stats error:", statsError);
          toast.warning("Booked, but the customer's service count wasn't updated");
        } else {
          toast.success("Service booked!");
        }
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Booking error:", error);
      // Don't leave an orphan proof image if saving failed
      if (uploadedPath) {
        await supabase.storage.from(PROOF_BUCKET).remove([uploadedPath]);
      }
      toast.error(error.message || "Something went wrong");
    }
  };

  if (!open) return null;
  if (isCreate && !service) return null;
  if (!isCreate && !booking) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1300 flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full max-w-2xl max-h-full overflow-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isView
              ? "Booking Details"
              : isEdit
                ? "Edit Booking"
                : "Book Service"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <icons.closeModal size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Service summary (read only) */}
          <div className="sm:col-span-2 flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
              {service?.service_image ? (
                <img
                  src={service.service_image}
                  alt={serviceName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <icons.laundry className="text-2xl text-gray-300" />
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900">{serviceName || "N/A"}</p>
              {service?.machine_name && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Machine:{" "}
                  <span className="font-semibold text-gray-700">
                    {service.machine_name}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="sm:col-span-2">
            <label className={labelStyles}>Customer</label>
            {isCreate ? (
              <>
                <select {...register("customer_id")} className={inputStyles}>
                  <option value="">
                    {customers.length === 0
                      ? "No customers found"
                      : "Select a customer"}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                      {c.phone_number ? ` — ${c.phone_number}` : ""}
                    </option>
                  ))}
                </select>
                <ErrorText message={errors.customer_id?.message} />
                {customers.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Register the customer first on the Customers page.
                  </p>
                )}
              </>
            ) : (
              <input disabled value={customerName || ""} className={inputStyles} />
            )}
          </div>

          {/* Customer details */}
          <div>
            <label className={labelStyles}>Address</label>
            <input
              disabled
              value={customerAddress || ""}
              placeholder="Filled from the customer profile"
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Phone Number</label>
            <input
              disabled
              value={customerPhone || ""}
              placeholder="Filled from the customer profile"
              className={inputStyles}
            />
          </div>

          {/* Type of service */}
          <div>
            <label className={labelStyles}>Type of Service</label>
            <select
              disabled={isView}
              {...register("type_of_service")}
              value={watchedType ?? ""}
              className={inputStyles}
            >
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ErrorText message={errors.type_of_service?.message} />
          </div>

          {/* Status */}
          <div>
            <label className={labelStyles}>Status</label>
            <select
              disabled={isView}
              {...register("status")}
              value={watchedStatus ?? ""}
              className={inputStyles}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ErrorText message={errors.status?.message} />
          </div>

          {/* Schedule */}
          <div>
            <label className={labelStyles}>Start Date</label>
            <input
              disabled={isView}
              type="date"
              {...register("start_date")}
              className={inputStyles}
            />
            <ErrorText message={errors.start_date?.message} />
          </div>
          <div>
            <label className={labelStyles}>Start Time</label>
            <input
              disabled={isView}
              type="time"
              {...register("start_time")}
              className={inputStyles}
            />
            <ErrorText message={errors.start_time?.message} />
          </div>
          <div>
            <label className={labelStyles}>End Date</label>
            <input
              disabled={isView}
              type="date"
              {...register("end_date")}
              className={inputStyles}
            />
            <ErrorText message={errors.end_date?.message} />
          </div>
          <div>
            <label className={labelStyles}>End Time</label>
            <input
              disabled={isView}
              type="time"
              {...register("end_time")}
              className={inputStyles}
            />
            <ErrorText message={errors.end_time?.message} />
          </div>

          <div className="sm:col-span-2">
            <label className={labelStyles}>Duration</label>
            <input
              disabled
              value={duration}
              placeholder="Calculated from the schedule"
              className={inputStyles}
            />
          </div>

          {/* Proof */}
          <div className="sm:col-span-2 border-t pt-4">
            <label className={labelStyles}>Proof of Transaction (optional)</label>
            {!isView && (
              <input
                type="file"
                accept="image/*"
                {...register("uploaded_proof")}
                className="w-full text-xs text-gray-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            )}
            {proofPreview ? (
              <img
                src={proofPreview}
                alt="Proof"
                className="max-h-40 rounded-lg border border-gray-200 object-contain"
              />
            ) : (
              isView && (
                <p className="text-xs italic text-gray-400">No proof uploaded</p>
              )
            )}
          </div>

          {/* Signature status */}
          {(customer || booking) && (
            <p
              className={`sm:col-span-2 text-[11px] font-semibold ${
                customerSignature ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {customerSignature
                ? "E-signature on file is attached to this booking."
                : "This customer has no e-signature on file."}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
          >
            {isView ? "Close" : "Cancel"}
          </button>
          {!isView && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Confirm Booking"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ServiceBookingForm;