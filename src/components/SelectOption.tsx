
interface SelectOptionProps {
    children:string[]
}
const SelectOption:React.FC<SelectOptionProps> = ({children}) => {
  return (
    <select>
        <option value="On Service">{children}</option>
        <option value="Reserved">{children}</option>
        <option value="Ended">{children}</option>
    </select>
  )
}

export default SelectOption