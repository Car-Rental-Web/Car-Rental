import type { CustomButtonTypes } from "../types/types"


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

