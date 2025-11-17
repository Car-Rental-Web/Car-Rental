

interface CustomTypes {
  className?: string;
  children: React.ReactNode;
  handleclick?: () => void;

}
export const CustomButtons:React.FC<CustomTypes> = ({
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

