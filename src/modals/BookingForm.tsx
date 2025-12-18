import { useEffect, useState } from "react";
import { ModalButton } from "../components/CustomButtons";
import icons from "../constants/icon";
import type { ModalProps } from "../types/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RenterFormSchema, type RenterFormData } from "../schema/schema";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";

const BookingForm: React.FC<ModalProps> = ({ open, onClose }) => {
  const [selectToggle, setSelectToggle] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<
    { id: string; plate_no: string; model: string; type: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(RenterFormSchema),
  });


  useEffect(() => {
    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_no ,model, type").neq('status', 'On Maintenance')

      if (error) {
        console.log("Error fetching Vehicles", error);
        return;
      }
      setVehicles(data);
    };
    fetchVehicle();
  }, []);

   const selectedPlate = watch("car_plate_number");
  useEffect(() => {
    if (!selectedPlate) {
      setValue("car_model", "");
      setValue("car_type", "");
    }
    const selectedVehicle = vehicles.find((v) => v.plate_no === selectedPlate);

    if (selectedVehicle) {
      setValue("car_model", selectedVehicle.model);
      setValue("car_type", selectedVehicle.type);
    }
  }, [selectedPlate, vehicles, setValue]);


    const uploadFile = async (file: File, bucket: string, folder?: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSubmit = async (data: RenterFormData) => {
    try {
      setIsLoading(true);
      const validIdUrl = data.valid_id?.[0]
        ? await uploadFile(data.valid_id[0], "valid_id")
        : null;
      const agreementPhotoUrl = data.agreement_photo?.[0]
        ? await uploadFile(data.agreement_photo[0], "agreement_photo")
        : null;
      const uploadedProofUrls = data.uploaded_proof
        ? await Promise.all(
            Array.from(data.uploaded_proof).map((file) =>
              uploadFile(file, "uploaded_proof")
            )
          )
        : null;
      console.log(data);
      const { data: bookings, error } = await supabase.from("booking").insert({
        full_name: data.full_name,
        address: data.address,
        license_number: data.license_number,
        valid_id: validIdUrl,
        pagibig_number: data.pagibig_number,
        sss_number: data.sss_number,
        tin_number: data.tin_number,
        philhealth_number: data.philhealth_number,
        car_plate_number: data.car_plate_number,
        car_model: data.car_model,
        car_type: data.car_type,
        total_price_rent: data.total_price_rent,
        downpayment: data.downpayment,
        start_date: data.start_date,
        end_date: data.end_date,
        start_time: data.start_time,
        end_time: data.end_time,
        type_of_rent: data.type_of_rent,
        location: data.location,
        vehicle_left_plate_number: data.vehicle_left_plate_number,
        vehicle_left_model: data.vehicle_left_model,
        vehicle_left_type: data.vehicle_left_type,
        agreement_photo: agreementPhotoUrl,
        notes: data.notes,
        uploaded_proof: uploadedProofUrls,
        status: data.status,
      });

      if (error) {
        console.log("Error adding renter:", error);
        toast.error("Error adding renter:" + error.message);
        return;
      }
      console.log("Renter added successfully:", bookings);
      toast.success("Renter added successfully");

      const {data:renter, error:renterError} = await supabase.from('renter').select("id, times_rented")
      .eq("license_number", data.license_number).maybeSingle()

      if(renterError) {
        console.log('Error', error)
        toast.error('Error')
      }
      if(!renter){
        await supabase.from('renter').insert({
          full_name: data.full_name,
          license_number: data.license_number,
          times_rented:1,
          notes: data.notes
        })
      } else {
        await supabase.from('renter').update({times_rented: renter.times_rented +1}).eq("id", renter.id)
      }

      const bookingStatus = data.status as "On Service" | "On Reservation" 
      const {data:vehicleData, error:vehicleError} = await supabase.from('vehicle').update({status:bookingStatus}).eq("plate_no", data.car_plate_number)

      if(vehicleError){
        console.log('Error Updating In Vehicle',error)
        toast.error('Error Updating In Vehicle')
        return
      }
      console.log('Successfully Updated In Vehicle',vehicleData)

    } catch (error) {
      console.log("Error adding renter:", error);
      toast.error("Error adding renter");
    } finally {
      setIsLoading(false);
      onClose();
    }
  };


  if (!open) return null;

  return (
    <div className="fixed  inset-0 bg-[#032d44]/25  z-999 flex justify-center items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        action=""
        className="h-full overflow-y-auto  border border-gray-400 rounded-xl  w-3/5 bg-sub px-8 py-4"
      >
        <div className="flex flex-col gap-5">
          <div>
            <ModalButton onclick={onClose} />
            <p className=" text-start text-white text-primary">
              Renter Information
            </p>
          </div>
          <div className="flex w-full justify-around items-center gap-5 ">
            <div className="flex flex-col w-full gap-1 ">
              <label className=" text-start text-white">
                Fullname
              </label>
              <input
                {...register("full_name")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                type="text"
                placeholder="Ex:John Doe"
              />
              {errors.full_name && (
                <p className="text-red-500  text-start ">
                  {errors.full_name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Address
              </label>
              <input
                {...register("address")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                type="text"
                placeholder="Ex:110 Maligaya St."
              />
            </div>
          </div>
          <div className="flex w-full gap-5 ">
            <div className="flex flex-col flex-1  gap-1 ">
              <label htmlFor="" className=" text-start text-white">
                License id / Number
              </label>
              <input
                {...register("license_number")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col flex-1 gap-1  ">
              <label htmlFor="" className=" text-start text-white">
                Valid id
              </label>
              <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded placeholder-gray-400 text-white ">
                <input
                  {...register("valid_id")}
                  className="text-gray-600 w-full"
                  type="file"
                  accept="image/*"
                />
                <icons.upload className="absolute right-3 txt-color" />
              </div>
            </div>
          </div>
          <div className="flex w-full justify-around items-center gap-5">
            <div className="flex flex-col w-full gap-1 ">
              <label htmlFor="" className=" text-start text-white">
                Pagibig No.
                <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                {...register("pagibig_number")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                SSS No.<span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                {...register("sss_number")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
          </div>
          <div className="flex w-full justify-around items-center gap-5 ">
            <div className="flex flex-col w-full gap-1 ">
              <label htmlFor="" className=" text-start text-white">
                Tin No.<span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                {...register("tin_number")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Philhealth No.
                <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                {...register("philhealth_number")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
          </div>
          <div className="flex flex-col w-full gap-3">
            <p className=" text-start text-white text-primary">Car Rented</p>
            <div className="flex  justify-around items-center w-full gap-3">
              <div
                onClick={() => setSelectToggle(!selectToggle)}
                className="flex flex-col w-full relative "
              >
                <label htmlFor="" className="text-start text-white">
                  Plate #
                </label>
                <select
                  {...register("car_plate_number", {required:true})}
                  className="appearance-none outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-400  text-white"
                >
                  <option value="" className="txt-color">
                    Select Vehicle
                  </option>
                  {vehicles.map((vehicle) => (
                    <option
                      className="txt-color"
                      key={vehicle.id}
                      value={vehicle.plate_no}
                    >
                      {vehicle.plate_no}
                    </option>
                  ))}
                </select>
                {selectToggle ? (
                  <icons.up className="absolute bottom-5 right-4 txt-color" />
                ) : (
                  <icons.down className="absolute bottom-5 right-4 txt-color" />
                )}
              </div>
              <div className="flex flex-col w-full">
                <label htmlFor="" className=" text-start text-white">
                  Model
                </label>
                <input
                  readOnly
                  {...register("car_model" , {required:true})}
                  type="text"
                  placeholder="Ex:Civic LX"
                  className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                />
              </div>
              <div className="flex flex-col w-full">
                <label htmlFor="" className=" text-start text-white">
                  Type
                </label>
                <input
                  readOnly
                  {...register("car_type", {required:true})}
                  type="text"
                  placeholder="Ex: Sedan"
                  className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full gap-5">
            <p className=" text-start text-white text-primary">
              Location Visting
            </p>
            <div>
              <div className="flex flex-col gap-5">
                <div className="flex w-full justify-around gap-5">
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Total Price
                    </label>
                    <input
                      {...register("total_price_rent", {required:true})}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                      placeholder="Ex: 2000"
                    />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Downpayment
                    </label>
                    <input
                      {...register("downpayment", {required:true})}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                      placeholder="Ex:1000"
                    />
                  </div>
                </div>
                <div className="flex w-full justify-around gap-5">
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Start Date
                    </label>
                    <input
                      {...register("start_date", {required:true})}
                      type="date"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 "
                    />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      End Date
                    </label>
                    <input
                      {...register("end_date", {required:true})}
                      type="date"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 "
                    />
                  </div>
                </div>
                <div className="flex w-full justify-around gap-5">
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Start Time
                    </label>
                    <input
                      {...register("start_time", {required:true})}
                      type="time"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 "
                    />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      End Time
                    </label>
                    <input
                      {...register("end_time", {required:true})}
                      type="time"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 "
                    />
                  </div>
                </div>
                <div className="flex w-full justify-around gap-5">
                  <div
                    onClick={() => setSelectToggle((t) => !t)}
                    className="flex relative flex-col w-full gap-1"
                  >
                    <label htmlFor="" className=" text-start text-white">
                      Type of Rent
                    </label>
                    <select
                      {...register("type_of_rent", {required:true})}
                      className="border py-4 px-4 border-gray-400 rounded text-white  appearance-none outline-none"
                    >
                      <option value="" >Select Type of Rent</option>
                      <option value="Self Drive" className="txt-color">Self Drive</option>
                      <option value="With Driver" className="txt-color">With Driver</option>
                    </select>
                    <div className="absolute top-12 right-3">
                      {" "}
                      {selectToggle ? (
                        <icons.up className=" txt-color" />
                      ) : (
                        <icons.down className=" txt-color" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Location
                    </label>
                    <input
                      {...register("location", {required:true})}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                      placeholder="Ex: Baguio"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 w-full">
                <p className=" text-start text-white text-primary">
                  Vehicle left in the garage of renter
                  <span className="text-sm   text-start  text-white">
                    (optional)
                  </span>
                </p>
                <div className="flex flex-col gap-5">
                  <div className="flex w-full gap-5">
                    <div className="flex flex-col w-full">
                      <label htmlFor="" className=" text-start text-white">
                        Plate #
                      </label>
                      <input
                        {...register("vehicle_left_plate_number")}
                        type="text"
                        className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                        placeholder="Ex:ABC-1234"
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label htmlFor="" className=" text-start text-white">
                        Model
                      </label>
                      <input
                        {...register("vehicle_left_model")}
                        type="text"
                        className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                        placeholder="Ex:Civic LX"
                      />
                    </div>
                  </div>
                  <div className="flex w-full gap-5 ">
                    <div className="flex flex-col flex-1  gap-1 ">
                      <label htmlFor="" className=" text-start text-white">
                        Type
                      </label>
                      <input
                        {...register("vehicle_left_type")}
                        className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                        type="text"
                        placeholder="Ex:N01-23-456789"
                      />
                    </div>
                    <div className="flex flex-col flex-1 gap-1  ">
                      <label htmlFor="" className=" text-start text-white">
                        Agreement <span>(photo)</span> signed documents
                      </label>
                      <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded placeholder-gray-400 text-white ">
                        <input
                          {...register("agreement_photo")}
                          className="text-gray-600 w-full"
                          type="file"
                          accept="image/*"
                        />
                        <icons.upload className="absolute right-3 txt-color" />
                      </div>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="" className=" text-start text-white">
                        Notes
                      </label>
                      <textarea
                        {...register("notes")}
                        className="appearance-none outline-none border border-gray-400 rounded placeholder-gray-400  px-4 py-4 text-white"
                        placeholder="Ex: Renter is on time"
                      ></textarea>
                    </div>
                    <div className="w-full  text-start text-white flex flex-col gap-1">
                      <label htmlFor="" className="">
                        Uploaded pictures of proof the whole transactions{" "}
                        <span>(others)</span>
                      </label>
                      <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded placeholder-gray-400 text-white ">
                        <input
                          {...register("uploaded_proof")}
                          className="text-gray-600"
                          type="file"
                          accept="image/*"
                          multiple
                        />
                        <icons.upload className="absolute right-3 txt-color" />
                      </div>
                    </div>
                  </div>
                  <div onClick={() => setSelectToggle((t) => !t)} className=" flex relative flex-col w-full gap-1">
                    <label htmlFor="" className="text-white text-start">
                        Status
                    </label>
                    <select {...register("status", {required:true})} className=" appearance-none outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-400  text-white">
                      <option value="">Select Status</option>
                      <option value="On Service" className="txt-color">On Service</option>
                      <option value="On Reservation" className="txt-color">On Reservation</option>
                      <option value="Completed" className="txt-color">Completed</option>
                    </select>
                     <div className="absolute top-12 right-3 txt-color">
                {selectToggle? <icons.up /> : <icons.down />}
                      </div>
                  </div>
                </div>
                <div className=" text-center pb-4">
                  <button
                    type="submit"
                    className="w-full text-white py-4 cursor-pointer rounded placeholder-gray-400   button-color"
                  >
                    {loading ? "Adding" : "Add Renter"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
