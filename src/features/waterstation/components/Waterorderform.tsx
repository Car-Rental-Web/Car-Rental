/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { supabaseWater as supabase } from "../../../utils/supabase";
import icons from "../../../constants/icon";
import { readCache, writeCache } from "../../../utils/lookupCache";

export const ORDER_STATUSES = ["Scheduled", "On Delivery", "Completed", "Cancelled"];
export const PAYMENT_STATUSES = ["Unpaid", "Paid"];

// Matches the columns of the `water_order` table
export interface WaterOrderData {
  id: string;
  created_at: string;
  customer_id: string | null;
  full_name: string | null;
  address: string | null;
  phone_number: string | null;
  product_id: string | null;
  product_name: string | null;
  container_type: string | null;
  container_included: boolean;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_date: string;
  delivery_time: string | null;
  rider: string | null;
  notes: string | null;
  status: string;
  empties_returned: number;
  payment_status: string;
  payment_method: string | null;
  deleted_at: string | null;
}

interface CustomerOption {
  id: string;
  full_name: string | null;
  address: string | null;
  phone_number: string | null;
}

interface ProductOption {
  id: string;
  product_name: string | null;
  container_type: string | null;
  container_included: boolean;
  price: number | null;
}

const OrderSchema = z.object({
  customer_id: z.string().optional(), // create mode only
  product_id: z.string().optional(), // create mode only
  quantity: z
    .string()
    .trim()
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) >= 1,
      "Enter a whole number of 1 or more",
    ),
  delivery_date: z.string().min(1, "Delivery date is required"),
  delivery_time: z.string().optional(),
  rider: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().min(1, "Select a status"),
  empties_returned: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0),
      "Enter 0 or more",
    ),
  payment_status: z.string().min(1, "Select a payment status"),
});
type OrderValues = z.infer<typeof OrderSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  order?: WaterOrderData | null;
  presetCustomerId?: string | null; // create mode: start with this customer picked
  presetProductId?: string | null; // create mode: start with this product picked
  onSuccess?: () => void;
}

const inputStyles =
  "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500";
const labelStyles = "block text-sm font-semibold text-gray-700 mb-1";

const todayLocal = () => new Date().toLocaleDateString("en-CA");

const ErrorText = ({ message }: { message?: string }) =>
  message ? (
    <p className="text-red-500 text-[10px] mt-1 font-bold">{message}</p>
  ) : null;

