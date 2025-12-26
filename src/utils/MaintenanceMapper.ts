import type {
  DataMaintenanceProps,
  MaintenanceFormValues,
} from "../types/types";

export const MaintenanceMapper = (data: DataMaintenanceProps): MaintenanceFormValues & { id: number } => {
  return {
    id: data.id,
    date: new Date(data.date).toISOString().slice(0, 10), 
    car: data.car ?? "",
    type_of_maintenance: data.type_of_maintenance,
    cost_of_maintenance: String(data.cost_of_maintenance),
    location: data.location,
    maintained_by: data.maintained_by,
    status: "On Maintenance",
  };
};
