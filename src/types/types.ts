import type { Alignment, Direction, TableColumn } from "react-data-table-component";

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
  icons: React.ReactNode
}

export interface SideBarProps {
  iconChildren: React.ReactNode;
  path: string;
  url: string;
  label: string;
}

export interface CustomTableProps<T> {
  data: T[];
  progressPending?: true | false
  columns: TableColumn<T>[];
  title?: React.ReactNode
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


export interface DataBookingProps {
  id:number
  full_name:string
  license_number:string
  car_plate_number:string;
  car_type:string
  car_model:string
  start_date: Date
  end_date:Date
  start_time:string;
  end_time:string;
  location:string
  type_of_rent: string | null
  status: string | null
  action?: React.ReactNode
 }


 export interface  DataRenterProps {
  id:number;
  full_name:string;
  license_number:string;
  // lastDateRented?:Date;
  times_rented?:number;
  notes:string;
  action?:React.ReactNode 
 }


 export interface DataVehicleProps {
    id:number;
    model:string;
    brand:string;
    type:string;
    color:string;
    plateNumber:string;
    status: string | null
    action?:React.ReactNode
 }


 export interface DataMaintenanceProps {
    id:number;
    date: Date;
    car:string;
    type_of_maintenance: string;
    cost_of_maintenance: string;
    location:string;
    maintained_by:string;
    status: string | null
    action?: React.ReactNode
 }

 export interface ModalProps {
  open: boolean;
  onClose: () => void;
  
}