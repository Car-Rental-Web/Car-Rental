import { ModalButton } from "../components/CustomButtons";
import { createPortal } from "react-dom";

interface DeleteProps {
  open: boolean;
  onClose: () => void;
  onClick: () => void;
  disabled: boolean;
}

const DeleteModal: React.FC<DeleteProps> = ({ open, onClose, onClick,disabled }) => {
  if (!open) return;
  return createPortal(
    <div className="fixed inset-0 bg-[#032d44]/25 z-1000 flex  justify-center items-center ">
      <div className="relative w-96 h-48 border border-white flex flex-col justify-center items-center gap-3 rounded bg-white">
        <ModalButton className="absolute top-4 right-5" onclick={onClose} />
        <p className="text-white text-xl pt-6 txt-color">
          Are you sure you want to delete?
        </p>
        <div className="flex gap-3 pt-2">
          <button
            disabled={disabled}
            onClick={onClick}
            className="text-white bg-red-600 py-2 px-6 rounded cursor-pointer"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="text-white py-2 px-6 rounded txt-color border border-gray-400 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default DeleteModal;
