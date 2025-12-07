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
  model: z.string(),
  brand: z.string(),
  type: z.string(),
  color: z.string(),
  plate_no: z.string(),
});

export type VehicleFormData = z.infer<typeof VehicleFormSchema>;
export const MaintenanceFormSchema = z.object({
  date: z
    .string()
    .min(1, "Date is required")
    .transform(v => new Date(v)),

  car: z.string().min(1, "Vehicle is required"),

  typeOfMaintenance: z.string().min(1),

  costOfMaintenance: z
    .string()
    .min(1, "Cost is required")
    .transform(v => Number(v)),

  location: z.string().min(1),

  maintainedBy: z.string().min(1),
});

export type MaintenanceFormData = z.infer<typeof MaintenanceFormSchema>;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIN_DIMENSIONS = { width: 200, height: 200 };
const MAX_DIMENSIONS = { width: 4096, height: 4096 };
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const RenterForm = z.object({
  fullName: z.string(),
  address: z.string(),
  licenseNumber: z.string(),
  validId: z
    .instanceof(File, {
      message: "Please Select an image File",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `The image is too Large. Please choose an image smaller than ${formatBytes(
        MAX_FILE_SIZE
      )}`,
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Please upload a valid image file (JPED, PNG)",
    })
    .refine(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const meetsDimensions =
                img.width >= MIN_DIMENSIONS.width &&
                img.height >= MIN_DIMENSIONS.height &&
                img.width <= MAX_DIMENSIONS.width &&
                img.width <= MAX_DIMENSIONS.height;
              resolve(meetsDimensions);
            };
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        })
    ),
  pagIbigNumber: z.string().optional(),
  sssNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  philHealthNumber: z.string().optional(),
  carPlateNumber: z.string(),
  carModel: z.string(),
  carType: z.string(),
  totalPriceRent: z.number(),
  downPayment: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  typeOfRent: z.string(),
  location: z.string(),
  vehicleLeftPlateNumber: z.string().optional(),
  vehicleLeft: z.string().optional(),
  vehicleLeftType: z.string().optional(),
  agreementPhoto: z
    .instanceof(File, {
      message: "Please Select an image File",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `The image is too Large. Please choose an image smaller than ${formatBytes(
        MAX_FILE_SIZE
      )}`,
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Please upload a valid image file (JPED, PNG)",
    })
    .refine(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const meetsDimensions =
                img.width >= MIN_DIMENSIONS.width &&
                img.height >= MIN_DIMENSIONS.height &&
                img.width <= MAX_DIMENSIONS.width &&
                img.width <= MAX_DIMENSIONS.height;
              resolve(meetsDimensions);
            };
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        })
    ),
  notes: z.string().optional(),
  proofPhoto: z
    .instanceof(File, {
      message: "Please Select an image File",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `The image is too Large. Please choose an image smaller than ${formatBytes(
        MAX_FILE_SIZE
      )}`,
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Please upload a valid image file (JPED, PNG)",
    })
    .refine(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const meetsDimensions =
                img.width >= MIN_DIMENSIONS.width &&
                img.height >= MIN_DIMENSIONS.height &&
                img.width <= MAX_DIMENSIONS.width &&
                img.width <= MAX_DIMENSIONS.height;
              resolve(meetsDimensions);
            };
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        })
    ),
});

export default {
  LoginFormSchema,
  ForgotPassword,
  VehicleFormSchema,
  MaintenanceFormSchema,
  RenterForm,
};