const WaterOrderForm: React.FC<Props> = ({
  open,
  onClose,
  mode,
  order,
  presetCustomerId,
  presetProductId,
  onSuccess,
}) => {
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isView = mode === "view";

  // Start from the cache so the dropdowns are filled the moment the form opens
  const [customers, setCustomers] = useState<CustomerOption[]>(
    () => readCache<CustomerOption[]>("water:customers") ?? [],
  );
  const [products, setProducts] = useState<ProductOption[]>(
    () => readCache<ProductOption[]>("water:products") ?? [],
  );
  const [standing, setStanding] = useState<{ jugs: number; unpaid: number } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrderValues>({
    resolver: zodResolver(OrderSchema),
  });

  const customerId = watch("customer_id");
  const productId = watch("product_id");
  const quantity = watch("quantity");
  const watchedStatus = watch("status");
  const watchedPayment = watch("payment_status");

  const customer = customers.find((c) => c.id === customerId) || null;
  const product = products.find((p) => p.id === productId) || null;

  // Unit price: the product's price when creating, the saved price afterwards
  const unitPrice = isCreate ? Number(product?.price) || 0 : Number(order?.unit_price) || 0;
  const qty = Number(quantity) || 0;
  const total = qty * unitPrice;

  const shownName = isCreate ? customer?.full_name : order?.full_name;
  const shownAddress = isCreate ? customer?.address : order?.address;
  const shownPhone = isCreate ? customer?.phone_number : order?.phone_number;

  /* ---------------- Loading ---------------- */
  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      reset({
        customer_id: presetCustomerId ?? "",
        product_id: presetProductId ?? "",
        quantity: "1",
        delivery_date: todayLocal(),
        delivery_time: "",
        rider: "",
        notes: "",
        status: "Scheduled",
        empties_returned: "0",
        payment_status: "Unpaid",
      });

      // Show what we already know straight away; refresh in the background
      const cachedCustomers = readCache<CustomerOption[]>("water:customers");
      const cachedProducts = readCache<ProductOption[]>("water:products");
      if (cachedCustomers) setCustomers(cachedCustomers);
      if (cachedProducts) setProducts(cachedProducts);

      const load = async () => {
        const [cust, prod] = await Promise.all([
          supabase
            .from("water_customer")
            .select("id, full_name, address, phone_number")
            .is("deleted_at", null)
            .order("full_name", { ascending: true }),
          supabase
            .from("water_product")
            .select("id, product_name, container_type, container_included, price")
            .is("deleted_at", null)
            .order("product_name", { ascending: true }),
        ]);

        if (cust.error || prod.error) {
          const message = (cust.error || prod.error)?.message;
          console.error("order form load error:", cust.error || prod.error);
          toast.error(`Error loading the form: ${message}`);
          return;
        }
        setCustomers(cust.data || []);
        setProducts(prod.data || []);
        writeCache("water:customers", cust.data || []);
        writeCache("water:products", prod.data || []);
      };
      load();
    } else if (order) {
      reset({
        customer_id: "",
        product_id: "",
        quantity: String(order.quantity),
        delivery_date: order.delivery_date,
        delivery_time: (order.delivery_time ?? "").slice(0, 5),
        rider: order.rider ?? "",
        notes: order.notes ?? "",
        status: order.status,
        empties_returned: String(order.empties_returned ?? 0),
        payment_status: order.payment_status,
      });
    }
  }, [open, isCreate, order, presetCustomerId, presetProductId, reset]);

  // What this customer already holds, so the owner knows at a glance
  const standingId = isCreate ? customerId : order?.customer_id;
  useEffect(() => {
    if (!open || !standingId) {
      setStanding(null);
      return;
    }

    const fetchStanding = async () => {
      const { data } = await supabase
        .from("water_customer_summary")
        .select("jugs_on_hand, unpaid_balance")
        .eq("customer_id", standingId)
        .maybeSingle();

      setStanding(
        data
          ? {
              jugs: Number(data.jugs_on_hand) || 0,
              unpaid: Number(data.unpaid_balance) || 0,
            }
          : null,
      );
    };
    fetchStanding();
  }, [open, standingId]);

  /* ---------------- Submit ---------------- */
  const onSubmit = async (data: OrderValues) => {
    if (isView) return;

    try {
      const quantityValue = Number(data.quantity);
      const common = {
        delivery_date: data.delivery_date,
        delivery_time: data.delivery_time || null, // a time column rejects ""
        rider: data.rider || null,
        notes: data.notes || null,
        status: data.status,
        payment_status: data.payment_status,
      };

      if (isEdit && order) {
        const { error } = await supabase
          .from("water_order")
          .update({
            ...common,
            quantity: quantityValue,
            total_price: quantityValue * Number(order.unit_price),
            empties_returned: Number(data.empties_returned || 0),
          })
          .eq("id", order.id);
        if (error) throw error;
        toast.success("Order updated!");
      } else {
        if (!customer) {
          setError("customer_id", { message: "Select a customer" });
          return;
        }
        if (!product) {
          setError("product_id", { message: "Select a product" });
          return;
        }

        const { error } = await supabase.from("water_order").insert([
          {
            customer_id: customer.id,
            full_name: customer.full_name,
            address: customer.address,
            phone_number: customer.phone_number,
            product_id: product.id,
            product_name: product.product_name,
            container_type: product.container_type,
            container_included: product.container_included,
            quantity: quantityValue,
            unit_price: Number(product.price) || 0,
            total_price: quantityValue * (Number(product.price) || 0),
            empties_returned: 0,
            ...common,
          },
        ]);
        if (error) throw error;
        toast.success("Order scheduled!");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || "Something went wrong");
    }
  };

  if (!open) return null;
  if (!isCreate && !order) return null;

  const statusOptions = isCreate
    ? ORDER_STATUSES.filter((s) => s === "Scheduled" || s === "On Delivery")
    : ORDER_STATUSES;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1300 flex justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full max-w-2xl max-h-full overflow-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isView ? "Order Details" : isEdit ? "Edit Order" : "New Water Order"}
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
          {/* Customer */}
          <div className="sm:col-span-2">
            <label className={labelStyles}>Customer</label>
            {isCreate ? (
              <>
                <select
                  {...register("customer_id")}
                  value={customerId ?? ""}
                  className={inputStyles}
                >
                  <option value="">
                    {customers.length === 0 ? "No customers found" : "Select a customer"}
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
              <input disabled value={shownName || ""} className={inputStyles} />
            )}

            {standing && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Holding {standing.jugs} jug/s
                </span>
                {standing.unpaid > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                    Unpaid ₱{standing.unpaid.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className={labelStyles}>Address</label>
            <input
              disabled
              value={shownAddress || ""}
              placeholder="Filled from the customer"
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Phone Number</label>
            <input
              disabled
              value={shownPhone || ""}
              placeholder="Filled from the customer"
              className={inputStyles}
            />
          </div>

          {/* Product */}
          <div>
            <label className={labelStyles}>Product</label>
            {isCreate ? (
              <>
                <select
                  {...register("product_id")}
                  value={productId ?? ""}
                  className={inputStyles}
                >
                  <option value="">
                    {products.length === 0 ? "No products yet" : "Select a product"}
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} — ₱{(Number(p.price) || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
                <ErrorText message={errors.product_id?.message} />
              </>
            ) : (
              <input
                disabled
                value={`${order?.product_name ?? ""}${order?.container_type ? ` (${order.container_type})` : ""}`}
                className={inputStyles}
              />
            )}
          </div>

          <div>
            <label className={labelStyles}>Quantity (gallons)</label>
            <input
              disabled={isView}
              type="number"
              min="1"
              step="1"
              {...register("quantity")}
              className={inputStyles}
            />
            <ErrorText message={errors.quantity?.message} />
          </div>

          {/* Price summary */}
          <div>
            <label className={labelStyles}>Price per Gallon</label>
            <input
              disabled
              value={`₱${unitPrice.toLocaleString()}`}
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Total</label>
            <input
              disabled
              value={`₱${total.toLocaleString()}`}
              className={`${inputStyles} font-bold`}
            />
          </div>

          {/* Delivery */}
          <div>
            <label className={labelStyles}>Delivery Date</label>
            <input
              disabled={isView}
              type="date"
              {...register("delivery_date")}
              className={inputStyles}
            />
            <ErrorText message={errors.delivery_date?.message} />
          </div>
          <div>
            <label className={labelStyles}>Delivery Time (optional)</label>
            <input
              disabled={isView}
              type="time"
              {...register("delivery_time")}
              className={inputStyles}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelStyles}>Rider (optional)</label>
            <input
              disabled={isView}
              {...register("rider")}
              placeholder="Name of the delivery rider"
              className={inputStyles}
            />
          </div>

          {/* Status + payment */}
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
          <div>
            <label className={labelStyles}>Payment</label>
            <select
              disabled={isView}
              {...register("payment_status")}
              value={watchedPayment ?? ""}
              className={inputStyles}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ErrorText message={errors.payment_status?.message} />
          </div>

          {/* Empties come back on delivery, so only editable after the order exists */}
          {!isCreate && (
            <div className="sm:col-span-2">
              <label className={labelStyles}>Empty Gallons Returned</label>
              <input
                disabled={isView}
                type="number"
                min="0"
                step="1"
                {...register("empties_returned")}
                className={inputStyles}
              />
              <ErrorText message={errors.empties_returned?.message} />
              <p className="text-[11px] text-gray-400 mt-1">
                Fill this in when the order is Completed. It is how the station
                knows how many jugs the customer still holds.
              </p>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className={labelStyles}>Notes (optional)</label>
            <textarea
              rows={2}
              disabled={isView}
              {...register("notes")}
              className={inputStyles}
            />
          </div>
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
              className="flex-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Schedule Order"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default WaterOrderForm;