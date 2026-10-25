/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { supabaseWater as supabase } from "../../utils/supabase";
import icons from "../../constants/icon";
import { DeleteModal } from "../../modals";
import WaterProductForm, {
  CONTAINER_TYPES,
  type WaterProductData,
} from "../waterstation/components/Waterproductform";

const containerBadge = (type: string | null) =>
  type === "Round"
    ? "bg-blue-50 text-blue-600 border-blue-100"
    : type === "Slim"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-gray-50 text-gray-600 border-gray-200";

const WaterProducts = () => {
  const [products, setProducts] = useState<WaterProductData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [containerFilter, setContainerFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selected, setSelected] = useState<WaterProductData | null>(null);
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("water_product")
      .select("*")
      .is("deleted_at", null)
      .order("product_name", { ascending: true });

    if (error) {
      console.error("water_product error:", error);
      toast.error(`Error fetching products: ${error.message}`);
      return;
    }
    setProducts(data || []);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        (p.product_name || "").toLowerCase().includes(term) &&
        (containerFilter === "All" || p.container_type === containerFilter),
    );
  }, [products, searchTerm, containerFilter]);

  // Soft delete: past orders keep their own copy of the product details
  const handleDelete = async () => {
    if (!selected) return;

    try {
      const { error } = await supabase
        .from("water_product")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", selected.id);
      if (error) throw error;

      toast.success("Product deleted");
      setOpenDelete(false);
      setSelected(null);
      fetchProducts();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete");
    }
  };

  return (
    <div className="overflow-y-auto bg-gray-50/50 p-4 md:p-8 h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">
            Refills and new jugs you sell, with their prices.
          </p>
        </div>
        <button
          onClick={() => {
            setFormMode("create");
            setSelected(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all text-sm font-semibold cursor-pointer"
        >
          <icons.add className="text-lg" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <icons.search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search product..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-1">
          <icons.filter className="text-gray-400" />
          <select
            className="bg-transparent py-2 outline-none text-sm font-medium text-gray-700"
            value={containerFilter}
            onChange={(e) => setContainerFilter(e.target.value)}
          >
            <option value="All">All Containers</option>
            {CONTAINER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <icons.water className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-400 font-medium">
            {products.length === 0 ? "Add your first product" : "No products found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative"
            >
              {/* Action menu */}
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() =>
                    setOpenAction(openAction === product.id ? null : product.id)
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <icons.action className="text-gray-400 text-xl" />
                </button>
                {openAction === product.id && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-50">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setFormMode("view");
                        setSelected(product);
                        setShowForm(true);
                        setOpenAction(null);
                      }}
                    >
                      <icons.openEye className="text-emerald-500" /> View
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setFormMode("edit");
                        setSelected(product);
                        setShowForm(true);
                        setOpenAction(null);
                      }}
                    >
                      <icons.edit className="text-blue-500" /> Edit Product
                    </button>
                    <button
                      className="w-full flex items-center gap-3 pl-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelected(product);
                        setOpenDelete(true);
                        setOpenAction(null);
                      }}
                    >
                      <icons.trash /> Delete Product
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                  <icons.water className="text-3xl text-blue-300" />
                </div>
                <div className="pr-8">
                  <h3 className="font-bold text-gray-900 leading-tight">
                    {product.product_name}
                  </h3>
                  <p className="text-xl font-black text-emerald-600 mt-1">
                    ₱{(Number(product.price) || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${containerBadge(product.container_type)}`}
                >
                  {product.container_type}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-gray-50 text-gray-600 border-gray-200">
                  {product.container_included ? "New jug" : "Refill"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <WaterProductForm
        open={showForm}
        mode={formMode}
        selectedData={selected}
        onClose={() => {
          setShowForm(false);
          setSelected(null);
        }}
        onSuccess={fetchProducts}
      />

      {openDelete && (
        <DeleteModal
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          onClick={handleDelete}
        />
      )}
    </div>
  );
};

export default WaterProducts;