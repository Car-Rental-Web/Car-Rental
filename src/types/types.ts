import type {
  Alignment,
  Direction,
  TableColumn,
} from "react-data-table-component";

export interface LinksPath {
  className?: string;
  urlDashBoard: string;
  dashboard?: string;
  recent?: string;
  folder?: string;
  otherfolder?: string;
  urlFolder?: string;
}

export interface CustomLinksTypes {
  className?: string;
  text?: string;
  url: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onclick?: () => void;
}

export interface CustomButtonTypes {
  className?: string;
  children: React.ReactNode;
  handleclick?: () => void;
  icons: React.ReactNode;
}

export interface SideBarProps {
  iconChildren: React.ReactNode;
  path: string;
  url: string;
  label: string;
}

export interface CustomTableProps<T> {
  data: T[];
  progressPending?: true | false;
  columns: TableColumn<T>[];
  title?: React.ReactNode;
  pagination?: true | false;
  striped?: true | false;
  highlightOnHover?: true | false;
  pointerOnHover?: true | false;
  dense?: true | false;
  responsive?: true | false;
  fixedHeader?: true | false;
  fixedHeaderScrollHeight?: string;
  subHeader?: true | false;
  subHeaderComponent?: React.ReactNode;
  subHeaderAlign?: Alignment;
  subHeaderWrap?: true | false;
  selectableRows?: true | false;
  direction?: Direction;
}

// export interface DataBookingProps {
//   id:number;
//   full_name: string;
//   license_number: string;
//   car_plate_number: string;
//   car_type: string;
//   car_model: string;
//   start_date: string;
//   end_date: string;
//   start_time: string;
//   end_time: string;
//   location: string;
//   type_of_rent: string;
//   status: string;
// }
export interface DataBookingRow{
  id: number;
  full_name: string;
  created_at:string;
  license_number: string;
  valid_id: any
  pagibig_number: string;
  sss_number: string;
  tin_number: string;
  philhealth_number: string;
  car_plate_number: string;
  car_type: string;
  car_model: string;
  total_price_rent: string;
  downpayment: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  type_of_rent: string;
  location: string;
  vehicle_left_plate_number?: string;
  vehicle_left_model?: string;
  vehicle_left_type?: string;
  agreement_photo: any
  notes: string;
  uploaded_proof: any
  status: string;
}
export interface DataBookingFormValues {
  id:number;
  full_name: string;
  created_at:string;
  address: string;
  license_number: string;

  valid_id?: any;
  agreement_photo?: any;
  uploaded_proof?: any;

  pagibig_number: string;
  sss_number: string;
  tin_number: string;
  philhealth_number: string;

  car_plate_number: string;
  car_type: string;
  car_model: string;

  total_price_rent: string;
  downpayment: string;

  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;

  type_of_rent: string;
  location: string;

  vehicle_left_plate_number?: string;
  vehicle_left_model?: string;
  vehicle_left_type?: string;

  notes: string;
  status: string;
}
export interface CalendarEvent {
  id: string;
  full_name: string;
  car_plate_number: string;
  car_model: string;
  start_date: Date;
  end_date: Date;
  start_time: string;
  end_time: string;
  location: string;
  status: string | null;
}

export interface DataRenterProps {
  id: number;
  full_name: string;
  license_number: string;
  // lastDateRented?:Date;
  times_rented?: number;
  notes: string;
  action?: React.ReactNode;
}

export interface DataRenterHistoryProps {
  id: number;
  created_at:string;
  full_name: string;
  address:string;
  valid_id: any;
  e_signature:any
  pagibig_number: string;
  sss_number: string;
  tin_number: string;
  philhealth_number: string;
  license_number: string;
  lastDateRented?:string;
  times_rented?: number;
  notes: string;
  action?: React.ReactNode;
}

export interface DataVehicleProps {
  id: number;
  model: string;
  brand: string;
  type: string;
  color: string;
  plate_no: string;
  status: string;
  action?: React.ReactNode;
}

export interface DataMaintenanceProps {
  id: number 
  date: string;
  car: string;
  type_of_maintenance: string;
  cost_of_maintenance: string;
  location: string;
  maintained_by: string;
  status: string ;
}

export type MaintenanceFormValues = {
  date: string;
  car: string;
  type_of_maintenance: string;
  cost_of_maintenance: string;
  location: string;
  maintained_by: string;
  status: string;
};

export interface TestProps {
  id: number;
  full_name: string;
  valid_id: string;
  plate_no: string;
  car_model: string;
  car_type: string;
  action?: React.ReactNode;
}

export interface DataVehicleTypes{
  id: number;
  car_image:any;
  model: string;
  brand: string;
  type: string;
  color: string;
  plate_number: string;
  status: string;
  action?: React.ReactNode;
}
export interface VehicleFormValues{
  car_image:any;
  model: string;
  brand: string;
  type: string;
  color: string;
  plate_number: string;
  status: string;
  action?: React.ReactNode;
}