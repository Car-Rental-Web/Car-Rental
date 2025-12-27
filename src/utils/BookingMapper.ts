import type { DataBookingFormValues, DataBookingProps} from "../types/types";

export const BookingMapper = (
  data: DataBookingProps
): DataBookingFormValues & { id: number } => {
  return {
    id: data.id,
    full_name: data.full_name ?? "",
    license_number: data.license_number ?? "",
    valid_id: undefined,
    pagibig_no: "",
    sss_no:  "",
    tin_no: "",
    philhealth_no: "",
    car_plate_number: data.car_plate_number ?? "" ,
    car_type: data.car_type ?? "",
    car_model: data.car_model ?? "",
    total_price_rent: "",
    downpayment:  "",
    start_date: data.start_date ? new Date(data.start_date).toISOString().slice(0, 10) : "",
    end_date: data.end_date ? new Date(data.end_date).toISOString().slice(0, 10) : "",
    start_time: data.start_time ?? "",
    end_time: data.end_time ?? "",
    type_of_rent: data.type_of_rent ?? undefined, // <-- never null
    location: data.location ?? "",
    vehicle_left_plate_number: undefined,
    vehicle_left_model: undefined,
    vehicle_left_type: undefined,
    agreement_photo: undefined,
    notes: "",
    uploaded_proof: undefined,
    status: data.status ?? undefined, 
  };
};
