import { ModalButton } from "../components/CustomButtons";
import type { ModalProps } from "../types/types";



const VehicleForm: React.FC<ModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 bg-gray-400/25 z-999 flex justify-center items-center">
      <form  action="" className="border border-gray-400 rounded-xl py-4 px-8 w-2/5 bg-white">
       <ModalButton onclick={onClose}/>
        <div className="flex flex-col mb-3">
          <label htmlFor="" className="text-start">
            Model
          </label>
          <input className="border py-4 px-4 border-gray-400 rounded" type="text" placeholder="Ex:Civic Lx"/>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Brand
          </label>
          <input className="border py-4 px-4 border-gray-400 rounded" type="text" placeholder="Ex:Toyota"/>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Type
          </label>
          <input className="border py-4 px-4 border-gray-400 rounded" type="text" placeholder="Ex:Sedan"/>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Color
          </label>
          <input className="border py-4 px-4 border-gray-400 rounded" type="text" placeholder="Ex:Midnight Blue"/>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label htmlFor="" className="text-start">
            Plate #
          </label>
          <input className="border py-4 px-4 border-gray-400 rounded" type="text" placeholder="EX:ABC-1234"/>
        </div>
        <div className="mt-15 mb-6">
          <button type="button" className="bg-[#696FC7] text-white w-full py-4 rounded cursor-pointer">Add</button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
