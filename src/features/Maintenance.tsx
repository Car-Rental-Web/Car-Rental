import icons from "../constants/icon";
import type {
  DataMaintenanceProps,
  MaintenanceFormValues,
} from "../types/types";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import { DeleteModal, MaintenanceForm, UpdateStatus } from "../modals";
import { CustomButtons } from "../components/CustomButtons";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";
import { useModalStore } from "../store/useModalStore";
import { SearchBar, TableData } from "../components";
import React from "react";
import { useLoadingStore } from "../store/useLoading";
import Card from "../components/Card";

const Maintenance = () => {
  const [records, setRecords] = useState<DataMaintenanceProps[]>([]);
  const [filterRecords, setFilterRecords] = useState<DataMaintenanceProps[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const { open, onOpen, onClose } = useModalStore();
  const { loading, setLoading } = useLoadingStore();
  const [selectedMaintenanceId, setSelectedMaintenanceId] =
    useState<MaintenanceFormValues | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">(
    "create",
  );

  useEffect(() => {
    onClose();
  }, [onClose]);

  const handleUpdate = async (id: number) => {
    setLoading(true);
    try {
      // 1. Get the maintenance record first to find out which car it belongs to
      const { data: maintenanceRecord, error: fetchError } = await supabase
        .from("maintenance")
        .select("car") // Assuming 'car' stores the plate number
        .eq("id", id)
        .single();

      if (fetchError || !maintenanceRecord)
        throw new Error("Maintenance record not found");

      // 2. Update the maintenance status to "Maintained"
      const { error: maintenanceError } = await supabase
        .from("maintenance")
        .update({ status: "Maintained" })
        .eq("id", id);

      if (maintenanceError) throw maintenanceError;

      // 3. Update the vehicle status to "Available" using the plate number
      const { error: vehicleError } = await supabase
        .from("vehicle")
        .update({ status: "Available" })
        .eq("plate_number", maintenanceRecord.car); // Match by Plate, not ID

      if (vehicleError) throw vehicleError;

      toast.success("Update Successfully");
      setOpenStatus(false);

      // Refresh your data here if necessary
    } catch (err: any) {
      console.error(err.message);
      toast.error("Update Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("maintenance")
      .update({deleted_at: new Date().toISOString()})
      .eq("id", id);

    if (error) {
      toast.error("Failed to Move to Trash");
      return;
    }
    console.log("Deleted Successfully", data);
    toast.success("Moved to Trash Successfully");
    setRecords((prev) => prev.filter((row) => row.id !== id));
    setFilterRecords((prev) => prev.filter((row) => row.id !== id));
    setOpenDelete(false);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchMaintenance = async () => {
      const { data, error } = await supabase.from("maintenance").select("*").is("deleted_at", null);
      if (!isMounted) return;

      if (error) return;
      const row = data ?? [];
      const rowsData = row.map((item) => ({
        id: item.id,
        date: new Date(item.date).toISOString().slice(0, 10),
        car: item.car,
        type_of_maintenance: item.type_of_maintenance,
        cost_of_maintenance: String(item.cost_of_maintenance),
        location: item.location,
        maintained_by: item.maintained_by,
        status: item.status,
      }));
      setRecords(rowsData);
      setFilterRecords(rowsData);
    };
    fetchMaintenance();
    return () => {
      isMounted = false;
    };
  }, [open, openStatus]);

  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);

  useEffect(() => {
    let result = filterData(debounceSearchTerm, filterRecords, [
      "id",
      "date",
      "car",
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
  }, [debounceSearchTerm, selectValue, filterRecords]);

  const totalExpense = records.reduce(
    (sum, row) => sum + Number(row.cost_of_maintenance),
    0,
  );
  const ongoing = records.filter((r) => r.status === "On Maintenance").length;
  const maintained = records.filter((r) => r.status === "Maintained").length;

  const columns = [
    {
      name: "No.",
      cell: (_row: DataMaintenanceProps, index: number) => (
        <div className="text-gray-500 font-medium">{index + 1}</div>
      ),
    },
    {
      name: "Date",
      cell: (row: DataMaintenanceProps) => (
        <div className="text-gray-700">
          {new Date(row.date).toLocaleDateString("en-Us", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      name: "Vehicle & Type",
      cell: (row: DataMaintenanceProps) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{row.car}</span>
        </div>
      ),
    },
    {
      name: "Type of Maintenance",
      cell: (row: DataMaintenanceProps) => (
        <div className="flex flex-col">
          <span className="text-[11px] text-gray-500 uppercase">
            {row.type_of_maintenance}
          </span>
        </div>
      ),
    },
    {
      name: "Cost",
      cell: (row: DataMaintenanceProps) => (
        <div className="font-bold text-gray-900">
          ₱{Number(row.cost_of_maintenance).toLocaleString()}
        </div>
      ),
    },
    {
      name: "Status",
      cell: (row: DataMaintenanceProps) => (
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
      cell: (row: DataMaintenanceProps) => (
        <div className="flex gap-3">
          {row.status === "On Maintenance" && (
            <div className="group">
              <icons.check
                className="cursor-pointer text-emerald-500 hover:text-emerald-700 text-xl transition-colors"
                onClick={() => setOpenStatus(true)}
              />
              <UpdateStatus
                disabled={loading}
                open={openStatus}
                onClick={() => handleUpdate(row.id)}
                onClose={() => setOpenStatus(false)}
                children={"Mark as Completed?"}
              />
            </div>
          )}

          <icons.openEye
            className="cursor-pointer text-slate-400 hover:text-slate-600 text-xl transition-colors"
            onClick={() => {
              setFormMode("view");
              setSelectedMaintenanceId(row);
              onOpen();
            }}
          />

          {row.status === "On Maintenance" && (
            <icons.edit
              className="cursor-pointer text-indigo-400 hover:text-indigo-600 text-xl transition-colors"
              onClick={() => {
                setFormMode("edit");
                setSelectedMaintenanceId(row);
                onOpen();
              }}
            />
          )}
          <icons.trash
            className="cursor-pointer text-rose-400 hover:text-rose-600 text-xl transition-colors"
            onClick={() => setOpenDelete(true)}
          />
          <DeleteModal
            disabled={loading}
            onClose={() => setOpenDelete(false)}
            onClick={() => handleDelete(row.id)}
            open={openDelete}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="px-8 pt-10 w-full min-h-screen bg-white overflow-y-auto pb-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Maintenance
        </h1>
        <p className="text-gray-500 mt-1">
          Track and manage vehicle service records.
        </p>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Stats Cards Section */}
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
            description="Total serviced units"
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
            description="Currently in shop"
            topIcon={<icons.onMaintenance className="text-blue-600 text-2xl" />}
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <CustomButtons
            icons={<icons.add className="text-white text-lg" />}
            handleclick={() => {
              setFormMode("create");
              setSelectedMaintenanceId(null);
              onOpen();
            }}
            children="New Maintenance"
            className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-none cursor-pointer"
          />
          {open && (
            <MaintenanceForm
              open={open}
              onClose={onClose}
              mode={formMode}
              initialData={selectedMaintenanceId ?? undefined}
            />
          )}
        </div>
      </div>

      {/* Table & Filter Section */}
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
    </div>
  );
};

export default React.memo(Maintenance);
