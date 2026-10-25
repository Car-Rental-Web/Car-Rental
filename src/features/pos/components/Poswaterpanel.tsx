/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { supabaseWater as supabase } from "../../../utils/supabase";
import icons from "../../../constants/icon";

import {
  AddBadge,
  EmptyState,
  FilterChips,
  PosLayout,
  ReceiptPanel,
  SectionTitle,
  Tile,
  TileGrid,
  peso,
  type Accent,
  type RecentItem,
} from "./Posshared";
import type { WaterProductData } from "../../waterstation/components/Waterproductform";
import WaterOrderForm from "../../waterstation/components/Waterorderform";
import WaterCustomerForm from "../../waterstation/components/Watercustomerform";
import { prefetchWaterLookups } from "../../../utils/lookupCache";

interface Props {
  search: string;
  accent: Accent;
  onBooked: () => void;
  today: { count: number; sales: number };
  allSales: number;
}

const PosWaterPanel = ({ search, accent, onBooked, today, allSales }: Props) => {
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
        .limit(12),
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
    <>
      <PosLayout
        left={
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <SectionTitle
                title="Products"
                subtitle={`${products.length} for sale · tap a product to start an order`}
              />
              <FilterChips
                options={containerOptions}
                value={containerFilter}
                onChange={setContainerFilter}
                accent={accent}
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                text={products.length === 0 ? "No products yet" : "No products match"}
              />
            ) : (
              <TileGrid>
                {filtered.map((product) => (
                  <Tile
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowOrder(true);
                    }}
                  >
                    <div className="h-28 bg-linear-to-br from-sky-50 to-blue-100 flex items-center justify-center">
                      <icons.water className="text-5xl text-sky-400" />
                    </div>

                    <div className="p-3.5">
                      <p className="font-black text-slate-900 text-sm leading-tight truncate">
                        {product.product_name}
                      </p>
                      <p className={`text-xl font-black mt-1 tabular-nums ${accent.text}`}>
                        {peso(Number(product.price) || 0)}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${accent.soft}`}
                        >
                          {product.container_type}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-200">
                          {product.container_included ? "New jug" : "Refill"}
                        </span>
                      </div>
                    </div>

                    <AddBadge accent={accent} />
                  </Tile>
                ))}
              </TileGrid>
            )}
          </section>
        }
        right={
          <ReceiptPanel
            title="Water Station"
            accent={accent}
            items={recentItems}
            emptyText="No orders yet"
            businessToday={today}
            allSales={allSales}
            actionLabel="New Customer"
            onAction={() => setShowCustomerForm(true)}
          />
        }
      />

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
        onSuccess={() => {
          toast.success("Customer registered");
          prefetchWaterLookups();
        }}
      />
    </>
  );
};

export default PosWaterPanel;