/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { supabaseWater as supabase } from "../../../utils/supabase";
import icons from "../../../constants/icon";
import {
  EmptyState,
  FilterChips,
  RecentList,
  SectionTitle,
  peso,
  type Accent,
  type RecentItem,
} from "./Posshared";
import type { WaterProductData } from "../../waterstation/components/Waterproductform";
import WaterOrderForm from "../../waterstation/components/Waterorderform";
import WaterCustomerForm from "../../waterstation/components/Watercustomerform";

interface Props {
  search: string;
  accent: Accent;
  onBooked: () => void;
}

const PosWaterPanel = ({ search, accent, onBooked }: Props) => {
  const [products, setProducts] = useState<WaterProductData[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [containerFilter, setContainerFilter] = useState("All");

  const [showOrder, setShowOrder] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WaterProductData | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const fetchAll = useCallback(async () => {
    const [prod, rec] = await Promise.all([
      supabase
        .from("water_product")
        .select("*")
        .is("deleted_at", null)
        .order("product_name", { ascending: true }),
      supabase
        .from("water_order")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (prod.error || rec.error) {
      const message = (prod.error || rec.error)?.message;
      console.error("POS water error:", prod.error || rec.error);
      toast.error(`Error loading water station: ${message}`);
      return;
    }
    setProducts(prod.data || []);
    setRecent(rec.data || []);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const containerOptions = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.container_type).filter((t): t is string => Boolean(t))),
      ).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        (p.product_name || "").toLowerCase().includes(q) &&
        (containerFilter === "All" || p.container_type === containerFilter),
    );
  }, [products, search, containerFilter]);

  const recentItems: RecentItem[] = recent.map((o) => ({
    id: o.id,
    title: o.full_name || "Customer",
    subtitle: `${o.quantity} × ${o.product_name ?? ""}${o.container_type ? ` (${o.container_type})` : ""}`,
    amount: Number(o.total_price) || 0,
    status: o.status,
    when: o.created_at,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Catalog */}
      <section>
        <SectionTitle
          title="Products"
          subtitle={`${products.length} products for sale`}
          right={
            <button
              onClick={() => setShowCustomerForm(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${accent.button}`}
            >
              <icons.add size={14} /> New Customer
            </button>
          }
        />

        <div className="mb-5">
          <FilterChips
            options={containerOptions}
            value={containerFilter}
            onChange={setContainerFilter}
            accent={accent}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            text={products.length === 0 ? "No products yet" : "No products match your search"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="h-28 bg-linear-to-br from-sky-50 to-blue-100 flex items-center justify-center">
                  <icons.water className="text-5xl text-sky-400 group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-slate-900 leading-tight truncate">
                    {product.product_name}
                  </h3>
                  <p className={`text-xl font-black mt-1 ${accent.text}`}>
                    {peso(Number(product.price) || 0)}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${accent.soft}`}>
                      {product.container_type}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-200">
                      {product.container_included ? "New jug" : "Refill"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowOrder(true);
                    }}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${accent.button}`}
                  >
                    <icons.add size={14} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <SectionTitle title="Recent Orders" subtitle="Latest water orders" />
        <RecentList items={recentItems} accent={accent} emptyText="No orders yet" />
      </section>

      {/* Modals */}
      <WaterOrderForm
        open={showOrder}
        mode="create"
        presetProductId={selectedProduct?.id ?? null}
        onClose={() => {
          setShowOrder(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          fetchAll();
          onBooked();
        }}
      />

      <WaterCustomerForm
        open={showCustomerForm}
        mode="create"
        selectedData={null}
        onClose={() => setShowCustomerForm(false)}
        onSuccess={() => toast.success("Customer registered")}
      />
    </div>
  );
};

export default PosWaterPanel;