import * as z from "zod";

export const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginFormData = z.infer<typeof LoginFormSchema>;

export const ForgotPassword = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });

export const VehicleFormSchema = z.object({
  model: z.string().min(1).max(24),
  brand: z.string().min(1).max(24),
  type: z.string().min(1).max(24),
  color: z.string().min(1).max(24),
  plate_no: z.string().min(1).max(24),
  status: z.string(),
});
export type VehicleFormData = z.infer<typeof VehicleFormSchema>;

export const MaintenanceFormSchema = z.object({
  date: z
    .string()
    .transform((v) => new Date(v)),

  car: z.string().min(1, "Vehicle is required"),

  type_of_maintenance: z.string().min(1),

  cost_of_maintenance: z
    .string()
    .transform((v) => Number(v)),
  location: z.string().min(1),
  maintained_by: z.string().min(1),
  status: z.string().min(1),
});

export type MaintenanceFormData = z.infer<typeof MaintenanceFormSchema>;

// const MAX_FILE_SIZE = 5 * 1024 * 1024;
// const MIN_DIMENSIONS = { width: 200, height: 200 };
// const MAX_DIMENSIONS = { width: 4096, height: 4096 };
// const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

// const formatBytes = (bytes: number, decimals = 2) => {
//   if (bytes === 0) return "0 Bytes";
//   const k = 1024;
//   const dm = decimals < 0 ? 0 : decimals;
//   const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
// };

export const RenterFormSchema = z.object({
  full_name: z.string(),
  address: z.string(),
  license_number: z.string(),
  valid_id: z.instanceof(FileList).optional(),
  pagibig_number: z.string().optional(),
  sss_number: z.string().optional(),
  tin_number: z.string().optional(),
  philhealth_number: z.string().optional(),
  car_plate_number: z.string().min(1, "Please Select A Vehicle"),
  car_model: z.string(),
  car_type: z.string(),
  total_price_rent: z.string().transform((v) => Number(v)),
  downpayment: z.z.string().transform((v) => Number(v)),
  start_date:  z.string()
    .transform((v) => new Date(v)),
  end_date:  z.string()
    .transform((v) => new Date(v)),
  start_time: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid time"),
  end_time: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Invalid time"),
  type_of_rent: z.string(),
  location: z.string(),
  vehicle_left_plate_number: z.string().optional(),
  vehicle_left_model: z.string().optional(),
  vehicle_left_type: z.string().optional(),
  agreement_photo: z.instanceof(FileList).optional(),
  notes: z.string().optional(),
  uploaded_proof: z.instanceof(FileList).optional(),
  status: z.string().min(1),
});

export type RenterFormData = z.infer<typeof RenterFormSchema>;

export const TestFormSchema = z.object({
  full_name: z.string(),
  valid_id: z.instanceof(FileList),
  plate_no: z.string(),
  car_model: z.string(),
  car_type: z.string(),
});

export type TestFormData = z.infer<typeof TestFormSchema>;

export default {
  TestFormSchema,
  LoginFormSchema,
  ForgotPassword,
  VehicleFormSchema,
  MaintenanceFormSchema,
  RenterFormSchema,
};
