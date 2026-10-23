import { supabaseLaundry, supabaseWater } from "./supabase";

// A tiny in-memory cache for the lists the forms need (customers, products,
// services). Forms show what is cached straight away and refresh it in the
// background, so a form opens with its dropdowns already filled.
const store = new Map<string, unknown>();

export const readCache = <T>(key: string): T | undefined =>
  store.get(key) as T | undefined;

export const writeCache = <T>(key: string, data: T) => {
  store.set(key, data);
};

// Call on logout so the next person doesn't see the previous data
export const clearLookupCache = () => store.clear();

/* ---------------- Prefetch ---------------- */

export const prefetchWaterLookups = async () => {
  const [customers, products] = await Promise.all([
    supabaseWater
      .from("water_customer")
      .select("id, full_name, address, phone_number")
      .is("deleted_at", null)
      .order("full_name", { ascending: true }),
    supabaseWater
      .from("water_product")
      .select("id, product_name, container_type, container_included, price")
      .is("deleted_at", null)
      .order("product_name", { ascending: true }),
  ]);

  if (customers.error) console.error("prefetch water customers:", customers.error);
  else writeCache("water:customers", customers.data || []);

  if (products.error) console.error("prefetch water products:", products.error);
  else writeCache("water:products", products.data || []);
};

export const prefetchLaundryLookups = async () => {
  const [customers, services] = await Promise.all([
    supabaseLaundry
      .from("customer_profile")
      .select("id, full_name, address, phone_number, e_signature")
      .is("deleted_at", null)
      .order("full_name", { ascending: true }),
    supabaseLaundry
      .from("laundry_service")
      .select("id, service_name, price")
      .order("service_name", { ascending: true }),
  ]);

  if (customers.error) console.error("prefetch laundry customers:", customers.error);
  else writeCache("laundry:customers", customers.data || []);

  if (services.error) console.error("prefetch laundry services:", services.error);
  else writeCache("laundry:services", services.data || []);
};