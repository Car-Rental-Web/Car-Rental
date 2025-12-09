import icons from "../constants/icon"
import type { CustomButtonTypes } from "../types/types"

interface ModalButtonProps {
  onclick: () => void
}

export const CustomButtons:React.FC<CustomButtonTypes> = ({
  className,children,handleclick
}) => {
  return (
    <button
    onClick={handleclick}
     className={className}
    >
      {children}
    </button> 
  )
}


 export const ModalButton:React.FC<ModalButtonProps> = ({onclick}) => {
  return (
     <button onClick={onclick} className="cursor-pointer">
              <icons.closeModal className="text-[#4E8EA2] w-12 h-12" />
      </button>
  )
}

