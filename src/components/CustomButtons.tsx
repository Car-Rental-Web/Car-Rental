import icons from "../constants/icon"
import type { CustomButtonTypes } from "../types/types"

interface ModalButtonProps {
  className?:string
  onclick: () => void
}

export const CustomButtons:React.FC<CustomButtonTypes> = ({
  className,children,handleclick, icons
}) => {
  return (
    <button
    onClick={handleclick}
     className={`flex items-center gap-1 ${className}`}
    > 
    <span>{icons}</span>
      {children}
    </button> 
  )
}


 export const ModalButton:React.FC<ModalButtonProps> = ({onclick, className}) => {
  return (
     <button onClick={onclick} className={`cursor-pointer ${className}`}>
              <icons.closeModal className="text-[#4E8EA2] w-12 h-12" />
      </button>
  )
}

