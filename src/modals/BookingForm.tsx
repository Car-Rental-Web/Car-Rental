import { useEffect, useState } from "react";
import { ModalButton } from "../components/CustomButtons";
import icons from "../constants/icon";
import type { ModalProps } from "../types/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RenterFormSchema, type RenterFormData } from "../schema/schema";
import { supabase } from "../utils/supabase";

const BookingForm: React.FC<ModalProps> = ({ open, onClose }) => {
  const [selectToggle, setSelectToggle] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<{id:string; plate_no:string; model:string; type:string}[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(RenterFormSchema),
  });

    const selectedPlate= watch("carPlateNumber")

  const onSubmit = async (data: RenterFormData) => {
    const { data: renter, error: renterError } = await supabase
      .from("renters")
      .insert({
        fullName: data.fullName,
        address: data.address,
        license_id_number: data.licenseNumber,
        valid_id_photo: data.validId,
        pagibig_no: data.pagIbigNumber,
        sss_no: data.sssNumber,
        tin_no: data.tinNumber,
        philhealth_no: data.philHealthNumber,
      })
      .select()
      .single();

    const { data: carRented, error: carRentedError } = await supabase
      .from("car_rented")
      .insert({
        plate_no: data.carPlateNumber,
        model: data.carModel,
        type: data.carType,
      })
      .select()
      .single();
    const { data: renterLocation, error: renterLocationError } = await supabase
      .from("renter_location_visiting")
      .insert({
        total_price: data.totalPriceRent,
        down_payment: data.downPayment,
        start_date: data.startDate,
        end_date: data.endDate,
        start_time: data.startTime,
        end_time: data.endTime,
        type_of_rent: data.typeOfRent,
        location: data.location,
      });

    const { data: garageLeftVehicle, error: garageLeftVehicleError } =
      await supabase.from("garage_renter").insert({
        plate_no: data.vehicleLeftPlateNumber,
        model: data.vehicleLeftModel,
        type_no: data.vehicleLeftType,
        agreement_photo: data.agreementPhoto,
        notes: data.notes,
        uploaded_proof: data.uploadedProof,
        is_reservation: data.isReservation,
      });

    if (
      renterError ||
      carRentedError ||
      renterLocationError ||
      garageLeftVehicleError
    ) {
      setIsLoading(false);
      console.log("Error adding renter:", renterError || carRentedError);
      return;
    }
    console.log("Renter added successfully:", renter);
    console.log("Renter added successfully:", carRented);
    console.log("Renter added successfully:", renterLocation);
    console.log("Renter added successfully:", garageLeftVehicle);
    setIsLoading(false);
    onClose();
  };


  useEffect(() => {
      const fetchVehicle = async () => {
        const {data, error} = await supabase.from('vehicle').select('id, plate_no ,model, type')

        if(error) {
          console.log('Error fetching Vehicles', error)
          return
        }
        setVehicles(data)
      }
      fetchVehicle()
  },[])


  useEffect(() => {

    if(!selectedPlate) {
      setValue("carModel", "")
      setValue("carType", "")
    }
    const selectedVehicle = vehicles.find((v) => v.plate_no === selectedPlate)

    if(selectedVehicle) {
      setValue("carModel", selectedVehicle.model)
      setValue("carType", selectedVehicle.type)
    }
  },[selectedPlate,vehicles,setValue])


  if (!open) return null;

  return (
    <div className="absolute  inset-0 bg-[#032d44]/25  z-999 flex justify-center items-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        onClick={(e) => e.stopPropagation()}
        action=""
        className="h-4/5 overflow-y-auto  border border-gray-400 rounded-xl  w-3/5 bg-sub px-8 py-4"
      >
        <div className="flex flex-col gap-5">
          <div>
            <ModalButton onclick={onClose} />
            <p className=" text-start text-white text-primary">Renter Information</p>
          </div>
          <div className="flex w-full justify-around items-center gap-5 ">
            <div className="flex flex-col w-full gap-1 ">
              <label htmlFor="" className=" text-start text-white">
                Fullname
              </label>
              <input
                {...register("fullName")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
                type="text"
                placeholder="Ex:John Doe"
              />
              {errors.fullName && (
                <p className="text-red-500  text-start ">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                Address
              </label>
              <input
                {...register("address")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
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
                {...register("licenseNumber")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col flex-1 gap-1  ">
              <label htmlFor="" className=" text-start text-white">
                Valid id
              </label>
              <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded placeholder-gray-400 ">
                <input
                  {...register("validId")}
                  className="text-gray-600 w-full"
                  type="file"
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
                {...register("pagIbigNumber")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className=" text-start text-white">
                SSS No.<span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                {...register("sssNumber")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
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
                {...register("tinNumber")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
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
                {...register("philHealthNumber")}
                className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
          </div>
          <div className="flex flex-col w-full gap-3">
            <p className=" text-start text-white text-primary">Car Rented</p>
            <div className="flex  justify-around items-center w-full gap-3">
              <div onClick={() => setSelectToggle(!selectToggle)} className="flex flex-col w-full relative ">
                <label htmlFor="" className="text-start text-white">Plate #</label>
                <select
                  {...register("carPlateNumber")}
                  className="appearance-none outline-none border py-4 px-4 border-gray-400 rounded placeholder-gray-400  text-white"
                >
                  <option value="" className="txt-color">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option className="txt-color" key={vehicle.id} value={vehicle.plate_no}>
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
                disabled
                  {...register("carModel")}
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
                disabled
                  {...register("carType")}
                  type="text"
                  placeholder="Ex: Sedan"
                  className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-white "
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full gap-5">
            <p className=" text-start text-white text-primary">Location Visting</p>
            <div>
              <div className="flex flex-col gap-5">
                <div className="flex w-full justify-around gap-5">
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Total Price
                    </label>
                    <input
                      {...register("totalPriceRent")}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
                      placeholder="Ex: 2000"
                    />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Downpayment
                    </label>
                    <input
                      {...register("downPayment")}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
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
                      {...register("startDate")}
                      type="date"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 "
                    />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      End Date
                    </label>
                    <input
                      {...register("endDate")}
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
                      {...register("startTime")}
                      type="time"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 text-gray-400 "
                    />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      End Time
                    </label>
                    <input
                      {...register("endTime")}
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
                      {...register("typeOfRent")}
                      name=""
                      id=""
                      className="border py-4 px-4 border-gray-400 rounded text-gray-400  appearance-none outline-none"
                    >
                      <option value="">Self Drive</option>
                      <option value="">With Driver</option>
                    </select>
                    <div className="absolute top-12 right-3">
                      {" "}
                      {selectToggle ? <icons.up className=" txt-color" /> : <icons.down className=" txt-color" />}
                    </div>
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className=" text-start text-white">
                      Location
                    </label>
                    <input
                      {...register("location")}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
                      placeholder="Ex: Baguio"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 w-full">
                <p className=" text-start text-white text-primary">
                  Vehicle left in the garage of renter
                  <span className="text-sm text-gray-400  text-start  text-primary">
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
                        {...register("vehicleLeftPlateNumber")}
                        type="text"
                        className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
                        placeholder="Ex:ABC-1234"
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label htmlFor="" className=" text-start text-white">
                        Model
                      </label>
                      <input
                        {...register("vehicleLeftModel")}
                        type="text"
                        className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
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
                        {...register("vehicleLeftType")}
                        className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
                        type="text"
                        placeholder="Ex:N01-23-456789"
                      />
                    </div>
                    <div className="flex flex-col flex-1 gap-1  ">
                      <label htmlFor="" className=" text-start text-white">
                        Agreement <span>(photo)</span> signed documents
                      </label>
                      <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded placeholder-gray-400 ">
                        <input
                          {...register("agreementPhoto")}
                          className="text-gray-600 w-full"
                          type="file"
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
                        className="appearance-none outline-none border border-gray-400 rounded placeholder-gray-400  px-4 py-4"
                        placeholder="Ex: Renter is on time"
                      ></textarea>
                    </div>
                    <div className="w-full  text-start text-white flex flex-col gap-1">
                      <label htmlFor="" className="">
                        Uploaded pictures of proof the whole transactions{" "}
                        <span>(others)</span>
                      </label>
                      <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded placeholder-gray-400 ">
                        <input className="text-gray-600" type="file" />
                        <icons.upload className="absolute right-3 txt-color" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <label htmlFor="">
                      Add as reservation{" "}
                      <span className="text-primary">
                        (Note: if checked this will add the record as a
                        reservation)
                      </span>
                    </label>
                    <input
                    {...register("isReservation")}
                      type="checkbox"
                      className="border border-blue-500 py-3 px-3 rounded placeholder-gray-400  cursor-pointer"
                    />
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
