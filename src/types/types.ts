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
  location:string
  status: "On Service" | "Ended" | "Reserved"
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