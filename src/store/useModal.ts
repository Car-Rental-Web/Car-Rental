import { create } from "zustand";

type ModalType = "vehicle" | "maintenance" | "booking" | null


interface ModalStore {
    openModal:ModalType;
    setOpenModal: (type: ModalType) => void;
    closeModal: () => void
}

export const useModal = create<ModalStore>((set) => ({
  openModal: null,
  setOpenModal: (type) => set({ openModal: type }),
  closeModal: () => set({ openModal: null }),
}));