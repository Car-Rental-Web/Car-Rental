/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseLaundry as supabase } from "../../../utils/supabase";
import {
  ACTIVE_BOOKING_STATUSES,
  syncMachineStatus,
} from "../../../utils/laundry/syncMachineStatus";
import icons from "../../../constants/icon";
import type { LaundryMachineData } from "./MachineForm";

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
  customer_id: string | null;
  machine_id: string | null;
  machine_name: string | null;
  price: number | null;
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

interface ServiceOption {
  id: string;
  service_name: string | null;
  price: number | null;
}

// A time range that is already taken on this machine
interface TakenSlot {
  id: string;
  who: string;
  status: string;
  from: string; // "YYYY-MM-DDTHH:MM"
  to: string;
}

const BookingSchema = z
  .object({
    customer_id: z.string().optional(), // only used in create mode
    service_id: z.string().optional(),
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
      new Date(`${d.end_date}T${d.end_time}`).getTime() >
      new Date(`${d.start_date}T${d.start_time}`).getTime(),
    { message: "End must be after the start", path: ["end_date"] },
  );
type BookingValues = z.infer<typeof BookingSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "edit" | "view";
  machine?: LaundryMachineData | null; // create mode: the machine being booked
  presetServiceId?: string | null; // create mode: start with this service picked
  booking?: LaundryBookingData | null; // edit / view mode: the booking
  onSuccess?: () => void;
}

const inputStyles =
  "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500";
const labelStyles = "block text-sm font-semibold text-gray-700 mb-1";

/* ---------------- Time helpers ---------------- */

