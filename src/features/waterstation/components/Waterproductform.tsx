/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseWater as supabase } from "../../../utils/supabase";
import icons from "../../../constants/icon";

export const CONTAINER_TYPES = ["Round", "Slim", "Other"];

// Matches the columns of the `water_product` table
export interface WaterProductData {
  id: string;
  created_at: string;
  product_name: string | null;
  container_type: string | null;
  container_included: boolean;
  price: number | null;
  deleted_at: string | null;
}

const ProductSchema = z.object({
  product_name: z.string().trim().min(1, "Product name is required"),
  container_type: z.string().min(1, "Select a container type"),
  container_included: z.boolean(),
  price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Enter a valid price"),
});
type ProductValues = z.infer<typeof ProductSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  selectedData?: WaterProductData | null;
  onSuccess: () => void;
}

const inputStyles =
  "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400";
const labelStyles = "block text-sm font-semibold text-gray-700 mb-1";

const WaterProductForm: React.FC<Props> = ({
  open,
  onClose,
  mode,
  selectedData,
  onSuccess,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductValues>({
    resolver: zodResolver(ProductSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      product_name: selectedData?.product_name ?? "",
      container_type: selectedData?.container_type ?? CONTAINER_TYPES[0],
      container_included: selectedData?.container_included ?? false,
      price: selectedData?.price != null ? String(selectedData.price) : "",
    });
  }, [open, selectedData, reset]);

  const onSubmit = async (data: ProductValues) => {
    if (isView) return;

    try {
      const payload = {
        product_name: data.product_name.trim(),
        container_type: data.container_type,
        container_included: data.container_included,
        price: Number(data.price),
      };

      if (isEdit && selectedData) {
        // Past orders keep the price they were sold at
        const { error } = await supabase
          .from("water_product")
          .update(payload)
          .eq("id", selectedData.id);
        if (error) throw error;
        toast.success("Product updated!");
      } else {
        const { error } = await supabase.from("water_product").insert([payload]);
        if (error) throw error;
        toast.success("Product added!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Product submit error:", error);
      toast.error(error.message || "Something went wrong");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1300 flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full max-w-lg max-h-full overflow-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isView ? "Product Details" : isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <icons.closeModal size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 gap-4">
          <div>
            <label className={labelStyles}>Product Name</label>
            <input
              disabled={isView}
              {...register("product_name")}
              placeholder="e.g. Round Refill"
              className={inputStyles}
            />
            {errors.product_name && (
              <p className="text-red-500 text-[10px] mt-1 font-bold">
                {errors.product_name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyles}>Container</label>
              <select
                disabled={isView}
                {...register("container_type")}
                className={inputStyles}
              >
                {CONTAINER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.container_type && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.container_type.message}
                </p>
              )}
            </div>

            <div>
              <label className={labelStyles}>Price (₱)</label>
              <input
                disabled={isView}
                {...register("price")}
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 25"
                className={inputStyles}
              />
              {errors.price && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>

          <label className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4 cursor-pointer">
            <input
              type="checkbox"
              disabled={isView}
              {...register("container_included")}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600"
            />
            <span>
              <span className="block text-sm font-bold text-gray-700">
                New jug sold with water
              </span>
              <span className="block text-[11px] text-gray-500 mt-0.5">
                The customer keeps the container, so it is not counted as a jug
                lent out. Leave it off for refills.
              </span>
            </span>
          </label>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
          >
            {isView ? "Close" : "Cancel"}
          </button>
          {!isView && (
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white font-bold hover:bg-black transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default WaterProductForm;