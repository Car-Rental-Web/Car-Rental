import DataTable, { type TableStyles } from "react-data-table-component";
import type { CustomTableProps } from "../types/types";


const customStyles:TableStyles = {
  headCells: {
    style: {
      justifyContent:"center",
      backgroundColor: "gray",
      textAlign: "center",
      fontSize: "16px",
      fontWeight: "bolder",
      fontFamily: "'Plus Jakarta Sans', sans-seriff",
      color: "white"
    },
  },
    rows: {
    style: {
      color: "black",        
      fontSize: "14px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      border: "1px solid gray",
    },
  },
  cells: {
    style: {
      justifyContent:"center",
      fontSize: "14px",
      textAlign: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
  },
 pagination: {
    style: {
      color: "gray"
    },
    pageButtonsStyle: {
      color: "gray",            
      fill: "gray",             
      backgroundColor: "transparent",
      borderRadius: "50%",
      "&:hover:not(:disabled)": {
        backgroundColor: "#054f6d",
      },
      "&:disabled": {
        color: "#888888",
        fill: "#888888",
      },
    },
  },
};

const TableData = <T,>({ ...props }: CustomTableProps<T>) => {
  return (
    <DataTable
      progressPending={props.progressPending}
      customStyles={customStyles}
      data={props.data}
      columns={props.columns}
      title={props.title}
      pagination={props.pagination}
      striped={props.striped}
      highlightOnHover={props.highlightOnHover}
      pointerOnHover={props.pointerOnHover}
      dense={props.dense}
      responsive={props.responsive}
      fixedHeader={props.fixedHeader}
      fixedHeaderScrollHeight={props.fixedHeaderScrollHeight}
      subHeader={props.subHeader}
      subHeaderComponent={props.subHeaderComponent}
      subHeaderAlign={props.subHeaderAlign}
      subHeaderWrap={props.subHeaderWrap}
      direction={props.direction}
      selectableRows={props.selectableRows}
    />
  );
};

export default TableData;