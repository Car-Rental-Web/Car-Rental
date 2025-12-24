/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import type { DataBookingProps } from "../types/types";
import { useDebouncedValue } from "../utils/useDebounce";
import { filterData } from "../utils/FilterData";
import icons from "../constants/icon";
import { CustomButtons } from "../components/CustomButtons";
import { useModalStore } from "../store/useModalStore";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";
import to12Hour from "../utils/timeFormatter";
import React from "react";
import { Card, SearchBar, TableData } from "../components";
import { DeleteModal, UpdateStatus } from "../modals";
import { useLoadingStore } from "../store/useLoading";

const BookingForm = React.lazy(() => import("../modals/BookingForm"));

const Bookings = () => {
  const [records, setRecords] = useState<DataBookingProps[]>([]);
  const [filterRecords, setFilterRecords] = useState<DataBookingProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toggle, setToggle] = useState(false);
  const [selectValue, setSelectValue] = useState("");
  const debounceSearchTerm = useDebouncedValue(searchTerm, 200);
  const [openDelete, setOpenDelete] = useState(false);
  const { open, onOpen, onClose } = useModalStore();
  const [openStatus, setOpenStatus] = useState(false);
  const {loading, setLoading} = useLoadingStore()

  useEffect(() => {
    onClose();
  }, [onClose]);

  //update action to completed if status = "On Service"
  const handleOnServiceUpdate = async (id: number) => { //, vehicleId: string
    setLoading(true)
    const { data, error } = await supabase
      .from("booking")
      .update({ status: "Completed" })
      .eq("id", id);
    if (error) {
      console.log("Failed to update");
      toast.error("Failed to update");
      return;
    }
// update vehicle status
    // const { data: vehicleData, error: vehicleError } = await supabase
    //   .from("vehicle")
    //   .update({ status: "Available" })
    //   .eq("plate_no", vehicleId);

    // if (vehicleError) {
    //   console.log("Failed to update Vehicle as Available");
    //   return;
    // }
    // console.log("Success updating status of vehicle", vehicleData);

    toast.success("Update Successfully");
    console.log("Update Successfully", data);
    setOpenStatus(false);
    setLoading(false)
  };

  //update action to completed if status = "On Reservation"
  const handleReserveUpdate = async (id: number) => { //, vehicleId: string
    setLoading(true)
    const { data, error } = await supabase
      .from("booking")
      .update({ status: "On Service" })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update as ready");
      console.log("Failed to update as ready");
      return;
    }

    console.log("Successfully Update to On Service", data);
    toast.success("Successfully Update to On Service");
    setOpenStatus(false);
    setLoading(false)
    // update vehicle status
    // const { data: vehicleData, error: vehicleError } = await supabase
    //   .from("vehicle")
    //   .update({ status: "On Service" })
    //   .eq("plate_no", vehicleId);

    // if (vehicleError) {
    //   toast.error("Failed to update status in Vehicle");
    //   console.log("Failed to update status in Vehicle");
    //   return;
    // }
    // console.log("Successfully update status in vehicle", vehicleData);
  };

  //delete data of the renter or bookings based on id

  /* ===============================
   Normalize storage paths
   Handles:
   - public URLs
   - bucket/file paths
   - plain filenames
================================ */
  const normalizePaths = (files: string[], bucket: string): string[] => {
    return files
      .map((file) => {
        // Public URL → extract path
        if (file.startsWith("http")) {
          const marker = `/object/public/${bucket}/`;
          const index = file.indexOf(marker);
          return index !== -1 ? file.substring(index + marker.length) : null;
        }

        // Remove bucket prefix if present
        if (file.startsWith(`${bucket}/`)) {
          return file.replace(`${bucket}/`, "");
        }

        return file;
      })
      .filter(Boolean) as string[];
  };

  /* ===============================
   MAIN DELETE FUNCTION
================================ */
  const handleDeleteBooking = async (
    id: number,
    setOpenDelete: (v: boolean) => void,
    setRecords: React.Dispatch<React.SetStateAction<any[]>>,
    setFilterRecords: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    setLoading(true)
    try {
      /*  Fetch booking first */
      const { data: booking, error: fetchError } = await supabase
        .from("booking")
        .select("valid_id, agreement_photo, uploaded_proof")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) {
        toast.error("Booking not found");
        return;
      }

      if (!booking) return;

      /*  Delete STORAGE files */
      const tasks: Promise<any>[] = [];

      if (booking.valid_id) {
        tasks.push(
          supabase.storage
            .from("valid_id")
            .remove(normalizePaths([booking.valid_id], "valid_id"))
        );
      }

      if (booking.agreement_photo) {
        tasks.push(
          supabase.storage
            .from("agreement_photo")
            .remove(
              normalizePaths([booking.agreement_photo], "agreement_photo")
            )
        );
      }

      if (booking.uploaded_proof?.length) {
        const proofs =
          typeof booking.uploaded_proof === "string"
            ? JSON.parse(booking.uploaded_proof)
            : booking.uploaded_proof;

        tasks.push(
          supabase.storage
            .from("uploaded_proof")
            .remove(normalizePaths(proofs, "uploaded_proof"))
        );
      }

      await Promise.all(tasks);

      /*  Delete booking row */
      const { error: deleteError } = await supabase
        .from("booking")
        .delete()
        .eq("id", id);

      if (deleteError) {
        toast.error("Failed to delete booking");
        return;
      }

      /* Update UI */
      toast.success("Booking deleted successfully");
      setOpenDelete(false);
      setRecords((rows) => rows.filter((row) => row.id !== id));
      setFilterRecords((rows) => rows.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Delete booking error:", err);
      toast.error("Something went wrong");
    }
    setLoading(false)
    handleDeleteBooking(id, setOpenDelete, setRecords, setFilterRecords);
  };

  //fetch the data in that was inserted in booking form
  useEffect(() => {
    let isMounted = true;
    const fetchBookingData = async () => {
      try {
        const { data, error } = await supabase
          .from("booking")
          .select(
            "id, full_name, license_number, car_plate_number, car_model, car_type, start_date, end_date, start_time, end_time, location, type_of_rent, status"
          );
        if (!isMounted) return;

        const row = data ?? [];
        const rowData = row.map((item) => ({
          id: item.id,
          full_name: item.full_name,
          license_number: item.license_number,
          car_plate_number: item.car_plate_number,
          car_model: item.car_model,
          car_type: item.car_type,
          start_date: item.start_date,
          end_date: item.end_date,
          start_time: item.start_time,
          end_time: item.end_time,
          location: item.location,
          type_of_rent: item.type_of_rent,
          status: item.status,
        }));
        setFilterRecords(rowData);
        setRecords(rowData);
        if (error) {
          console.log("Error Fetching Data", error);
          return;
        }
        console.log("Sucessful fetch data", data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchBookingData();
    return () => {
      isMounted = false;
    };
  }, [open, openStatus]);

  //search filter
  useEffect(() => {
    let result = filterData(debounceSearchTerm, filterRecords, [
      "car_type",
      "car_model",
      "start_date",
      "license_number",
      "end_date",
      "location",
      "full_name",
      "status",
    ]);

    if (selectValue !== "") {
      result = result.filter((item) => item.status === selectValue);
    }
    setRecords(result);
  }, [debounceSearchTerm, selectValue, filterRecords]);

  //filter status to get the length or number of the bookings based on the status
  const onService = records.filter(
    (item) => item.status === "On Service"
  ).length;

  const onReservation = records.filter(
    (item) => item.status === "On Reservation"
  ).length;

  const onComplete = records.filter(
    (item) => item.status === "Completed"
  ).length;
  //total calculation of bookings
  const totalBookings = records.length;

  //table columns
  const columns = [
    {
      name: "No.",
      cell: (_row: DataBookingProps, index: number) => (
        <div className="text-center font-semibold ">{index + 1}</div>
      ),
    },
    {
      name: "Name",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.full_name}</div>
      ),
    },
    {
      name: "License #",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.license_number}</div>
      ),
    },
    {
      name: "Car",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.car_plate_number}</div>
      ),
    },
    {
      name: "Type",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.car_type}</div>
      ),
    },
    {
      name: "Model",
      cell: (row: DataBookingProps) => (
        <div className="text-center font-semibold">{row.car_model}</div>
      ),
    },
    {
      name: "Start Date",
      cell: (row: DataBookingProps) => (
        <div className="text-center ">
          {new Date(row.start_date).toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      name: "End Date",
      cell: (row: DataBookingProps) => (
        <div className="text-center ">
          {new Date(row.end_date).toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      name: "Pick up",
      cell: (row: DataBookingProps) => (
        <div className="text-center ">{to12Hour(row.start_time)}</div>
      ),
    },
    {
      name: "Drop off",
      cell: (row: DataBookingProps) => (
        <div className="text-center ">{to12Hour(row.end_time)}</div>
      ),
    },
    {
      name: "Location",
      cell: (row: DataBookingProps) => (
        <div className="text-center ">{row.location}</div>
      ),
    },
    {
      name: "Type of Rent",
      cell: (row: DataBookingProps) => <div>{row.type_of_rent}</div>,
    },
    {
      name: "Status",
      cell: (row: DataBookingProps) => (
        <span
          className={` rounded-full w-full px-2 py-1 text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10px] xl:text-[11px] ${
            row.status === "On Service"
              ? "bg-green-800 text-white  rounded-full w-full text-center"
              : row.status === "On Reservation"
              ? " bg-blue-900   rounded-full text-white w-full text-center"
              : row.status === "Completed"
              ? "bg-red-900 text-white  rounded-full w-full text-center"
              : "text-gray-400"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Action",
      cell: (row: DataBookingProps) => (
        <div className="flex gap-2">
          {row.status === "On Service" && (
            <div>
              <icons.check
                className="cursor-pointer text-green-400 text-xl"
                onClick={() => setOpenStatus(true)}
              />

              <UpdateStatus
              disabled={loading}
                children={"Transaction Complete?"}
                onClick={() =>
                  handleOnServiceUpdate(row.id) //, row.car_plate_number
                }
                onClose={() => setOpenStatus(false)}
                open={openStatus}
              />
            </div>
          )}

          {row.status === "On Reservation" && (
            <div>
              <icons.check
                className="cursor-pointer text-green-400 text-xl"
                onClick={() => setOpenStatus(true)}
              />

              <UpdateStatus
              disabled={loading}  
                children={"Ready to Service?"}
                onClick={() =>
                  handleReserveUpdate(row.id) //, row.car_plate_number
                }
                onClose={() => setOpenStatus(false)}
                open={openStatus}
              />
            </div>
          )}
          <icons.edit className="cursor-pointer text-blue-400 text-xl" />
          <icons.trash
            className="cursor-pointer text-red-400 text-xl"
            onClick={() => setOpenDelete(true)}
          />
          <DeleteModal
          disabled={loading}
            open={openDelete}
            onClose={() => setOpenDelete(false)}
            onClick={() =>
              handleDeleteBooking(
                row.id,
                setOpenDelete,
                setRecords,
                setFilterRecords
              )
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen  overflow-y-auto  flex flex-col gap-5  pt-12 pb-2 px-6 bg-body">
      <div className="">
        <p className="text-5xl font-semibold text-gray-300 tracking-wide pb-5">
          Bookings
        </p>
        <div className="flex flex-col xl:flex-row gap-2">
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">On Service</span>}
            url={""}
            amount={<span className="text-6xl">{onService}</span>}
            description="Total Booked On Service"
            topIcon={<icons.onService className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">On Reservation</span>}
            url={""}
            amount={<span className="text-6xl">{onReservation}</span>}
            description="Total Booked Reservation"
            topIcon={<icons.onReserve className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">Completed</span>}
            url={""}
            amount={<span className="text-6xl">{onComplete}</span>}
            description="Total Booked Ended"
            topIcon={<icons.onEnded className="text-white text-2xl" />}
          />
          <Card
            className="bg-border w-full"
            title={<span className="text-md xl:text-2xl">Total Bookings</span>}
            url={""}
            amount={<span className="text-6xl">{totalBookings}</span>}
            description="Total Bookings"
            topIcon={<icons.all className="text-white text-2xl" />}
          />
        </div>
      </div>
      <div className="flex flex-col gap-6 ">
        <div className="text-end flex justify-end ">
          <CustomButtons
            icons={<icons.add className="text-xl text-white" />}
            handleclick={onOpen}
            children="Add Booking"
            className="py-1 md:py-2 px-2 md:px-4  rounded bg-[#4E8EA2] hover:bg-[#1d596b] text-white cursor-pointer text-xs md:text-base "
          />
          <BookingForm open={open} onClose={onClose} />
        </div>
        <div className="flex flex-col gap-2 px-6 border border-gray-400 py-2 rounded ">
          <div className="flex pb-4 pt-4 w-full justify-end gap-3">
            <div
              onClick={() => setToggle((t) => !t)}
              className="flex relative border border-gray-200 rounded w-full  md:w-44"
            >
              <select
                onChange={(e) => setSelectValue(e.target.value)}
                value={selectValue}
                className=" w-full  rounded appearance-none outline-none  px-4 py-2 cursor-pointer text-xs xl:text-base text-white"
              >
                <option value="" className="txt-color">
                  All
                </option>
                <option value="On Service" className="txt-color">
                  On-Service
                </option>
                <option value="On Reservation" className="txt-color">
                  Reserved
                </option>
                <option value="Completed" className="txt-color">
                  Completed
                </option>
              </select>
              <div className="absolute top-2 xl:top-3 right-3 txt-color">
                {" "}
                {toggle ? <icons.up /> : <icons.down />}
              </div>
            </div>
            <div className="">
              <SearchBar
                onClear={() => setSearchTerm("")}
                value={searchTerm}
                className="  bg-border text-white  rounded py-2 w-60 "
                placeholder="Search"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className=" rounded mt-2">
            <TableData
              progressPending={false}
              pagination={true}
              title={<span className="font-bold">Bookings</span>}
              data={records}
              columns={columns}
              fixedHeader={true}
              responsive={true}
              fixedHeaderScrollHeight="350px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Bookings);
