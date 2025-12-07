import { useState } from "react";
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(RenterFormSchema),
  });

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

  if (!open) return null;
  return (
    <div className="absolute  inset-0 bg-gray-400/25 z-999 flex justify-center items-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        onClick={(e) => e.stopPropagation()}
        action=""
        className="h-4/5 overflow-y-auto  border border-gray-400 rounded-xl  w-3/5 bg-white px-8 py-4"
      >
        <div className="flex flex-col gap-5">
          <div>
            <ModalButton onclick={onClose} />
            <p className="text-start text-primary">Renter Information</p>
          </div>
          <div className="flex w-full justify-around items-center gap-5 ">
            <div className="flex flex-col w-full gap-1 ">
              <label htmlFor="" className="text-start">
                Fullname
              </label>
              <input
                {...register("fullName")}
                className="border py-4 px-4 border-gray-400 rounded"
                type="text"
                placeholder="Ex:John Doe"
              />
              {errors.fullName && (
                <p className="text-red-500 text-start">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className="text-start">
                Address
              </label>
              <input
                {...register("address")}
                className="border py-4 px-4 border-gray-400 rounded"
                type="text"
                placeholder="Ex:110 Maligaya St."
              />
            </div>
          </div>
          <div className="flex w-full gap-5 ">
            <div className="flex flex-col flex-1  gap-1 ">
              <label htmlFor="" className="text-start">
                License id / Number
              </label>
              <input
                {...register("licenseNumber")}
                className="border py-4 px-4 border-gray-400 rounded"
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col flex-1 gap-1  ">
              <label htmlFor="" className="text-start">
                Valid id
              </label>
              <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded">
                <input
                  {...register("validId")}
                  className="text-gray-600 w-full"
                  type="file"
                />
                <icons.upload className="absolute right-3" />
              </div>
            </div>
          </div>
          <div className="flex w-full justify-around items-center gap-5">
            <div className="flex flex-col w-full gap-1 ">
              <label htmlFor="" className="text-start">
                Pagibig No.
                <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                {...register("pagIbigNumber")}
                className="border py-4 px-4 border-gray-400 rounded"
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className="text-start">
                SSS No.<span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                {...register("sssNumber")}
                className="border py-4 px-4 border-gray-400 rounded"
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
          </div>
          <div className="flex w-full justify-around items-center gap-5 ">
            <div className="flex flex-col w-full gap-1 ">
              <label htmlFor="" className="text-start">
                Tin No.<span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                {...register("tinNumber")}
                className="border py-4 px-4 border-gray-400 rounded"
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className="text-start">
                Philhealth No.
                <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <input
                {...register("philHealthNumber")}
                className="border py-4 px-4 border-gray-400 rounded"
                type="text"
                placeholder="Ex:N01-23-456789"
              />
            </div>
          </div>
          <div className="flex flex-col w-full gap-5">
            <p className="text-start text-primary">Car Rented</p>
            <div className="flex  justify-around w-full gap-5">
              <div className="flex flex-col w-full">
                <label htmlFor="" className="text-start">
                  Plate #
                </label>
                <input
                  {...register("carPlateNumber")}
                  type="text"
                  placeholder="Ex:ABC-1234"
                  className="border py-4 px-4 border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col w-full">
                <label htmlFor="" className="text-start">
                  Model
                </label>
                <input
                  {...register("carModel")}
                  type="text"
                  placeholder="Ex:Civic LX"
                  className="border py-4 px-4 border-gray-400 rounded"
                />
              </div>
              <div className="flex flex-col w-full">
                <label htmlFor="" className="text-start">
                  Type
                </label>
                <input
                  {...register("carType")}
                  type="text"
                  placeholder="Ex: Sedan"
                  className="border py-4 px-4 border-gray-400 rounded"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full gap-5">
            <p className="text-start text-primary">Location Visting</p>
            <div>
              <div className="flex flex-col gap-5">
                <div className="flex w-full justify-around gap-5">
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className="text-start">
                      Total Price
                    </label>
                    <input
                      {...register("totalPriceRent")}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded"
                      placeholder="Ex: 2000"
                    />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className="text-start">
                      Downpayment
                    </label>
                    <input
                      {...register("downPayment")}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded"
                      placeholder="Ex:1000"
                    />
                  </div>
                </div>
                <div className="flex w-full justify-around gap-5">
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className="text-start">
                      Start Date
                    </label>
                    <input
                      {...register("startDate")}
                      type="date"
                      className="border py-4 px-4 border-gray-400 rounded"
                    />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className="text-start">
                      End Date
                    </label>
                    <input
                      {...register("endDate")}
                      type="date"
                      className="border py-4 px-4 border-gray-400 rounded"
                    />
                  </div>
                </div>
                <div className="flex w-full justify-around gap-5">
                  <div
                    onClick={() => setSelectToggle((t) => !t)}
                    className="flex relative flex-col w-full gap-1"
                  >
                    <label htmlFor="" className="text-start">
                      Type of Rent
                    </label>
                    <select
                      {...register("typeOfRent")}
                      name=""
                      id=""
                      className="border py-4 px-4 border-gray-400 rounded appearance-none outline-none"
                    >
                      <option value="">Self Drive</option>
                      <option value="">With Driver</option>
                    </select>
                    <div className="absolute top-12 right-3">
                      {" "}
                      {selectToggle ? <icons.up /> : <icons.down />}
                    </div>
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className="text-start">
                      Location
                    </label>
                    <input
                      {...register("location")}
                      type="text"
                      className="border py-4 px-4 border-gray-400 rounded"
                      placeholder="Ex: Baguio"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 w-full">
                <p className="text-start text-primary">
                  Vehicle left in the garage of renter
                  <span className="text-sm text-gray-400 text-start text-primary">
                    (optional)
                  </span>
                </p>
                <div className="flex flex-col gap-5">
                  <div className="flex w-full gap-5">
                    <div className="flex flex-col w-full">
                      <label htmlFor="" className="text-start">
                        Plate #
                      </label>
                      <input
                        {...register("vehicleLeftPlateNumber")}
                        type="text"
                        className="border py-4 px-4 border-gray-400 rounded"
                        placeholder="Ex:ABC-1234"
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label htmlFor="" className="text-start">
                        Model
                      </label>
                      <input
                        {...register("vehicleLeftModel")}
                        type="text"
                        className="border py-4 px-4 border-gray-400 rounded"
                        placeholder="Ex:Civic LX"
                      />
                    </div>
                  </div>
                  <div className="flex w-full gap-5 ">
                    <div className="flex flex-col flex-1  gap-1 ">
                      <label htmlFor="" className="text-start">
                        Type
                      </label>
                      <input
                        {...register("vehicleLeftType")}
                        className="border py-4 px-4 border-gray-400 rounded"
                        type="text"
                        placeholder="Ex:N01-23-456789"
                      />
                    </div>
                    <div className="flex flex-col flex-1 gap-1  ">
                      <label htmlFor="" className="text-start">
                        Agreement <span>(photo)</span> signed documents
                      </label>
                      <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded">
                        <input
                          {...register("agreementPhoto")}
                          className="text-gray-600 w-full"
                          type="file"
                        />
                        <icons.upload className="absolute right-3" />
                      </div>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="" className="text-start">
                        Notes
                      </label>
                      <textarea
                        name=""
                        id=""
                        className="appearance-none outline-none border border-gray-400 rounded px-4 py-4"
                        placeholder="Ex: Renter is on time"
                      ></textarea>
                    </div>
                    <div className="w-full text-start flex flex-col gap-1">
                      <label htmlFor="" className="">
                        Uploaded pictures of proof the whole transactions{" "}
                        <span>(others)</span>
                      </label>
                      <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded">
                        <input className="text-gray-600" type="file" />
                        <icons.upload className="absolute right-3" />
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
                      type="checkbox"
                      className="appearance-none outline-none border border-blue-500 py-3 px-3 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className=" text-center pb-4">
                  <button
                    type="button"
                    className="w-full text-white py-4 cursor-pointer rounded  menu-bg"
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
