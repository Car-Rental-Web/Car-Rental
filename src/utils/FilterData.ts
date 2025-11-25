export const filterData = <T,> (query:string, data:T[], fields: (keyof T)[]):T[] => {
  const thisQuery = query.toLowerCase()
  return data.filter(item => 
    fields.some(field => {
      const value = item[field]
     if(value === null || value === undefined) return false;

     // filter with date
     const strValue = 
     value instanceof Date 
     ? value.toLocaleString()
     :value.toString();
     return strValue.toLowerCase().includes(thisQuery)
    })
  )
}