import { supabaseLaundry as supabase } from "../supabase";

// Booking statuses that keep a machine busy
export const ACTIVE_BOOKING_STATUSES = ["On Service", "On Reservation"];

/**
 * Recomputes a machine's status. Order of priority:
 *   ongoing maintenance record   -> "On Maintenance"
 *   a booking "On Service"       -> "On Service"
 *   a booking "On Reservation"   -> "On Reservation"
 *   otherwise                    -> "Available"
 * Call it whenever a booking or a maintenance record is created, edited,
 * completed or deleted.
 */
export const syncMachineStatus = async (machineId?: string | null) => {
  if (!machineId) return;

  try {
    const { data: machine, error: machineError } = await supabase
      .from("laundry_machines")
      .select("id, machine_name, status")
      .eq("id", machineId)
      .maybeSingle();
    if (machineError) throw machineError;
    if (!machine) return;

    const { count: maintenanceCount, error: maintenanceError } = await supabase
      .from("laundry_maintenance")
      .select("id", { count: "exact", head: true })
      .eq("machine_name", machine.machine_name)
      .eq("status", "On Maintenance")
      .is("deleted_at", null);
    if (maintenanceError) throw maintenanceError;

    const { data: active, error: bookingError } = await supabase
      .from("laundry_booking")
      .select("status")
      .eq("machine_id", machineId)
      .in("status", ACTIVE_BOOKING_STATUSES);
    if (bookingError) throw bookingError;

    const next =
      (maintenanceCount ?? 0) > 0
        ? "On Maintenance"
        : active?.some((b) => b.status === "On Service")
          ? "On Service"
          : active && active.length > 0
            ? "On Reservation"
            : "Available";

    if (next !== machine.status) {
      const { error } = await supabase
        .from("laundry_machines")
        .update({ status: next })
        .eq("id", machineId);
      if (error) throw error;
    }
  } catch (error) {
    console.error("syncMachineStatus error:", error);
  }
};

/** Same thing, for records that only store the machine NAME (maintenance). */
export const syncMachineStatusByName = async (machineName?: string | null) => {
  if (!machineName) return;

  try {
    const { data, error } = await supabase
      .from("laundry_machines")
      .select("id")
      .eq("machine_name", machineName)
      .maybeSingle();
    if (error) throw error;
    if (data) await syncMachineStatus(data.id);
  } catch (error) {
    console.error("syncMachineStatusByName error:", error);
  }
};