import type { CustomButtonTypes } from "../types/types"


 const CustomButtons:React.FC<CustomButtonTypes> = ({
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

export default CustomButtons

