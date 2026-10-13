/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify";
import TrashTable from "../components/TrashTable";
import { supabase } from "../utils/supabase";
import { useEffect, useState, useCallback } from "react";
import { formatDate } from "../utils/timeFormatter";

const TrashFiles = () => {
  const [data, setData] = useState({ 
    renters: [], 
    renter_bookings: [], 
    vehicles: [], 
    maintenance: [] 
  });

  const fetchData = useCallback(async (table: string, stateKey: string) => {
    const { data: res, error } = await supabase
      .from(table)
      .select("*")
      .not("deleted_at", "is", null);
      
    if (error) {
      toast.error(`Error fetching ${stateKey}`);
      return;
    }
    setData(prev => ({ ...prev, [stateKey]: res || [] }));
  }, []);

  useEffect(() => {
    fetchData("renter", "renters");
    fetchData("renter_booking", "renter_bookings");
    fetchData("vehicle", "vehicles");
    fetchData("maintenance", "maintenance");
  }, [fetchData]);

  const handleRestore = async (table: string, id: number, key: string) => {
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq("id", id);
      
    if (!error) { 
      toast.success("Restored successfully!"); 
      fetchData(table, key); 
    } else {
      toast.error("Failed to restore item");
    }
  };

  const handleDelete = async (table: string, id: number, key: string) => {
    try {
      // 1. Fetch data to get storage URL references before deleting row
      const { data: record, error: fetchError } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();
        
      if (fetchError) throw fetchError;

      // 2. Delete from Database
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq("id", id);
        
      if (deleteError) throw deleteError;

      // 3. Cleanup Storage Buckets based on table
      const getFileName = (url: string) => url?.split("/").pop();
      const storageDeletions = [];

      if (table === "renter") {
        if (record.valid_id) storageDeletions.push(supabase.storage.from("valid_id").remove([getFileName(record.valid_id)!]));
        if (record.e_signature) storageDeletions.push(supabase.storage.from("e_signature").remove([getFileName(record.e_signature)!]));
        if (record.renter_selfie) storageDeletions.push(supabase.storage.from("renter_selfie").remove([getFileName(record.renter_selfie)!]));
      }
      
      if (table === "vehicle") {
        // Assuming vehicle images are stored here
        if (record.vehicle_image) storageDeletions.push(supabase.storage.from("vehicle_image").remove([getFileName(record.vehicle_image)!]));
      }

      // Execute storage deletions concurrently
      await Promise.allSettled(storageDeletions);

      toast.success("Permanently deleted!");
      fetchData(table, key);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to delete permanently");
    }
  };

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
          { header: "Deleted Date", key: "deleted_at", render: (r: any) => formatDate(r.deleted_at) }
        ]}
        onRestore={(id) => handleRestore("renter", id, "renters")}
        onDelete={(id) => handleDelete("renter", id, "renters")}
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
          { header: "Deleted Date", key: "deleted_at", render: (r: any) => formatDate(r.deleted_at) },
        ]}
        onRestore={(id) => handleRestore("vehicle", id, "vehicles")}
        onDelete={(id) => handleDelete("vehicle", id, "vehicles")}
      />
      
      {/* 3. Bookings */}
      <TrashTable 
        title="Deleted Bookings"
        data={data.renter_bookings}
        searchKeys={["full_name", "license_number"]}
        columns={[
          { header: "Name", key: "full_name" },
          { header: "License #", key: "license_number" },
          { header: "Car", key: "car_plate_number" },
          { header: "Model", key: "car_model" },
          { header: "Type", key: "car_type" },
          { header: "Start date", key: "start_date", render: (s: any) => formatDate(s.start_date) },
          { header: "End date", key: "end_date", render: (s: any) => formatDate(s.end_date)  },
          { header: "Deleted Date", key: "deleted_at", render: (r: any) => formatDate(r.deleted_at) },
        ]}
        onRestore={(id) => handleRestore("renter_booking", id, "renter_bookings")}
        onDelete={(id) => handleDelete("renter_booking", id, "renter_bookings")}
      />
      
      {/* 4. Maintenance */}
      <TrashTable 
        title="Deleted Maintenance"
        data={data.maintenance}
        searchKeys={["maintained_by"]}
        columns={[
          { header: "Technician", key: "maintained_by" },
          { header: "Car", key: "car" },
          { header: "Type", key: "car_type" },
          { header: "Maintenance date", key: "date", render: (s: any) => formatDate(s.date) },
          { header: "Deleted Date", key: "deleted_at", render: (r: any) => formatDate(r.deleted_at) },
        ]}
        onRestore={(id) => handleRestore("maintenance", id, "maintenance")}
        onDelete={(id) => handleDelete("maintenance", id, "maintenance")}
      />
    </div>
  );
};

export default TrashFiles;