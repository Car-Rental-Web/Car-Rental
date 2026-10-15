import { supabaseLaundry as supabase } from "../supabase";

// Booking statuses that keep a service busy
const ACTIVE_BOOKING_STATUSES = ["On Service", "On Reservation"];

/**
 * Recomputes a service's status from its bookings:
 *   any booking "On Service"      -> "On Service"
 *   else any "On Reservation"     -> "On Reservation"
 *   else                          -> "Available"
 *
 * "On Maintenance" is set by hand and is never overwritten.
 * Needs the `service_id` column on `laundry_booking`.
 */
export const syncServiceStatus = async (serviceId?: string | null) => {
  if (!serviceId) return;

  try {
    const { data: service, error: serviceError } = await supabase
      .from("laundry_service")
      .select("id, status")
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceError) throw serviceError;
    if (!service || service.status === "On Maintenance") return;

    const { data: active, error: bookingError } = await supabase
      .from("laundry_booking")
      .select("status")
      .eq("service_id", serviceId)
      .in("status", ACTIVE_BOOKING_STATUSES);

    if (bookingError) throw bookingError;

    const next = active?.some((b) => b.status === "On Service")
      ? "On Service"
      : active && active.length > 0
        ? "On Reservation"
        : "Available";

    if (next !== service.status) {
      const { error } = await supabase
        .from("laundry_service")
        .update({ status: next })
        .eq("id", serviceId);
      if (error) throw error;
    }
  } catch (error) {
    console.error("syncServiceStatus error:", error);
  }
};

/**
 * Applies a machine's maintenance state to every service that runs on it.
 *   machine has an ongoing maintenance record -> its services become "On Maintenance"
 *   no ongoing record                         -> its services go back to their real
 *                                                status (Available / On Reservation / On Service)
 * Call it whenever a maintenance record is created, edited, completed or deleted.
 */
export const syncMachineMaintenance = async (machineName?: string | null) => {
  if (!machineName) return;

  try {
    const { count, error: countError } = await supabase
      .from("laundry_maintenance")
      .select("id", { count: "exact", head: true })
      .eq("machine_name", machineName)
      .eq("status", "On Maintenance")
      .is("deleted_at", null);
    if (countError) throw countError;

    const { data: services, error: servicesError } = await supabase
      .from("laundry_service")
      .select("id")
      .eq("machine_name", machineName);
    if (servicesError) throw servicesError;
    if (!services || services.length === 0) return;

    if ((count ?? 0) > 0) {
      const { error } = await supabase
        .from("laundry_service")
        .update({ status: "On Maintenance" })
        .eq("machine_name", machineName);
      if (error) throw error;
    } else {
      // syncServiceStatus never touches "On Maintenance", so free them first,
      // then recompute each one from its bookings
      const { error } = await supabase
        .from("laundry_service")
        .update({ status: "Available" })
        .eq("machine_name", machineName)
        .eq("status", "On Maintenance");
      if (error) throw error;

      await Promise.all(services.map((s) => syncServiceStatus(s.id)));
    }
  } catch (error) {
    console.error("syncMachineMaintenance error:", error);
  }
};