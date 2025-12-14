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
  name:string
  license:string
  carType:string
  model:string
  startDate: Date
  endDate:Date
  startTime:string;
  endTime:string;
  location:string
  typeOfRent: "self-drive" | "with Driver"
  status: string | null
  action: React.ReactNode
 }

 export interface  DataRenterProps {
  id:number;
  name:string;
  license:string;
  lastDateRented:Date;
  timesRented:string;
  feedBack:string;
  action:React.ReactNode 
 }


 export interface DataVehicleProps {
    id:string;
    model:string;
    brand:string;
    type:string;
    color:string;
    plateNumber:string;
    status: string | null
    action:React.ReactNode
 }


 export interface DataMaintenanceProps {
    id:number;
    date: Date;
    car:string;
    typeOfMaintenance: string;
    costOfMaintenance: React.ReactNode;
    location:string;
    maintainedBy:string;
    status: string | null
    action: React.ReactNode
 }

 export interface ModalProps {
  open: boolean;
  onClose: () => void;
  
}