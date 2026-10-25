/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import icons from "../../constants/icon";
import { useDebouncedValue } from "../../utils/useDebounce";
import { filterData } from "../../utils/FilterData";
import { supabaseLaundry as supabase } from "../../utils/supabase";
import { syncMachineStatusByName } from "../../utils/laundry/syncMachineStatus";
import { DeleteModal, UpdateStatus } from "../../modals";
import LaundryMaintenanceForm, {
  type LaundryMaintenanceData,
} from "../laundry/components/LaundyMaintenanceForm";
import { SearchBar } from "../../components";
import Card from "../../components/Card";
import TableData from "../../components/TableData";

// "2026-10-15" -> local date (avoids the UTC day shift)
const formatDate = (date: string | null) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "N/A";

const LaundryMaintenance = () => {
  const [allRecords, setAllRecords] = useState<LaundryMaintenanceData[]>([]);
  const [records, setRecords] = useState<LaundryMaintenanceData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectValue, setSelectValue] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selected, setSelected] = useState<LaundryMaintenanceData | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  /* ---------------- Fetch ---------------- */
  const fetchMaintenance = useCallback(async () => {
    const { data, error } = await supabase
      .from("laundry_maintenance")
      .select("*")
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("laundry_maintenance error:", error);
      toast.error(`Error fetching maintenance: ${error.message}`);
      return;
    }
    setAllRecords(data || []);
  }, []);

  useEffect(() => {
    fetchMaintenance();
  }, [fetchMaintenance]);

  /* ---------------- Search + status filter ---------------- */
  useEffect(() => {
    let result = filterData(debounceSearchTerm, allRecords, [
      "date",
      "machine_name",
      "type_of_maintenance",
      "cost_of_maintenance",
      "location",
      "maintained_by",
      "status",
    ]);
    if (selectValue !== "") {
      result = result.filter((item) => item.status === selectValue);
    }
    setRecords(result);
  }, [debounceSearchTerm, selectValue, allRecords]);

  /* ---------------- Actions ---------------- */
  // Mark as completed: the machine's services go back to their real status
  const handleComplete = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("laundry_maintenance")
        .update({ status: "Maintained" })
        .eq("id", selected.id);
      if (error) throw error;

      await syncMachineStatusByName(selected.machine_name);

      toast.success("Maintenance completed");
      setOpenStatus(false);
      setSelected(null);
      fetchMaintenance();
    } catch (err: any) {
      console.error(err);
      toast.error("Update Failed: " + (err.message ?? ""));
    } finally {
      setLoading(false);
    }
  };

  // Soft delete (same as the rental side)
  const handleDelete = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("laundry_maintenance")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", selected.id);
      if (error) throw error;

      // Deleting an ongoing record frees the machine's services
      if (selected.status === "On Maintenance") {
        await syncMachineStatusByName(selected.machine_name);
      }

      toast.success("Moved to Trash Successfully");
      setOpenDelete(false);
      setSelected(null);
      fetchMaintenance();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to Move to Trash");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Stats ---------------- */
  const totalExpense = records.reduce(
    (sum, row) => sum + (Number(row.cost_of_maintenance) || 0),
    0,
  );
  const ongoing = records.filter((r) => r.status === "On Maintenance").length;
  const maintained = records.filter((r) => r.status === "Maintained").length;

  /* ---------------- Table columns ---------------- */
  const columns = [
    {
      name: "No.",
      cell: (_row: LaundryMaintenanceData, index: number) => (
        <div className="text-gray-500 font-medium">{index + 1}</div>
      ),
    },
    {
      name: "Date",
      cell: (row: LaundryMaintenanceData) => (
        <div className="text-gray-700">{formatDate(row.date)}</div>
      ),
    },
    {
      name: "Machine",
      cell: (row: LaundryMaintenanceData) => (
        <span className="font-semibold text-gray-800">
          {row.machine_name || "N/A"}
        </span>
      ),
    },
    {
      name: "Type of Maintenance",
      cell: (row: LaundryMaintenanceData) => (
        <span className="text-[11px] text-gray-500 uppercase">
          {row.type_of_maintenance}
        </span>
      ),
    },
    {
      name: "Cost",
      cell: (row: LaundryMaintenanceData) => (
        <div className="font-bold text-gray-900">
          ₱{(Number(row.cost_of_maintenance) || 0).toLocaleString()}
        </div>
      ),
    },
    {
      name: "Status",
      cell: (row: LaundryMaintenanceData) => (
        <div
          className={`rounded-full px-3 py-1 text-center font-bold text-[10px] uppercase tracking-wider border ${
            row.status === "On Maintenance"
              ? "text-red-700 bg-red-50 border-red-100"
              : row.status === "Maintained"
                ? "text-blue-700 bg-blue-50 border-blue-100"
                : "text-gray-600 bg-gray-50"
          }`}
        >
          {row.status}
        </div>
      ),
    },
    {
      name: "Action",
      cell: (row: LaundryMaintenanceData) => (
        <div className="flex gap-3">
          {row.status === "On Maintenance" && (
            <icons.check
              className="cursor-pointer text-emerald-500 hover:text-emerald-700 text-xl transition-colors"
              onClick={() => {
                setSelected(row);
                setOpenStatus(true);
              }}
            />
          )}

          <icons.openEye
            className="cursor-pointer text-slate-400 hover:text-slate-600 text-xl transition-colors"
            onClick={() => {
              setFormMode("view");
              setSelected(row);
              setFormOpen(true);
            }}
          />

          {row.status === "On Maintenance" && (
            <icons.edit
              className="cursor-pointer text-indigo-400 hover:text-indigo-600 text-xl transition-colors"
              onClick={() => {
                setFormMode("edit");
                setSelected(row);
                setFormOpen(true);
              }}
            />
          )}

          <icons.trash
            className="cursor-pointer text-rose-400 hover:text-rose-600 text-xl transition-colors"
            onClick={() => {
              setSelected(row);
              setOpenDelete(true);
            }}
          />
        </div>
      ),
    },
  ];

  /* ---------------- UI ---------------- */
  return (
    <div className="px-8 pt-10 w-full min-h-screen bg-white overflow-y-auto pb-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Maintenance
        </h1>
        <p className="text-gray-500 mt-1">
          Track and manage machine service records.
        </p>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="border border-gray-100 bg-white shadow-sm border-l-4 border-l-rose-500 hover:shadow-md transition-shadow"
            title={
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Total Expense
              </span>
            }
            url={""}
            amount={
              <span className="text-4xl font-black text-gray-900">
                ₱{totalExpense.toLocaleString()}
              </span>
            }
            description="Cumulative costs"
            topIcon={<icons.money className="text-2xl text-rose-500" />}
          />
          <Card
            className="border border-gray-100 bg-white shadow-sm border-l-4 border-l-slate-800 hover:shadow-md transition-shadow"
            title={
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Completed
              </span>
            }
            url={""}
            amount={
              <span className="text-4xl font-black text-gray-900">
                {maintained}
              </span>
            }
            description="Total serviced machines"
            topIcon={
              <icons.onMaintenance className="text-slate-800 text-2xl" />
            }
          />
          <Card
            className="border border-gray-100 bg-white shadow-sm border-l-4 border-l-blue-600 hover:shadow-md transition-shadow"
            title={
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Ongoing
              </span>
            }
            url={""}
            amount={
              <span className="text-4xl font-black text-gray-900">
                {ongoing}
              </span>
            }
            description="Currently being serviced"
            topIcon={<icons.onMaintenance className="text-blue-600 text-2xl" />}
          />
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              setFormMode("create");
              setSelected(null);
              setFormOpen(true);
            }}
            className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-none cursor-pointer"
          >
            <icons.add className="text-white text-lg" />
            New Maintenance
          </button>
        </div>
      </div>

      {/* Table & filter */}
      <div className="mt-8 border border-gray-100 rounded-2xl shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
          <h3 className="text-lg font-bold text-gray-800">Records History</h3>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 w-full text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="On Maintenance">Ongoing</option>
                <option value="Maintained">Completed</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                <icons.down />
              </div>
            </div>
            <SearchBar
              value={searchTerm}
              onClear={() => setSearchTerm("")}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg py-2.5 px-4 w-full md:w-72 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Search history..."
            />
          </div>
        </div>
        <div className="p-4">
          <TableData
            title={null}
            pagination={true}
            fixedHeader={true}
            fixedHeaderScrollHeight="450px"
            data={records}
            columns={columns}
          />
        </div>
      </div>

      {/* Modals: one of each, for the selected record */}
      <LaundryMaintenanceForm
        open={formOpen}
        mode={formMode}
        initialData={selected}
        onClose={() => {
          setFormOpen(false);
          setSelected(null);
        }}
        onSuccess={fetchMaintenance}
      />

      <UpdateStatus
        disabled={loading}
        open={openStatus}
        onClick={handleComplete}
        onClose={() => {
          setOpenStatus(false);
          setSelected(null);
        }}
      >
        Mark as Completed?
      </UpdateStatus>

      <DeleteModal
        disabled={loading}
        open={openDelete}
        onClick={handleDelete}
        onClose={() => {
          setOpenDelete(false);
          setSelected(null);
        }}
      />
    </div>
  );
};

export default React.memo(LaundryMaintenance);