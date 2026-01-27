import { toast } from "react-toastify";
import TrashTable from "../components/TrashTable";
import { supabase } from "../utils/supabase";
import { useEffect, useState } from "react";
import { formatDate } from "../utils/timeFormatter";

const TrashFiles = () => {
  const [data, setData] = useState({ renters: [], renter_bookings: [], vehicles: [], maintenance: [] });

  const fetchData = async (table: string, stateKey: string) => {
    const { data: res } = await supabase.from(table).select("*").not("deleted_at", "is", null);
    setData(prev => ({ ...prev, [stateKey]: res || [] }));
  };

  useEffect(() => {
    fetchData("renter", "renters");
    fetchData("renter_booking", "renter_bookings");
    fetchData("vehicle", "vehicles");
    fetchData("maintenance", "maintenance");
  }, []);

  const handleRestore = async (table: string, id: number, key: string) => {
    const { error } = await supabase.from(table).update({ deleted_at: null }).eq("id", id);
    if (!error) { toast.success("Restored!"); fetchData(table, key); }
  };

  const handleDelete = async (table:string, id:number, key:string) => {
    const {error} = await supabase.from(table).delete().eq("id", id)
    if (!error){toast.success("Deleted!"); fetchData(table,key)}
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* 1. Renters Table */}
      <TrashTable 
        title="Deleted Renters"
        data={data.renters}
        searchKeys={["full_name", "license_number"]}
        columns={[
          { header: "Name", key: "full_name" },
          { header: "License", key: "license_number" },
          { header: "Deleted Date", key: "deleted_at", render: (r) => formatDate(r.deleted_at) }
        ]}
        onRestore={(id) => handleRestore("renter", id, "renters")}
        onDelete={(id) => handleDelete("renter",id,"renters")}
      />

      {/* 2. Vehicles Table */}
      <TrashTable 
        title="Deleted Vehicles"
        data={data.vehicles}
        searchKeys={["car_model", "plate_number"]}
        columns={[
          { header: "Plate No", key: "plate_number" },
          { header: "Model", key: "car_model" },
          { header: "Type", key: "car_type" },
          { header: "Color", key: "car_color" },
          { header: "Deleted Date", key: "deleted_at", render: (r) => formatDate(r.deleted_at) },
        ]}
        onRestore={(id) => handleRestore("vehicle", id, "vehicles")}
        onDelete={(id) => handleDelete("vehicle",id,"vehicles")}

      />
      {/* 3. Bookings */}
      <TrashTable 
        title="Deleted Bookings"
        data={data.renter_bookings}
        searchKeys={["full_name", "license_number"]}
        columns={[
          { header: "name", key: "full_name" },
          { header: "License #", key: "license_number" },
          { header: "car", key: "car_plate_number" },
          { header: "model", key: "car_model" },
          { header: "type", key: "car_type" },
          { header: "Start date", key: "start_date", render: (s) => formatDate(s.start_date) },
          { header: "End date", key: "end_date", render: (s) => formatDate(s.end_date)  },
          { header: "Deleted Date", key: "deleted_at", render:(r) => formatDate(r.deleted_at) },
        ]}
        onRestore={(id) => handleRestore("renter_booking", id, "renter_bookings")}
        onDelete={(id) => handleDelete("renter_booking",id,"renter_bookings")}

      />
      {/* 4.  Maintenance */}
 <TrashTable 
        title="Deleted Maintenance"
        data={data.maintenance}
        searchKeys={["maintained_by"]}
        columns={[
          { header: "technician", key: "maintained_by" },
          { header: "car", key: "car" },
          { header: "type", key: "car_type" },
          { header: "Maintenance date", key: "date", render: (s) => formatDate(s.date) },
          { header: "Deleted Date", key: "deleted_at", render:(r) => formatDate(r.deleted_at) },
        ]}
        onRestore={(id) => handleRestore("maintenance", id, "maintenance")}
        onDelete={(id) => handleDelete("maintenance",id,"maintenance")}

      />
    </div>
  );
};

export default TrashFiles