// Every 30 minutes: "00:00", "00:30", ... "23:30"
const TIME_SLOTS = Array.from(
  { length: 48 },
  (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
);

const label12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const labelSlot = (instant: string) => {
  const [date, time] = instant.split("T");
  const day = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${day} ${label12(time)}`;
};

const toLocalParts = (d: Date) => ({
  date: d.toLocaleDateString("en-CA"),
  time: d.toTimeString().slice(0, 5),
});

// Next half hour from now
const defaultStart = () => {
  const d = new Date();
  const minutes = Math.ceil((d.getHours() * 60 + d.getMinutes()) / 30) * 30;
  d.setHours(0, minutes, 0, 0); // minutes can roll over into the next day
  return toLocalParts(d);
};

const addMinutes = (date: string, time: string, minutes: number) => {
  const d = new Date(`${date}T${time}`);
  d.setMinutes(d.getMinutes() + minutes);
  return toLocalParts(d);
};

const ErrorText = ({ message }: { message?: string }) =>
  message ? (
    <p className="text-red-500 text-[10px] mt-1 font-bold">{message}</p>
  ) : null;

const ServiceBookingForm: React.FC<Props> = ({
  open,
  onClose,
  mode = "create",
  machine,
  presetServiceId,
  booking,
  onSuccess,
}) => {
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [taken, setTaken] = useState<TakenSlot[]>([]);

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
  const serviceId = watch("service_id");
  const startDate = watch("start_date");
  const startTime = watch("start_time");
  const endDate = watch("end_date");
  const endTime = watch("end_time");
  const watchedProof = watch("uploaded_proof");
  const watchedType = watch("type_of_service");
  const watchedStatus = watch("status");

  // The machine this booking is for
  const machineId = isCreate ? machine?.id : booking?.machine_id;
  const machineName = isCreate ? machine?.machine_name : booking?.machine_name;

  const customer = customers.find((c) => c.id === customerId) || null;

  // Price shown on the form: the picked service's price when booking,
  // the saved price when editing (unless the service was changed)
  const pickedService = services.find((x) => x.id === serviceId);
  const displayPrice =
    isCreate || (pickedService && pickedService.id !== booking?.service_id)
      ? pickedService?.price
      : booking?.price;

  const customerName = isCreate ? customer?.full_name : booking?.full_name;
  const customerAddress = isCreate ? customer?.address : booking?.address;
  const customerPhone = isCreate ? customer?.phone_number : booking?.phone_number;
  const customerSignature = isCreate
    ? customer?.e_signature
    : booking?.e_signature;

  // Keep a saved value selectable even if it's no longer in the lists above
  const typeOptions =
    booking?.type_of_service && !SERVICE_TYPES.includes(booking.type_of_service)
      ? [booking.type_of_service, ...SERVICE_TYPES]
      : SERVICE_TYPES;
  const statusOptions =
    booking?.status && !BOOKING_STATUSES.includes(booking.status)
      ? [booking.status, ...BOOKING_STATUSES]
      : BOOKING_STATUSES;

  const slotsWith = (current?: string) =>
    current && !TIME_SLOTS.includes(current) ? [current, ...TIME_SLOTS] : TIME_SLOTS;

  /* ---------------- Availability ---------------- */
  const startInstant = startDate && startTime ? `${startDate}T${startTime}` : "";

  // A start time is blocked if it falls inside an existing booking
  // (starting exactly when another one ends is fine)
  const isStartBlocked = (time: string) => {
    const t = `${startDate}T${time}`;
    return taken.some((b) => b.from <= t && t < b.to);
  };

  // An end time is blocked if it isn't after the start, or if the run
  // from the start to that time would overlap an existing booking
  const isEndBlocked = (time: string) => {
    const t = `${endDate}T${time}`;
    if (startInstant && t <= startInstant) return true;
    return taken.some((b) => startInstant < b.to && t > b.from);
  };

  const overlaps = (start: string, end: string) =>
    taken.find((b) => start < b.to && end > b.from);

  const activeNow = watchedStatus !== "Completed";
  const startBlocked =
    activeNow && !!startTime && !!startDate && isStartBlocked(startTime);
  const clash =
    activeNow && startInstant && endDate && endTime
      ? overlaps(startInstant, `${endDate}T${endTime}`)
      : undefined;

  // Duration is calculated from the schedule
  const duration = useMemo(() => {
    if (!startDate || !startTime || !endDate || !endTime) return "";
    const ms =
      new Date(`${endDate}T${endTime}`).getTime() -
      new Date(`${startDate}T${startTime}`).getTime();
    if (isNaN(ms) || ms <= 0) return "";
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

  /* ---------------- Loading data ---------------- */
  const fetchTaken = async (): Promise<TakenSlot[]> => {
    if (!machineId) return [];

    const { data, error } = await supabase
      .from("laundry_booking")
      .select("id, full_name, status, start_date, start_time, end_date, end_time")
      .eq("machine_id", machineId)
      .in("status", ACTIVE_BOOKING_STATUSES)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("taken slots error:", error);
      toast.error(`Error checking the machine's schedule: ${error.message}`);
      return [];
    }

    return (data || [])
      .filter((b: any) => b.id !== booking?.id && b.start_date && b.end_date)
      .map((b: any) => ({
        id: b.id,
        who: b.full_name || "Customer",
        status: b.status,
        from: `${b.start_date}T${(b.start_time || "00:00").slice(0, 5)}`,
        to: `${b.end_date}T${(b.end_time || "00:00").slice(0, 5)}`,
      }));
  };

  // Reset the form each time it opens, and load what it needs
  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      const start = defaultStart();
      const end = addMinutes(start.date, start.time, 60);
      reset({
        customer_id: "",
        service_id: presetServiceId ?? "",
        type_of_service: SERVICE_TYPES[0],
        start_date: start.date,
        start_time: start.time,
        end_date: end.date,
        end_time: end.time,
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
        service_id: booking.service_id ?? "",
        type_of_service: booking.type_of_service ?? SERVICE_TYPES[0],
        start_date: booking.start_date ?? "",
        start_time: (booking.start_time ?? "").slice(0, 5), // "08:00:00" -> "08:00"
        end_date: booking.end_date ?? "",
        end_time: (booking.end_time ?? "").slice(0, 5),
        status: booking.status ?? BOOKING_STATUSES[0],
        uploaded_proof: undefined,
      });
    }

    const fetchServices = async () => {
      const { data, error } = await supabase
        .from("laundry_service")
        .select("id, service_name, price")
        .order("service_name", { ascending: true });

      if (error) {
        console.error("laundry_service error:", error);
        toast.error(`Error fetching services: ${error.message}`);
        return;
      }
      setServices(data || []);
    };

    fetchServices();
    fetchTaken().then(setTaken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isCreate, booking, machineId, presetServiceId, reset]);

  const getPathFromUrl = (url: string) => url.split(`${PROOF_BUCKET}/`)[1];

  /* ---------------- Submit ---------------- */
  const onSubmit = async (data: BookingValues) => {
    if (isView) return;

    const chosenService = services.find((s) => s.id === data.service_id);

    if (isCreate) {
      if (!machine) return;
      if (!customer) {
        setError("customer_id", { message: "Select a customer" });
        return;
      }
      if (!chosenService) {
        setError("service_id", { message: "Select a service" });
        return;
      }
    }
    if (isEdit && !booking) return;

    // Check the schedule again against fresh data, in case someone
    // else booked this machine while the form was open
    if (data.status !== "Completed" && machineId) {
      const fresh = await fetchTaken();
      setTaken(fresh);
      const conflict = fresh.find(
        (b) =>
          `${data.start_date}T${data.start_time}` < b.to &&
          `${data.end_date}T${data.end_time}` > b.from,
      );
      if (conflict) {
        toast.error(
          `${machineName} is already booked ${labelSlot(conflict.from)} to ${labelSlot(conflict.to)}.`,
        );
        return;
      }
    }

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
        const serviceChange = chosenService
          ? {
              service_id: chosenService.id,
              laundry_service: chosenService.service_name,
              // keep the saved price unless a different service was picked
              ...(chosenService.id !== booking.service_id
                ? { price: chosenService.price ?? 0 }
                : {}),
            }
          : {};

        const { error } = await supabase
          .from("laundry_booking")
          .update({ ...schedule, ...serviceChange })
          .eq("id", booking.id);
        if (error) throw error;

        if (proofFile && oldProofUrl) {
          const oldPath = getPathFromUrl(oldProofUrl);
          if (oldPath) await supabase.storage.from(PROOF_BUCKET).remove([oldPath]);
        }

        // Status may have changed (e.g. to Completed)
        await syncMachineStatus(booking.machine_id);

        toast.success("Booking updated!");
      } else if (machine && customer && chosenService) {
        // ---------- CREATE ----------
        const { error } = await supabase.from("laundry_booking").insert([
          {
            customer_id: customer.id,
            full_name: customer.full_name,
            address: customer.address,
            phone_number: customer.phone_number,
            machine_id: machine.id,
            machine_name: machine.machine_name,
            service_id: chosenService.id,
            laundry_service: chosenService.service_name,
            price: chosenService.price ?? 0,
            e_signature: customer.e_signature, // copied from the customer's profile
            ...schedule,
          },
        ]);
        if (error) throw error;

        // The machine is now booked, so update its status
        await syncMachineStatus(machine.id);

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
          toast.success("Machine booked!");
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
  if (isCreate && !machine) return null;
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
                : "Book Machine"}
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
          {/* Machine summary (read only) */}
          <div className="sm:col-span-2 bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                <icons.laundry className="text-2xl text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Machine
                </p>
                <p className="font-bold text-gray-900">{machineName || "N/A"}</p>
              </div>
            </div>

            {/* What is already booked on this machine */}
            <div className="mt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Already booked
              </p>
              {taken.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No upcoming bookings. Any time is free.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {taken.map((b) => (
                    <span
                      key={b.id}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        b.status === "On Service"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}
                      title={b.who}
                    >
                      {labelSlot(b.from)} → {labelSlot(b.to)} · {b.status}
                    </span>
                  ))}
                </div>
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

          {/* Service */}
          <div>
            <label className={labelStyles}>Service</label>
            <select
              disabled={isView}
              {...register("service_id")}
              value={serviceId ?? ""}
              className={inputStyles}
            >
              <option value="">
                {isEdit && booking?.laundry_service
                  ? `${booking.laundry_service} (current)`
                  : services.length === 0
                    ? "No services yet"
                    : "Select a service"}
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.service_name} — ₱{(Number(s.price) || 0).toLocaleString()}
                </option>
              ))}
            </select>
            <ErrorText message={errors.service_id?.message} />
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

          {/* Price (copied from the service) */}
          <div>
            <label className={labelStyles}>Price</label>
            <input
              disabled
              value={`₱${(Number(displayPrice) || 0).toLocaleString()}`}
              className={inputStyles}
            />
          </div>

          {/* Schedule: times that are already taken are disabled */}
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
            <select
              disabled={isView}
              {...register("start_time")}
              value={startTime ?? ""}
              className={inputStyles}
            >
              {slotsWith(startTime).map((t) => {
                const blocked = activeNow && isStartBlocked(t);
                return (
                  <option key={t} value={t} disabled={blocked}>
                    {label12(t)}
                    {blocked ? " (booked)" : ""}
                  </option>
                );
              })}
            </select>
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
            <select
              disabled={isView}
              {...register("end_time")}
              value={endTime ?? ""}
              className={inputStyles}
            >
              {slotsWith(endTime).map((t) => {
                const blocked = activeNow && isEndBlocked(t);
                return (
                  <option key={t} value={t} disabled={blocked}>
                    {label12(t)}
                    {blocked ? " (unavailable)" : ""}
                  </option>
                );
              })}
            </select>
            <ErrorText message={errors.end_time?.message} />
          </div>

          {(startBlocked || clash) && !isView && (
            <p className="sm:col-span-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {clash
                ? `This overlaps a booking on ${machineName} (${labelSlot(clash.from)} to ${labelSlot(clash.to)}). Pick a different time.`
                : "That start time is already booked. Pick a different time."}
            </p>
          )}

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
              disabled={isSubmitting || startBlocked || !!clash}
              className="flex-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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