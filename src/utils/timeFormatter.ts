export const  to12Hour = (time24: string) =>  {
  if (!time24) return "";
  const [hourStr, minutes] = time24.split(":");
  let hours = parseInt(hourStr, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; 
  return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
}

export const formatDate = (dateString:string) => {
    if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  
}

export const formatDateandDay = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  const formattedDate = date.toLocaleDateString('en-US', options);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

  return `${formattedDate} - ${dayName}`;
};