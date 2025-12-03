import { useState } from "react";
import { ModalButton } from "../components/CustomButtons";
import icons from "../constants/icon";
import type { ModalProps } from "../types/types";

const BookingForm: React.FC<ModalProps> = ({ open, onClose }) => {
  const [selectToggle, setSelectToggle] = useState(false);

  if (!open) return null;
  return (
    <div className="absolute  inset-0 bg-gray-400/25 z-999 flex justify-center items-center">
      <form
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
                className="border py-4 px-4 border-gray-400 rounded"
                type="text"
                placeholder="Ex:John Doe"
              />
            </div>
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="" className="text-start">
                Address
              </label>
              <input
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
                <input className="text-gray-600 w-full" type="file"   />
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
                      type="date"
                      className="border py-4 px-4 border-gray-400 rounded"
                    />
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className="text-start">
                      End Date
                    </label>
                    <input
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
                      name=""
                      id=""
                      className="border py-4 px-4 border-gray-400 rounded appearance-none outline-none"
                    >
                      <option value="">Self Drive</option>
                      <option value="">With Driver</option>
                    </select>
                    <div className="absolute top-12 right-3"> {selectToggle ? (<icons.up />) :(<icons.down/>)}</div>
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <label htmlFor="" className="text-start">
                      Location
                    </label>
                    <input
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
                        type="text"
                        className="border py-4 px-4 border-gray-400 rounded"
                        placeholder="Ex:Civic LX"
                      />
                    </div>
                  </div>
                  <div className="flex w-full gap-5 ">
            <div className="flex flex-col flex-1  gap-1 ">
              <label htmlFor="" className="text-start">
                Type #
              </label>
              <input
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
                <input className="text-gray-600 w-full" type="file"   />
                <icons.upload className="absolute right-3" />
              </div>
            </div>
          </div>
                  <div className="w-full flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="" className="text-start">Notes</label>
                      <textarea name="" id="" className="appearance-none outline-none border border-gray-400 rounded px-4 py-4" placeholder="Ex: Renter is on time"></textarea>
                    </div>
                    <div className="w-full text-start flex flex-col gap-1">
                      <label htmlFor="" className="">Uploaded pictures of proof the whole transactions <span>(others)</span></label>
                      <div className="relative flex  items-center border border-gray-400  py-4 px-4  rounded">
                        <input className="text-gray-600" type="file" />
                        <icons.upload className="absolute right-3" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <label htmlFor="">Add as reservation <span className="text-primary">(Note: if checked this will add the record as a reservation)</span></label>
                    <input type="checkbox" className="appearance-none outline-none border border-blue-500 py-3 px-3 rounded cursor-pointer" />
                  </div>
                </div>
                <div className=" text-center pb-4">
                  <button type="button" className="w-full text-white py-4 cursor-pointer rounded  menu-bg">Add</button>
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
